import { api, getToken } from './api'

export async function sendAlert(alert) {
  const storedAlerts = JSON.parse(localStorage.getItem('aegis_alerts') || '[]')
  localStorage.setItem('aegis_alerts', JSON.stringify([...storedAlerts, alert]))

  if (!getToken()) {
    return { success: true, id: alert.id, offline: true, testMode: false }
  }

  try {
    const result = await api('/alerts', { method: 'POST', body: JSON.stringify(alert) })
    return { success: true, id: result.id, offline: false, testMode: import.meta.env.VITE_TEST_MODE === 'true' }
  } catch {
    return { success: true, id: alert.id, offline: true, testMode: false }
  }
}
