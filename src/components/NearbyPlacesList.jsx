import { Navigation, Phone } from 'lucide-react'

export default function NearbyPlacesList({ places, status, error, type = 'police' }) {
  const label = type === 'police' ? 'police stations' : 'hospitals/clinics'
  return (
    <div className="mt-4">
      <h2 className="mb-2 text-base font-bold text-aegis">Nearest {label}</h2>
      {status === 'loading' && <p className="text-sm text-slate-600">Finding nearby {label}...</p>}
      {status === 'error' && <p className="text-sm text-sos">{error}</p>}
      {status === 'none' && <p className="text-sm text-slate-600">No {label} found within 5 km.</p>}
      {status === 'success' && (
        <div className="space-y-2">
          {places.map((place) => (
            <div key={`${place.lat}-${place.lng}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-slate-800">{place.name}</p>
              <p className="mt-1 text-xs text-slate-500">{place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center justify-center gap-1 rounded-lg bg-aegis text-xs font-bold text-white"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" /> Navigate
                </a>
                {place.phone ? (
                  <a href={`tel:${place.phone}`} className="flex h-10 items-center justify-center gap-1 rounded-lg border border-aegis text-xs font-bold text-aegis">
                    <Phone className="h-4 w-4" aria-hidden="true" /> Call
                  </a>
                ) : (
                  <button type="button" disabled className="h-10 rounded-lg border border-slate-200 text-xs text-slate-400">No phone</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
