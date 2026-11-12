import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MicButton from '../components/MicButton'
import useLocation from '../hooks/useLocation'
import useVoice from '../hooks/useVoice'
import LocationCard from '../components/LocationCard'
import StepIndicator from '../components/StepIndicator'
import IncidentPicker from '../components/IncidentPicker'
import { medicalTypes } from '../data/medicalTypes'
import { ambulanceEmergencyKeywords } from '../data/voiceKeywords'
import { getNearbyHospitals } from '../services/places'
import NearbyPlacesList from '../components/NearbyPlacesList'
import ConfirmScreen from '../components/ConfirmScreen'
import SuccessScreen from '../components/SuccessScreen'
import { sendAlert } from '../services/alerts'

export default function Ambulance() {
  const navigate = useNavigate()
  const { position, status, error, requestLocation } = useLocation()
  const voice = useVoice()
  const [step, setStep] = useState(1)
  const [selectedEmergency, setSelectedEmergency] = useState(null)
  const [places, setPlaces] = useState([])
  const [placesStatus, setPlacesStatus] = useState('idle')
  const [placesError, setPlacesError] = useState('')
  const [savedAlert, setSavedAlert] = useState(null)

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const detectedEmergency = useMemo(() => {
    if (!voice.transcript) return null

    const transcript = voice.transcript.toLowerCase()
    return medicalTypes.find((emergency) => {
      const keywords = ambulanceEmergencyKeywords[emergency.label] || []
      return keywords.some((keyword) => transcript.includes(keyword.toLowerCase()))
    })
  }, [voice.transcript])

  useEffect(() => {
    if (!detectedEmergency || detectedEmergency.id === selectedEmergency?.id) return

    const timer = window.setTimeout(() => {
      setSelectedEmergency(detectedEmergency)
      voice.stop()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [detectedEmergency, selectedEmergency, voice])

  useEffect(() => {
    if (!position || status !== 'granted') return
    let active = true
    queueMicrotask(() => {
      if (active) setPlacesStatus('loading')
    })
    getNearbyHospitals(position)
      .then((results) => {
        if (!active) return
        setPlaces(results)
        setPlacesStatus(results.length ? 'success' : 'none')
      })
      .catch((placesFailure) => {
        if (!active) return
        setPlacesError(placesFailure.message || 'Could not load nearby hospitals.')
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

  const confirmEmergency = async (details) => {
    const now = new Date().toISOString()
    const id = globalThis.crypto?.randomUUID?.()
      || `AEG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const alert = {
      id,
      type: 'ambulance',
      category: selectedEmergency.label,
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      timestamp: now,
      patientDetails: details || '',
    }
    const result = await sendAlert(alert)
    setSavedAlert({ ...result, shareData: alert })
    setStep(4)
  }

  if (step === 4 && savedAlert) {
    return <SuccessScreen alert={savedAlert} onBack={() => navigate('/')} type="ambulance" />
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 pb-5 pt-3">
      <button type="button" onClick={handleBack} className="flex h-11 items-center gap-2 font-semibold text-aegis">
        Back
      </button>
      <section className="-mx-5 bg-ambulance px-5 py-4 text-white">
        <StepIndicator step={step} total={3} accent="bg-white" />
        <p className="text-xs font-semibold uppercase">Step {step} of 3</p>
        <h1 className="mt-1 text-2xl font-bold">Ambulance</h1>
      </section>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href="tel:108" className="grid h-11 place-items-center rounded-lg bg-ambulance font-bold text-white">Call 108</a>
        <a href="tel:102" className="grid h-11 place-items-center rounded-lg border border-ambulance font-bold text-ambulance">Call 102</a>
        <a href="tel:112" className="grid h-11 place-items-center rounded-lg border border-ambulance font-bold text-ambulance">Call 112</a>
      </div>
      {step === 1 && (
        <section className="mt-4">
          <LocationCard position={position} status={status} error={error} requestLocation={requestLocation} />
          <NearbyPlacesList places={places} status={placesStatus} error={placesError} type="hospital" />
          <button
            type="button"
            disabled={status !== 'granted'}
            onClick={() => setStep(2)}
            className="mt-4 h-12 w-full rounded-lg bg-ambulance font-bold text-white disabled:bg-slate-300 disabled:text-slate-500"
          >
            Continue
          </button>
        </section>
      )}
      {step === 2 && (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-aegis">What is the emergency?</h2>
            <MicButton
              listening={voice.listening}
              transcript={voice.transcript}
              supported={voice.supported}
              language={voice.language}
              onToggle={() => {
                if (voice.listening) voice.stop()
                else voice.start()
              }}
              onLanguageChange={voice.setLanguage}
            />
          </div>
          {selectedEmergency && (
            <p className="mb-2 text-xs font-medium text-slate-600">Detected: {selectedEmergency.label}</p>
          )}
          <IncidentPicker incidents={medicalTypes} selectedId={selectedEmergency?.id} onSelect={setSelectedEmergency} />
          <button
            type="button"
            disabled={!selectedEmergency}
            onClick={() => setStep(3)}
            className="mt-4 h-12 w-full rounded-lg bg-ambulance font-bold text-white disabled:bg-slate-300 disabled:text-slate-500"
          >
            Continue
          </button>
        </section>
      )}
      {step === 3 && selectedEmergency && (
        <ConfirmScreen
          type="ambulance"
          incident={selectedEmergency}
          position={position}
          onConfirm={confirmEmergency}
          onBack={handleBack}
          showPatientDetails
        />
      )}
    </main>
  )
}
