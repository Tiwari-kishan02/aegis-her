import { getCurrentUser, hasSupabaseConfig, supabase } from './supabase'

export function getToken() {
  return localStorage.getItem('aegis_token') || ''
}

function parseBody(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value || {}
}

async function getUserId() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Please sign in to continue.')
  return user.id
}

function buildAlertPayload(rawBody) {
  const body = parseBody(rawBody)
  const payload = {
    type: body.type,
    category: body.category,
    lat: Number(body.lat),
    lng: Number(body.lng),
    accuracy: Number(body.accuracy ?? 0),
    status: body.status || 'new',
    details: body.details || {},
    created_at: body.timestamp || new Date().toISOString(),
  }

  if (body.patientDetails) {
    payload.details = {
      ...(payload.details || {}),
      patientDetails: body.patientDetails,
    }
  }

  return payload
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()

  if (!hasSupabaseConfig()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  if (path === '/me' && method === 'DELETE') {
    const { error } = await supabase.rpc('delete_my_data')
    if (error) throw new Error(error.message)
    localStorage.removeItem('aegis_token')
    return null
  }

  if (path === '/contacts') {
    if (method === 'GET') {
      const userId = await getUserId()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data || []
    }

    if (method === 'POST') {
      const userId = await getUserId()
      const body = parseBody(options.body)
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          name: body.name,
          phone: body.phone,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    }
  }

  if (path.startsWith('/contacts/')) {
    const id = path.split('/').filter(Boolean)[1]
    if (method === 'DELETE') {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return null
    }
  }

  if (path === '/alerts') {
    if (method === 'GET') {
      const userId = await getUserId()
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data || []
    }

    if (method === 'POST') {
      const userId = await getUserId()
      const payload = buildAlertPayload(options.body)
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          user_id: userId,
          type: payload.type,
          category: payload.category,
          lat: payload.lat,
          lng: payload.lng,
          accuracy: payload.accuracy,
          status: payload.status,
          details: payload.details,
          created_at: payload.created_at,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    }
  }

  if (path.startsWith('/admin/alerts')) {
    const url = new URL(path, 'https://supabase.local')
    const query = supabase.from('alerts').select('*')

    if (url.searchParams.get('type')) query.eq('type', url.searchParams.get('type'))
    if (url.searchParams.get('status')) query.eq('status', url.searchParams.get('status'))
    if (url.searchParams.get('start_date')) query.gte('created_at', new Date(`${url.searchParams.get('start_date')}T00:00:00Z`).toISOString())
    if (url.searchParams.get('end_date')) query.lte('created_at', new Date(`${url.searchParams.get('end_date')}T23:59:59Z`).toISOString())

    if (method === 'GET') {
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data || []
    }

    if (method === 'PATCH') {
      const id = path.split('/').filter(Boolean)[2]
      const body = parseBody(options.body)
      const { data, error } = await supabase
        .from('alerts')
        .update({ status: body.status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    }
  }

  if (path === '/admin/stats') {
    const { data, error } = await supabase.from('alerts').select('type, created_at')
    if (error) throw new Error(error.message)

    const payload = { total_alerts: data.length, by_type: {}, by_day: {} }
    for (const alert of data) {
      payload.by_type[alert.type] = (payload.by_type[alert.type] || 0) + 1
      const dateKey = new Date(alert.created_at).toISOString().slice(0, 10)
      payload.by_day[dateKey] = (payload.by_day[dateKey] || 0) + 1
    }
    return payload
  }

  throw new Error(`Unsupported API route: ${path}`)
}
