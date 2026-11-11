-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "Users can read own contacts"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert own contacts"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contacts"
  on public.contacts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on public.contacts for delete
  using (auth.uid() = user_id);

create or replace function public.enforce_contact_limit()
returns trigger
language plpgsql
as $$
declare
  contact_count integer;
begin
  select count(*) into contact_count
  from public.contacts
  where user_id = NEW.user_id;

  if contact_count >= 5 then
    raise exception 'Maximum of 5 trusted contacts reached.';
  end if;

  return new;
end;
$$;

drop trigger if exists limit_contacts_per_user on public.contacts;
create trigger limit_contacts_per_user
  before insert or update on public.contacts
  for each row execute procedure public.enforce_contact_limit();

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('police', 'ambulance', 'cab')),
  category text not null,
  lat double precision,
  lng double precision,
  accuracy double precision default 0,
  status text not null default 'new' check (status in ('new', 'acknowledged', 'resolved')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.alerts enable row level security;

create policy "Users can read own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own alerts"
  on public.alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.alerts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.alerts for delete
  using (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  contact_name text,
  contact_phone text,
  message text not null,
  mode text not null default 'test',
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (
    exists (
      select 1 from public.alerts a
      where a.id = alert_id and a.user_id = auth.uid()
    )
  );

create policy "Users can insert notifications for own alerts"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.alerts a
      where a.id = alert_id and a.user_id = auth.uid()
    )
  );

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((
    select is_admin
    from public.profiles
    where id = auth.uid()
  ), false)
$$;

create or replace function public.notify_trusted_contacts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  contact_record record;
  message_text text;
begin
  for contact_record in
    select c.name, c.phone
    from public.contacts c
    where c.user_id = NEW.user_id
  loop
    message_text := trim(
      coalesce(NEW.type, '') || ' ' || coalesce(NEW.category, '') || ' ' ||
      coalesce(NEW.details::text, '') || ' https://maps.google.com/?q=' || NEW.lat || ',' || NEW.lng
    );

    insert into public.notifications (alert_id, contact_name, contact_phone, message, mode)
    values (NEW.id, contact_record.name, contact_record.phone, message_text, 'test');
  end loop;

  return NEW;
end;
$$;

drop trigger if exists alerts_create_notifications on public.alerts;
create trigger alerts_create_notifications
  after insert on public.alerts
  for each row execute procedure public.notify_trusted_contacts();

create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where alert_id in (
    select id from public.alerts where user_id = auth.uid()
  );

  delete from public.alerts where user_id = auth.uid();
  delete from public.contacts where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

create policy "Admins can read all alerts"
  on public.alerts for select
  using (public.is_admin());

create policy "Admins can update alert status"
  on public.alerts for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read all notifications"
  on public.notifications for select
  using (public.is_admin());

create policy "Users can read their own notifications via alerts"
  on public.notifications for select
  using (
    exists (
      select 1 from public.alerts a
      where a.id = alert_id and a.user_id = auth.uid()
    )
  );
