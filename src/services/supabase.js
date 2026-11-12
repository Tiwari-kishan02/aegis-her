import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function hasSupabaseConfig() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function getStoredAccessToken() {
  return localStorage.getItem('aegis_token') || ''
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function signInWithOtp(email) {
  if (!hasSupabaseConfig()) {
    throw new Error('Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export async function verifyOtp({ email, token }) {
  if (!hasSupabaseConfig()) {
    throw new Error('Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    throw new Error(error.message)
  }

  if (data.session?.access_token) {
    localStorage.setItem('aegis_token', data.session.access_token)
  }

  return data
}

export async function saveProfile({ name, phone }) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Please sign in first.')

  const payload = {
    id: user.id,
    name: name?.trim() || user.email?.split('@')[0] || 'User',
    phone: phone?.trim() || '',
    is_admin: false,
  }

  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  localStorage.removeItem('aegis_token')
  if (error) throw new Error(error.message)
}
