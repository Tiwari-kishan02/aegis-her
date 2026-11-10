import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, MapPinned } from 'lucide-react'
import L from 'leaflet'
import 'leaflet.heat'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../services/api'

const typeColors = {
  police: '#EF4444',
  ambulance: '#2563EB',
  cab: '#F59E0B',
}

function HeatLayer({ points, visible }) {
  const map = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    if (!visible || !points.length) {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
      return undefined
    }

    const layer = L.heatLayer(points, {
      radius: 20,
      blur: 18,
      maxZoom: 14,
      minOpacity: 0.4,
    })
    layer.addTo(map)
    heatRef.current = layer

    return () => {
      map.removeLayer(layer)
      heatRef.current = null
    }
  }, [map, points, visible])

  return null
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({ total_alerts: 0, by_type: {}, by_day: {} })
  const [filters, setFilters] = useState({ type: '', status: '', startDate: '', endDate: '' })
  const [heatVisible, setHeatVisible] = useState(true)
  const [markersVisible, setMarkersVisible] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const heatPoints = useMemo(
    () => alerts
      .filter((alert) => Number.isFinite(alert.lat) && Number.isFinite(alert.lng))
      .map((alert) => [alert.lat, alert.lng, 0.8]),
    [alerts],
  )

  const loadData = useCallback(async (nextFilters = filters) => {
    if (!getToken()) {
      navigate('/login')
      return
    }

    const params = new URLSearchParams()
    if (nextFilters.type) params.set('type', nextFilters.type)
    if (nextFilters.status) params.set('status', nextFilters.status)
    if (nextFilters.startDate) params.set('start_date', nextFilters.startDate)
    if (nextFilters.endDate) params.set('end_date', nextFilters.endDate)

    try {
      const [alertsResult, statsResult] = await Promise.all([
        api(`/admin/alerts?${params.toString()}`),
        api('/admin/stats'),
      ])
      setAlerts(alertsResult)
      setStats(statsResult)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [filters, navigate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const updateStatus = async (alertId, status) => {
    try {
      await api(`/admin/alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await loadData()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[1200px] flex-col bg-bg px-4 py-4">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex h-11 items-center gap-2 font-semibold text-aegis">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
      </button>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-aegis">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900">Alerts dashboard</h1>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Admin access</div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total alerts</p>
          <p className="mt-2 text-3xl font-bold text-aegis">{stats.total_alerts}</p>
        </div>
        {Object.entries(stats.by_type || {}).map(([type, count]) => (
          <div key={type} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{type}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: typeColors[type] || '#4C1D95' }}>{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="h-11 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">All alert types</option>
            <option value="police">Police</option>
            <option value="ambulance">Ambulance</option>
            <option value="cab">Cab</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-11 rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
          <input type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
        </div>
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => loadData(filters)} className="rounded-lg bg-aegis px-4 py-2 text-sm font-bold text-white">Apply filters</button>
          <button type="button" onClick={() => { setFilters({ type: '', status: '', startDate: '', endDate: '' }); loadData({ type: '', status: '', startDate: '', endDate: '' }) }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Reset</button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPinned className="h-4 w-4 text-aegis" aria-hidden="true" />
            <span className="font-semibold">Alert map</span>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <button type="button" onClick={() => setMarkersVisible((value) => !value)} className={`rounded-full px-2 py-1 ${markersVisible ? 'bg-aegis text-white' : 'bg-slate-100 text-slate-600'}`}>
              Markers
            </button>
            <button type="button" onClick={() => setHeatVisible((value) => !value)} className={`rounded-full px-2 py-1 ${heatVisible ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Heatmap
            </button>
          </div>
        </div>

        <div className="h-[380px] overflow-hidden rounded-lg">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {heatVisible && <HeatLayer points={heatPoints} visible={heatVisible} />}
            {markersVisible && alerts.filter((alert) => Number.isFinite(alert.lat) && Number.isFinite(alert.lng)).map((alert) => (
              <Marker key={alert.id} position={[alert.lat, alert.lng]} icon={new L.Icon.Default()}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-aegis">{alert.type}</p>
                    <p>{alert.category}</p>
                    <p>Status: {alert.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-5 text-slate-500">Loading alerts...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-5 text-slate-500">No alerts found.</td></tr>
              ) : alerts.map((alert) => (
                <tr key={alert.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{alert.type}</td>
                  <td className="px-4 py-3 text-slate-700">{alert.category}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">{alert.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(alert.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select value={alert.status} onChange={(event) => updateStatus(alert.id, event.target.value)} className="h-9 rounded border border-slate-200 px-2 text-xs">
                      <option value="new">New</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
