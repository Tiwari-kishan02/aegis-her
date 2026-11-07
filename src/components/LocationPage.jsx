import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useLocation from '../hooks/useLocation'
import LocationCard from './LocationCard'

export default function LocationPage({ title, accentClass = 'bg-aegis' }) {
  const navigate = useNavigate()
  const { position, status, error, requestLocation } = useLocation()

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 pb-5 pt-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex h-11 items-center gap-2 text-left font-semibold text-aegis"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </button>

      <section className={`${accentClass} -mx-5 px-5 py-4 text-white`}>
        <p className="text-xs font-semibold uppercase">Step 1 of 2</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-white/90">Confirm your location</p>
      </section>

      <div className="mt-4">
        <LocationCard
          position={position}
          status={status}
          error={error}
          requestLocation={requestLocation}
        />
      </div>

      <button
        type="button"
        disabled={status !== 'granted'}
        className="mt-auto h-12 w-full rounded-lg bg-aegis font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        Continue
      </button>
    </main>
  )
}
