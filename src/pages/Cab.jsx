import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Clock3, Navigation, ShieldCheck } from 'lucide-react'
import { Marker, Polyline } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import MicButton from '../components/MicButton'
import LocationCard from '../components/LocationCard'
import MapView from '../components/MapView'
import StepIndicator from '../components/StepIndicator'
import useLocation from '../hooks/useLocation'
import useVoice from '../hooks/useVoice'
import { searchPlaces } from '../services/geocode'
import { openRideLink } from '../services/rideLinks'
import { sendAlert } from '../services/alerts'
import TrustedContactShare from '../components/TrustedContactShare'

const rideProviders = ['Uber', 'Ola', 'Rapido']

function getDirectDistanceKm(start, end) {
  if (!start || !end) return 0
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadius = 6371
  const deltaLat = toRadians(end.lat - start.lat)
  const deltaLng = toRadians(end.lng - start.lng)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) * Math.sin(deltaLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Cab() {
  const navigate = useNavigate()
  const { position, status, error, requestLocation } = useLocation()
  const voice = useVoice()
  const [step, setStep] = useState(1)
  const [pickup, setPickup] = useState(null)
  const [pickupQuery, setPickupQuery] = useState('')
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [destination, setDestination] = useState(null)
  const [destinationQuery, setDestinationQuery] = useState('')
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [route, setRoute] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [selectedRide, setSelectedRide] = useState('')
  const [shareFormVisible, setShareFormVisible] = useState(false)
  const [driverName, setDriverName] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [cabCompany, setCabCompany] = useState('')
  const [arrivalMinutes, setArrivalMinutes] = useState(30)
  const [customArrivalMinutes, setCustomArrivalMinutes] = useState('')
  const [countdownSeconds, setCountdownSeconds] = useState(null)
  const [warningSeconds, setWarningSeconds] = useState(0)
  const [reachedSafely, setReachedSafely] = useState(false)
  const [noCheckinSent, setNoCheckinSent] = useState(false)
  const [shareAlert, setShareAlert] = useState(null)

  const activeArrivalMinutes = customArrivalMinutes && Number(customArrivalMinutes) > 0
    ? Number(customArrivalMinutes)
    : arrivalMinutes

  const defaultPickup = status === 'granted' && position
    ? {
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        label: 'Current location',
      }
    : null

  const pickupLocation = pickup || defaultPickup
  const pickupSearchTimer = useRef(null)
  const destinationSearchTimer = useRef(null)

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    if (!pickupLocation || !destination) return

    const buildRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickupLocation.lng},${pickupLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`,
        )

        if (!response.ok) throw new Error('Route unavailable')

        const data = await response.json()
        const routeSummary = data.routes?.[0]
        if (!routeSummary) throw new Error('No route found')

        const points = routeSummary.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        const distanceKm = routeSummary.distance / 1000
        const etaMinutes = Math.max(3, Math.round(routeSummary.duration / 60))

        setRoute({ points, distanceKm, etaMinutes })
        setRouteError('')
      } catch {
        const directKm = getDirectDistanceKm(pickupLocation, destination)
        setRoute({
          points: [
            [pickupLocation.lat, pickupLocation.lng],
            [destination.lat, destination.lng],
          ],
          distanceKm: directKm,
          etaMinutes: Math.max(5, Math.round(directKm * 2.5)),
        })
        setRouteError('Using a straight-line estimate because live routing is unavailable.')
      }
    }

    buildRoute()
  }, [pickupLocation, destination])

  useEffect(() => {
    if (!shareFormVisible || reachedSafely || noCheckinSent) return undefined

    const totalSeconds = Math.max(30, activeArrivalMinutes * 60)
    const startTime = Date.now()
    let warningStart = null

    window.setTimeout(() => {
      setCountdownSeconds(totalSeconds)
      setWarningSeconds(0)
    }, 0)

    const timer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

      if (elapsedSeconds < totalSeconds) {
        setCountdownSeconds(totalSeconds - elapsedSeconds)
        return
      }

      if (!warningStart) {
        warningStart = Date.now()
        setCountdownSeconds(0)
        setWarningSeconds(60)
        return
      }

      const warningLeft = Math.max(0, 60 - Math.ceil((Date.now() - warningStart) / 1000))
      setWarningSeconds(warningLeft)

      if (warningLeft === 0) {
        const alert = {
          id: globalThis.crypto?.randomUUID?.() || `AEG-CAB-${Date.now()}`,
          type: 'cab',
          category: 'no_checkin',
          lat: pickupLocation?.lat ?? position?.lat,
          lng: pickupLocation?.lng ?? position?.lng,
          accuracy: pickupLocation?.accuracy ?? position?.accuracy ?? 0,
          timestamp: new Date().toISOString(),
          details: {
            destination: destination?.displayName || destination?.label || 'Destination',
            driverName: driverName || '',
            vehicleNumber: vehicleNumber || '',
            cabCompany: cabCompany || selectedRide,
          },
        }

        sendAlert(alert)
        setNoCheckinSent(true)
        window.clearInterval(timer)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [shareFormVisible, activeArrivalMinutes, reachedSafely, noCheckinSent, pickupLocation, position, destination, driverName, vehicleNumber, cabCompany, selectedRide])

  const handlePickupQueryChange = (value) => {
    setPickupQuery(value)
    if (!value.trim()) {
      setPickupSuggestions([])
      return
    }

    if (pickupSearchTimer.current) {
      window.clearTimeout(pickupSearchTimer.current)
    }

    pickupSearchTimer.current = window.setTimeout(async () => {
      const results = await searchPlaces(value)
      setPickupSuggestions(results)
    }, 500)
  }

  const handleDestinationQueryChange = (value) => {
    setDestinationQuery(value)
    if (!value.trim()) {
      setDestinationSuggestions([])
      return
    }

    if (destinationSearchTimer.current) {
      window.clearTimeout(destinationSearchTimer.current)
    }

    destinationSearchTimer.current = window.setTimeout(async () => {
      const results = await searchPlaces(value)
      setDestinationSuggestions(results)
    }, 500)
  }

  useEffect(() => {
    if (!voice.transcript) return

    const transcript = voice.transcript.trim()
    if (!transcript) return

    const normalized = transcript.toLowerCase()
    if (step === 2) {
      const findAutocomplete = async () => {
        const results = await searchPlaces(transcript)
        if (results[0]) {
          setDestination({
            lat: Number(results[0].lat),
            lng: Number(results[0].lng),
            displayName: results[0].displayName,
            label: results[0].displayName,
          })
          setDestinationQuery(results[0].displayName)
          setDestinationSuggestions([])
          voice.stop()
        }
      }

      if (!normalized.includes('cancel') && !normalized.includes('skip')) {
        findAutocomplete()
      }
    }
  }, [step, voice])

  const handleBack = () => {
    if (step === 1) navigate(-1)
    else setStep((currentStep) => currentStep - 1)
  }

  const handlePickupSelected = (place) => {
    setPickup({
      lat: Number(place.lat),
      lng: Number(place.lng),
      accuracy: 25,
      label: place.displayName,
    })
    setPickupQuery(place.displayName)
    setPickupSuggestions([])
  }

  const handleDestinationSelected = (place) => {
    setDestination({
      lat: Number(place.lat),
      lng: Number(place.lng),
      displayName: place.displayName,
      label: place.displayName,
    })
    setDestinationQuery(place.displayName)
    setDestinationSuggestions([])
  }

  const handleRideSelection = (provider) => {
    setSelectedRide(provider)
    setShareFormVisible(true)
    openRideLink(provider, pickup, destination)
  }

  const handleShareRide = async () => {
    const alert = {
      id: globalThis.crypto?.randomUUID?.() || `AEG-SHARE-${Date.now()}`,
      type: 'cab',
      category: 'ride_shared',
      lat: pickup?.lat ?? position?.lat,
      lng: pickup?.lng ?? position?.lng,
      accuracy: pickup?.accuracy ?? position?.accuracy ?? 0,
      timestamp: new Date().toISOString(),
      details: {
        destination: destination?.displayName || destination?.label || 'Destination',
        driverName: driverName || '',
        vehicleNumber: vehicleNumber || '',
        cabCompany: cabCompany || selectedRide,
        rideProvider: selectedRide,
      },
    }

    const result = await sendAlert(alert)
    setShareAlert({ ...result, shareData: alert })
  }

  const renderStepOne = () => (
    <section className="mt-4 space-y-4">
      <LocationCard
        position={pickup || position}
        status={status}
        error={error}
        requestLocation={requestLocation}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Search pickup
        </label>
        <input
          type="text"
          value={pickupQuery}
          onChange={(event) => handlePickupQueryChange(event.target.value)}
          placeholder="Type a pickup location"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cab"
        />
        {pickupSuggestions.length > 0 && (
          <div className="mt-2 space-y-2">
            {pickupSuggestions.map((place) => (
              <button
                key={place.placeId || place.displayName}
                type="button"
                onClick={() => handlePickupSelected(place)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700"
              >
                {place.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={status !== 'granted' || !pickup}
        onClick={() => setStep(2)}
        className="h-12 w-full rounded-lg bg-cab font-bold text-white disabled:bg-slate-300 disabled:text-slate-500"
      >
        Continue
      </button>
    </section>
  )

  const renderStepTwo = () => (
    <section className="mt-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Destination
          </label>
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
        <input
          type="text"
          value={destinationQuery}
          onChange={(event) => handleDestinationQueryChange(event.target.value)}
          placeholder="Search your destination"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cab"
        />
        {destinationSuggestions.length > 0 && (
          <div className="mt-2 space-y-2">
            {destinationSuggestions.map((place) => (
              <button
                key={place.placeId || place.displayName}
                type="button"
                onClick={() => handleDestinationSelected(place)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700"
              >
                {place.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!destination}
        onClick={() => setStep(3)}
        className="h-12 w-full rounded-lg bg-cab font-bold text-white disabled:bg-slate-300 disabled:text-slate-500"
      >
        Continue
      </button>
    </section>
  )

  const renderStepThree = () => (
    <section className="mt-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>Route preview</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
            {route?.distanceKm ? `${route.distanceKm.toFixed(1)} km` : 'Calculating...'}
          </span>
        </div>

        <MapView position={pickup || position} height={220}>
          {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
          {destination && <Marker position={[destination.lat, destination.lng]} />}
          {route?.points && (
            <Polyline positions={route.points} pathOptions={{ color: '#F59E0B', weight: 4 }} />
          )}
        </MapView>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Distance</p>
            <p className="mt-1 font-semibold">
              {route ? `${route.distanceKm.toFixed(1)} km` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">ETA</p>
            <p className="mt-1 font-semibold">
              {route ? `${route.etaMinutes} min` : '—'}
            </p>
          </div>
        </div>

        {routeError && <p className="mt-3 text-xs text-amber-700">{routeError}</p>}
      </div>

      <button
        type="button"
        onClick={() => setStep(4)}
        className="h-12 w-full rounded-lg bg-cab font-bold text-white"
      >
        Continue to booking
      </button>
    </section>
  )

  const renderStepFour = () => (
    <section className="mt-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Book a ride</p>
        <p className="mt-2 text-sm text-slate-600">Compare prices in each app, then book.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {rideProviders.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleRideSelection(provider)}
              className={`h-11 rounded-lg border font-bold ${selectedRide === provider ? 'border-cab bg-cab text-white' : 'border-cab text-cab'}`}
            >
              {provider}
            </button>
          ))}
        </div>
      </div>

      {shareFormVisible && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-cab">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <p className="text-sm font-bold">Share my ride</p>
          </div>

          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={driverName}
              onChange={(event) => setDriverName(event.target.value)}
              placeholder="Driver name (optional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={vehicleNumber}
              onChange={(event) => setVehicleNumber(event.target.value)}
              placeholder="Vehicle number (optional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={cabCompany}
              onChange={(event) => setCabCompany(event.target.value)}
              placeholder="Cab company (optional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Expected arrival</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[30, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setArrivalMinutes(minutes)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${arrivalMinutes === minutes ? 'bg-cab text-white' : 'bg-white text-cab border border-cab'}`}
                >
                  {minutes} min
                </button>
              ))}
              <input
                type="number"
                min="5"
                max="240"
                value={customArrivalMinutes}
                onChange={(event) => setCustomArrivalMinutes(event.target.value)}
                placeholder="Custom"
                className="w-20 rounded-full border border-cab px-2 py-1 text-xs text-slate-700"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
            <Clock3 className="h-4 w-4 text-cab" aria-hidden="true" />
            <span>
              {warningSeconds > 0
                ? `No check-in warning: ${warningSeconds}s`
                : countdownSeconds !== null && countdownSeconds > 0
                  ? `Auto-check in in ${countdownSeconds}s`
                  : 'Timer ready'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setReachedSafely(true)
                setCountdownSeconds(null)
                setWarningSeconds(0)
              }}
              className="rounded-lg border border-cab font-bold text-cab"
            >
              I reached safely
            </button>
            <button
              type="button"
              onClick={handleShareRide}
              className="rounded-lg bg-cab font-bold text-white"
            >
              Notify trusted contacts
            </button>
          </div>

          {shareAlert && (
            <>
              <p className="mt-3 text-sm font-medium text-emerald-700">
                Ride shared successfully. Alert id: {shareAlert.id}
              </p>
              <TrustedContactShare alert={shareAlert.shareData} />
            </>
          )}
        </div>
      )}
    </section>
  )

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 pb-5 pt-3">
      <button type="button" onClick={handleBack} className="flex h-11 items-center gap-2 font-semibold text-aegis">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </button>

      <section className="-mx-5 bg-cab px-5 py-4 text-white">
        <StepIndicator step={step} total={4} accent="bg-white" />
        <p className="text-xs font-semibold uppercase">Step {step} of 4</p>
        <h1 className="mt-1 text-2xl font-bold">Safe Cab</h1>
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href="https://m.uber.com" target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-lg bg-cab font-bold text-white">Open Uber</a>
        <a href="https://book.olacabs.com" target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-lg border border-cab font-bold text-cab">Open Ola</a>
        <a href="https://www.rapido.bike" target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-lg border border-cab font-bold text-cab">Open Rapido</a>
      </div>

      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
      {step === 4 && renderStepFour()}

      {destination && pickup && step !== 4 && (
        <div className="mt-4 rounded-lg border border-cab/20 bg-amber-50 p-3 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <Navigation className="mt-0.5 h-4 w-4 text-cab" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-800">Trip summary</p>
              <p className="mt-1">Pickup: {pickup.label || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}</p>
              <p>Drop: {destination.displayName}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
