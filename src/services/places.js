const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadius = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function getNearbyPoliceStations(position) {
  const query = `[out:json];(node["amenity"="police"](around:5000,${position.lat},${position.lng});way["amenity"="police"](around:5000,${position.lat},${position.lng}););out center;`
  const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('Could not load nearby police stations.')

  const data = await response.json()
  return data.elements
    .map((element) => {
      const lat = element.lat ?? element.center?.lat
      const lng = element.lon ?? element.center?.lon
      if (lat == null || lng == null) return null
      return {
        name: element.tags?.name || 'Police station',
        phone: element.tags?.phone || element.tags?.['contact:phone'] || '',
        lat,
        lng,
        distance: distanceKm(position.lat, position.lng, lat, lng),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
}

export async function getNearbyHospitals(position) {
  // Try hospitals first, then clinics if <3 results
  const hospitalQuery = `[out:json];(node["amenity"="hospital"](around:5000,${position.lat},${position.lng});way["amenity"="hospital"](around:5000,${position.lat},${position.lng}););out center;`
  let response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(hospitalQuery)}`)
  if (!response.ok) throw new Error('Could not load nearby hospitals.')
  let data = await response.json()
  let hospitals = data.elements
    .map((element) => {
      const lat = element.lat ?? element.center?.lat
      const lng = element.lon ?? element.center?.lon
      if (lat == null || lng == null) return null
      return {
        name: element.tags?.name || 'Hospital',
        phone: element.tags?.phone || element.tags?.['contact:phone'] || '',
        lat,
        lng,
        distance: distanceKm(position.lat, position.lng, lat, lng),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)

  if (hospitals.length < 3) {
    // Try clinics too
    const clinicQuery = `[out:json];(node["amenity"="clinic"](around:5000,${position.lat},${position.lng});way["amenity"="clinic"](around:5000,${position.lat},${position.lng}););out center;`
    response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(clinicQuery)}`)
    if (response.ok) {
      data = await response.json()
      const clinics = data.elements
        .map((element) => {
          const lat = element.lat ?? element.center?.lat
          const lng = element.lon ?? element.center?.lon
          if (lat == null || lng == null) return null
          return {
            name: element.tags?.name || 'Clinic',
            phone: element.tags?.phone || element.tags?.['contact:phone'] || '',
            lat,
            lng,
            distance: distanceKm(position.lat, position.lng, lat, lng),
          }
        })
        .filter(Boolean)
      hospitals = hospitals.concat(clinics).sort((a, b) => a.distance - b.distance)
    }
  }
  return hospitals.slice(0, 3)
}
