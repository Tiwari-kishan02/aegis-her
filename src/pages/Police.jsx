import { ArrowLeft, Navigation, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IncidentPicker from '../components/IncidentPicker'
import LocationCard from '../components/LocationCard'
import { incidentTypes } from '../data/incidentTypes'
import useLocation from '../hooks/useLocation'
import { sendAlert } from '../services/alerts'
import { getNearbyPoliceStations } from '../services/places'

export default function Police() {
  const navigate = useNavigate()
  const { position, status, error, requestLocation } = useLocation()
  const [step, setStep] = useState(1)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [stations, setStations] = useState([])
  const [placesStatus, setPlacesStatus] = useState('idle')
  const [placesError, setPlacesError] = useState('')
  const [savedAlert, setSavedAlert] = useState(null)

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    if (!position || status !== 'granted') return

    let active = true
    queueMicrotask(() => {
      if (active) setPlacesStatus('loading')
    })
    getNearbyPoliceStations(position)
      .then((results) => {
        if (!active) return
        setStations(results)
        setPlacesStatus(results.length ? 'success' : 'none')
      })
      .catch((placesFailure) => {
        if (!active) return
        setPlacesError(placesFailure.message || 'Could not load nearby police stations.')
        setPlacesStatus('error')
      })

    return () => {
      active = false
    }
  }, [position, status])

  const handleBack = () => {
    if (step === 1) navigate(-1)
    else setStep((currentStep) => currentStep - 1)
  }

  const confirmComplaint = async () => {
    const now = new Date().toISOString()
    const id = globalThis.crypto?.randomUUID?.()
      || `AEG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const alert = {
      id,
      type: 'police',
      category: selectedIncident.label,
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      timestamp: now,
    }
    const result = await sendAlert(alert)
    setSavedAlert(result)
    setStep(4)
  }

  if (step === 4 && savedAlert) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 pb-5 pt-5 text-center">
        <div className="mt-12 rounded-lg border border-slate-200 bg-white px-5 py-8 shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sos text-3xl font-bold text-white">✓</div>
          <h1 className="mt-5 text-xl font-bold text-aegis">
            {savedAlert.offline ? 'Saved offline, will not notify contacts' : 'Complaint registered (saved locally)'}
          </h1>
          <p className="mt-3 text-sm text-slate-600">Alert ID</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-800">{savedAlert.id}</p>
          {savedAlert.testMode && (
            <div className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
              TEST MODE: no real alert sent
            </div>
          )}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
          <a href="tel:112" className="grid h-12 place-items-center rounded-lg bg-sos font-bold text-white">Call 112</a>
          <button type="button" onClick={() => navigate('/')} className="rounded-lg border border-aegis font-bold text-aegis">
            Back to home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 pb-5 pt-3">
      <button type="button" onClick={handleBack} className="flex h-11 items-center gap-2 font-semibold text-aegis">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </button>

      <section className="-mx-5 bg-sos px-5 py-4 text-white">
        <div className="mb-3 flex items-center gap-2" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((item) => (
            <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-white' : 'bg-white/35'}`} />
          ))}
        </div>
        <p className="text-xs font-semibold uppercase">Step {step} of 3</p>
        <h1 className="mt-1 text-2xl font-bold">Police</h1>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href="tel:112" className="grid h-11 place-items-center rounded-lg bg-sos font-bold text-white">Call 112</a>
        <a href="tel:1091" className="grid h-11 place-items-center rounded-lg border border-sos font-bold text-sos">Women helpline 1091</a>
      </div>

      {step === 1 && (
        <section className="mt-4">
          <LocationCard position={position} status={status} error={error} requestLocation={requestLocation} />

          <div className="mt-4">
            <h2 className="mb-2 text-base font-bold text-aegis">Nearest police stations</h2>
            {placesStatus === 'loading' && <p className="text-sm text-slate-600">Finding nearby stations...</p>}
            {placesStatus === 'error' && <p className="text-sm text-sos">{placesError}</p>}
            {placesStatus === 'none' && <p className="text-sm text-slate-600">No police stations found within 5 km.</p>}
            {placesStatus === 'success' && (
              <div className="space-y-2">
                {stations.map((station) => (
                  <div key={`${station.lat}-${station.lng}`} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-bold text-slate-800">{station.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{station.distance < 1 ? `${Math.round(station.distance * 1000)} m` : `${station.distance.toFixed(1)} km`}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center gap-1 rounded-lg bg-aegis text-xs font-bold text-white"
                      >
                        <Navigation className="h-4 w-4" aria-hidden="true" /> Navigate
                      </a>
                      {station.phone ? (
                        <a href={`tel:${station.phone}`} className="flex h-10 items-center justify-center gap-1 rounded-lg border border-aegis text-xs font-bold text-aegis">
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

          <button
            type="button"
            disabled={status !== 'granted'}
            onClick={() => setStep(2)}
            className="mt-4 h-12 w-full rounded-lg bg-sos font-bold text-white disabled:bg-slate-300 disabled:text-slate-500"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-4">
          <h2 className="mb-3 text-lg font-bold text-aegis">What happened?</h2>
          <IncidentPicker incidents={incidentTypes} selectedId={selectedIncident?.id} onSelect={setSelectedIncident} />
          <button
            type="button"
            disabled={!selectedIncident}
            onClick={() => setStep(3)}
            className="mt-4 h-12 w-full rounded-lg bg-sos font-bold text-white disabled:bg-slate-300 disabled:text-slate-500"
          >
            Continue
          </button>
        </section>
      )}

      {step === 3 && selectedIncident && (
        <section className="mt-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-aegis">Confirm complaint</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Incident</dt>
                <dd className="text-right font-semibold text-slate-800">{selectedIncident.label}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Location</dt>
                <dd className="text-right font-semibold text-slate-800">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Accuracy</dt>
                <dd className="text-right font-semibold text-slate-800">{Math.round(position.accuracy || 0)} meters</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Time</dt>
                <dd className="text-right font-semibold text-slate-800">{new Date().toLocaleString()}</dd>
              </div>
            </dl>
          </div>
          <button type="button" onClick={confirmComplaint} className="mt-4 h-12 w-full rounded-lg bg-sos font-bold text-white">
            Confirm complaint
          </button>
        </section>
      )}
    </main>
  )
}
