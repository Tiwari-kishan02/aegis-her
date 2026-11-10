const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'
let lastRequestAt = 0

function waitForRateLimit() {
  const now = Date.now()
  const minGap = 1000
  const delay = Math.max(0, lastRequestAt + minGap - now)

  return new Promise((resolve) => {
    window.setTimeout(resolve, delay)
  })
}

async function fetchJson(url) {
  await waitForRateLimit()
  lastRequestAt = Date.now()

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-IN',
      Referer: window.location.origin || 'http://localhost:5173',
    },
  })

  if (!response.ok) {
    throw new Error('Could not load location suggestions.')
  }

  return response.json()
}

export async function searchPlaces(query) {
  const cleanedQuery = query.trim()
  if (!cleanedQuery) return []

  const params = new URLSearchParams({
    q: cleanedQuery,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'in',
  })

  try {
    const payload = await fetchJson(`${NOMINATIM_URL}/search?${params.toString()}`)
    return payload.map((place) => ({
      placeId: place.place_id,
      displayName: place.display_name,
      lat: Number(place.lat),
      lng: Number(place.lon),
      type: place.type,
      address: place.address,
    }))
  } catch {
    return []
  }
}

export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
    zoom: '18',
  })

  try {
    const payload = await fetchJson(`${NOMINATIM_URL}/reverse?${params.toString()}`)
    return {
      displayName: payload.display_name || `${lat}, ${lng}`,
      lat: Number(payload.lat),
      lng: Number(payload.lon),
      address: payload.address || {},
    }
  } catch {
    return {
      displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      lat,
      lng,
      address: {},
    }
  }
}
