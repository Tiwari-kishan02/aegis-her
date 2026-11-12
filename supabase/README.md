# Supabase setup

## 1) Run the schema

Open your Supabase project SQL Editor and paste the contents of `../supabase/schema.sql`.

## 2) Enable email auth

- Open Supabase Dashboard -> Authentication -> Providers.
- Turn on Email.
- Set `Enable email confirmations` to `Off` for local demo use.
- Add `http://localhost:5173/` and `https://aegis.kishantech.me/` to the allowed redirect URLs.

## 3) Configure redirect URLs

Use these examples:

- `http://localhost:5173/`
- `https://aegis.kishantech.me/`
- `https://aegis.kishantech.me/#/login`

## 4) Make a user admin

In the Supabase SQL editor:

```sql
update public.profiles
set is_admin = true
where phone = '+919000000000';
```

Or update the same row from the `profiles` table in the Dashboard.

## 5) Verify

- Sign up and confirm OTP login
- Create contacts and alerts
- Confirm the notifications table receives a row per trusted contact
- Visit `/admin` as an admin to view alerts and stats
