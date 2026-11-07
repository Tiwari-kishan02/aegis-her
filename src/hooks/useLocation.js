import { useCallback, useEffect, useRef, useState } from 'react'

const friendlyError = (error) => {
  if (error?.code === 1) {
    return 'Location permission was denied. Enable location in your browser settings.'
  }
  if (error?.code === 2) {
    return 'Your location is unavailable. Check that GPS or location services are enabled.'
  }
  if (error?.code === 3) {
    return 'Finding your location timed out. Please try again.'
  }
  return 'Could not get your location. Please try again.'
}

export default function useLocation() {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const watchId = useRef(null)

  const stopWatching = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      setError('Location services are not supported by this browser.')
      return
    }

    stopWatching()
    setStatus('loading')
    setError('')

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const nextPosition = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
        }
        setPosition(nextPosition)
        setStatus('granted')

        watchId.current = navigator.geolocation.watchPosition(
          (updatedLocation) => {
            setPosition({
              lat: updatedLocation.coords.latitude,
              lng: updatedLocation.coords.longitude,
              accuracy: updatedLocation.coords.accuracy,
            })
            setStatus('granted')
            setError('')
          },
          (watchError) => {
            if (watchError.code === 1) {
              setStatus('denied')
            } else {
              setStatus('error')
            }
            setError(friendlyError(watchError))
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
        )
      },
      (locationError) => {
        if (locationError.code === 1) setStatus('denied')
        else if (locationError.code === 2 || locationError.code === 3) setStatus('error')
        else setStatus('error')
        setError(friendlyError(locationError))
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    )
  }, [stopWatching])

  useEffect(() => stopWatching, [stopWatching])

  return { position, status, error, requestLocation }
}
