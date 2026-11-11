import { api, getToken } from './api'

const ALERT_QUEUE_KEY = 'aegis_alert_queue'

function readQueuedAlerts() {
  try {
    return JSON.parse(localStorage.getItem(ALERT_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function persistQueuedAlerts(items) {
  localStorage.setItem(ALERT_QUEUE_KEY, JSON.stringify(items))
}

export async function retryQueuedAlerts() {
  if (!navigator.onLine || !getToken()) return []

  const queuedAlerts = readQueuedAlerts()
  if (!queuedAlerts.length) return []

  const remaining = []

  for (const queuedAlert of queuedAlerts) {
    try {
      await api('/alerts', { method: 'POST', body: JSON.stringify(queuedAlert) })
    } catch {
      remaining.push(queuedAlert)
    }
  }

  persistQueuedAlerts(remaining)
  return remaining
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void retryQueuedAlerts()
  })
}

export async function sendAlert(alert) {
  const nextAlert = {
    ...alert,
    id: alert.id || `offline-${Date.now()}`,
    queuedAt: new Date().toISOString(),
  }

  const queuedAlerts = readQueuedAlerts()
  persistQueuedAlerts([...queuedAlerts, nextAlert])

  if (!navigator.onLine || !getToken()) {
    return {
      success: true,
      id: nextAlert.id,
      offline: true,
      testMode: import.meta.env.VITE_TEST_MODE === 'true',
    }
  }

  try {
    const result = await api('/alerts', { method: 'POST', body: JSON.stringify(alert) })
    const remaining = readQueuedAlerts().filter((item) => item.id !== nextAlert.id)
    persistQueuedAlerts(remaining)

    return {
      success: true,
      id: result?.id || nextAlert.id,
      offline: false,
      testMode: import.meta.env.VITE_TEST_MODE === 'true',
    }
  } catch {
    return {
      success: true,
      id: nextAlert.id,
      offline: true,
      testMode: import.meta.env.VITE_TEST_MODE === 'true',
    }
  }
}
