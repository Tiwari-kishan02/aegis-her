export function buildRideLink(provider, pickup, destination) {
  const pickupLat = pickup?.lat ?? 0
  const pickupLng = pickup?.lng ?? 0
  const dropLat = destination?.lat ?? 0
  const dropLng = destination?.lng ?? 0

  if (!pickup || !destination) {
    return 'https://www.google.com/maps'
  }

  switch (provider) {
    case 'Uber':
      return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}`
    case 'Ola':
      return `https://book.olacabs.com/?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&drop_lat=${dropLat}&drop_lng=${dropLng}`
    case 'Rapido':
      // Rapido's deep-linking format is not consistently documented; fall back to the web app while preserving coordinates.
      return `https://www.rapido.bike/?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&destination_lat=${dropLat}&destination_lng=${dropLng}`
    default:
      return `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${dropLat},${dropLng}`
  }
}

export function openRideLink(provider, pickup, destination) {
  const destinationUrl = buildRideLink(provider, pickup, destination)
  window.open(destinationUrl, '_blank', 'noopener,noreferrer')
  return destinationUrl
}
