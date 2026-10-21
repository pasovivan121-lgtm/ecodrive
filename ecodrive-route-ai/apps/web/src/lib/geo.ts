import type { LatLng, Place, PlannedRoute } from './types.ts'

/**
 * Defaults use free, key-less public services:
 *  - Photon (Komoot) for address search
 *  - OSRM demo server for driving routes
 * Both are rate limited and intended for light/demo traffic, not production.
 * Override with VITE_PHOTON_BASE_URL / VITE_OSRM_BASE_URL for self-hosted or
 * commercial endpoints.
 */
const ENV = (import.meta.env ?? {}) as Record<string, string | undefined>
const PHOTON_BASE = ENV.VITE_PHOTON_BASE_URL ?? 'https://photon.komoot.io'
const OSRM_BASE = ENV.VITE_OSRM_BASE_URL ?? 'https://router.project-osrm.org'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export const ROUTING_ATTRIBUTION =
  'Routing © OSRM · Geocoding © Photon/OpenStreetMap contributors · Tiles © OpenStreetMap'

export const GEOCODE_ATTRIBUTION = 'Search by Photon · data © OpenStreetMap contributors'

interface PhotonFeature {
  properties: {
    osm_id?: number
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    city?: string
    district?: string
    state?: string
    country?: string
    osm_value?: string
  }
  geometry: { coordinates: [number, number] }
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

function placeLabel(props: PhotonFeature['properties']): string {
  const street = [props.street, props.housenumber].filter(Boolean).join(' ')
  const primary = props.name || street || props.city || props.state || 'Unknown place'
  const parts = [primary]
  if (props.city && props.city !== primary) parts.push(props.city)
  if (props.state && props.state !== primary && props.state !== props.city) parts.push(props.state)
  if (props.country) parts.push(props.country)
  return parts.join(', ')
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const url = `${PHOTON_BASE}/api/?q=${encodeURIComponent(trimmed)}&limit=6&lang=en`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Address search failed (${response.status})`)

  const data = (await response.json()) as PhotonResponse
  const seen = new Set<string>()
  const places: Place[] = []

  for (const feature of data.features ?? []) {
    const coords = feature.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const label = placeLabel(feature.properties ?? {})
    const key = `${label}:${coords[0].toFixed(4)}:${coords[1].toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)
    places.push({
      id: `${feature.properties.osm_type ?? 'osm'}-${feature.properties.osm_id ?? places.length}-${places.length}`,
      label,
      lon: coords[0],
      lat: coords[1],
    })
  }

  return places
}

/** Fallback geocoder used when Photon returns nothing. */
export async function searchPlacesNominatim(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Address search failed (${response.status})`)
  const data = (await response.json()) as { place_id: number; display_name: string; lat: string; lon: string }[]
  return data.map((item) => ({
    id: `nominatim-${item.place_id}`,
    label: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
  }))
}

export function parseCoordinateInput(text: string): Place | null {
  const match = text
    .trim()
    .match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  const lat = Number(match[1])
  const lon = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return {
    id: `coords-${lat.toFixed(5)}-${lon.toFixed(5)}`,
    label: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    lat,
    lon,
  }
}

interface OsrmRoute {
  distance: number
  duration: number
  geometry: { coordinates: [number, number][] }
}

interface OsrmResponse {
  code: string
  message?: string
  routes?: OsrmRoute[]
}

export async function planRoutes(
  origin: Place,
  destination: Place,
  signal?: AbortSignal
): Promise<PlannedRoute[]> {
  if (Math.abs(origin.lat - destination.lat) < 1e-6 && Math.abs(origin.lon - destination.lon) < 1e-6) {
    throw new Error('Origin and destination are the same point.')
  }

  const url =
    `${OSRM_BASE}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}` +
    '?overview=full&geometries=geojson&alternatives=true&steps=false'

  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? 'The routing service is rate limited. Please wait a moment and try again.'
        : `Routing service error (${response.status}).`
    )
  }

  const data = (await response.json()) as OsrmResponse
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(data.message || 'No driving route found between those points.')
  }

  const labels = ['Route A', 'Route B', 'Route C', 'Route D']
  const seenDistances = new Set<number>()

  return data.routes
    .filter((route) => {
      const key = Math.round(route.distance)
      if (seenDistances.has(key)) return false
      seenDistances.add(key)
      return route.geometry?.coordinates?.length > 1
    })
    .map((route, index) => ({
      id: `route-${index}`,
      label: labels[index] ?? `Route ${index + 1}`,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as LatLng),
    }))
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Resolve free text to a place: "lat, lon" first, then geocoding. */
export async function resolvePlace(text: string, signal?: AbortSignal): Promise<Place | null> {
  const coordinate = parseCoordinateInput(text)
  if (coordinate) return coordinate

  const photon = await searchPlaces(text, signal)
  if (photon.length > 0) return photon[0]

  try {
    const nominatim = await searchPlacesNominatim(text, signal)
    if (nominatim.length > 0) return nominatim[0]
  } catch {
    // Nominatim is a best-effort fallback.
  }
  return null
}
