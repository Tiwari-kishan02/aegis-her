import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../services/api'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }

    api('/alerts')
      .then((data) => setAlerts(data))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [navigate])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 py-4">
      <button type="button" onClick={() => navigate(-1)} className="mb-5 flex h-11 items-center gap-2 font-semibold text-aegis">
        Back
      </button>

      <h1 className="text-2xl font-bold text-aegis">Alert history</h1>

      {error && <p className="mt-3 text-sm text-sos">{error}</p>}

      {loading ? (
        <p className="mt-5 text-sm text-slate-500">Loading alert history...</p>
      ) : alerts.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          No alerts saved yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <article key={alert.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase text-aegis">{alert.type}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">
                  {alert.status}
                </span>
              </div>
              <p className="mt-2 text-base font-semibold text-slate-800">{alert.category}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(alert.created_at).toLocaleString()}</p>
              <p className="mt-2 text-xs text-slate-600">
                {alert.lat.toFixed(5)}, {alert.lng.toFixed(5)} · accuracy {Math.round(alert.accuracy)} m
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
