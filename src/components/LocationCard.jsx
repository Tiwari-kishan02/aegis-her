import { MapPin } from 'lucide-react'
import MapView from './MapView'

export default function LocationCard({ position, status, error, requestLocation }) {
  const isLoading = status === 'loading'
  const needsPermission = status === 'idle' || status === 'denied' || status === 'unsupported' || status === 'error'

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <MapView position={position} />

      <div className="mt-3 min-h-[92px]">
        {position && status === 'granted' ? (
          <div className="flex items-start gap-2 text-left">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-aegis" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Your current location</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </p>
              <p className="text-xs text-slate-500">
                Accuracy: {Math.round(position.accuracy || 0)} meters
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[92px] items-center justify-center text-sm font-medium text-aegis">
            Getting your location...
          </div>
        ) : (
          <div className="text-left text-sm text-slate-600">
            <p>{error || 'Turn on location to continue.'}</p>
            {needsPermission && (
              <button
                type="button"
                onClick={requestLocation}
                className="mt-3 w-full rounded-lg bg-aegis px-4 py-3 font-semibold text-white"
              >
                {status === 'idle' ? 'Turn on location' : 'Retry location'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
