export async function sendAlert(alert) {
  const storedAlerts = JSON.parse(localStorage.getItem('aegis_alerts') || '[]')
  const nextAlerts = [...storedAlerts, alert]
  localStorage.setItem('aegis_alerts', JSON.stringify(nextAlerts))

  // TODO: In Phase 4, replace this local save with the FastAPI backend call.
  return {
    success: true,
    id: alert.id,
    testMode: import.meta.env.VITE_TEST_MODE === 'true',
  }
}
