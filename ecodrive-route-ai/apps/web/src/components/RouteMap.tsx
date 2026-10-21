import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '../lib/types'

export interface MapRoute {
  id: string
  coordinates: LatLng[]
  emphasis?: 'primary' | 'muted'
}

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function pinIcon(color: string, ring: string) {
  return L.divIcon({
    className: 'ecodrive-pin',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #e8f0f7;box-shadow:0 0 0 5px ${ring}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function FitBounds({ routes, origin, destination }: {
  routes: MapRoute[]
  origin?: LatLng
  destination?: LatLng
}) {
  const map = useMap()
  const signature = useMemo(
    () =>
      [
        ...routes.map(
          (route) =>
            `${route.id}:${route.coordinates.length}:${route.coordinates[0]?.join(',') ?? ''}`
        ),
        origin?.join(','),
        destination?.join(','),
      ].join('|'),
    [routes, origin, destination]
  )

  const points = useMemo(() => {
    const collected: LatLng[] = routes.flatMap((route) => route.coordinates)
    if (origin) collected.push(origin)
    if (destination) collected.push(destination)
    return collected
  }, [routes, origin, destination])

  // The latest points are kept in a ref so the effect can depend only on the
  // signature; otherwise a new array identity on every render would refit the
  // map and fight the user while panning.
  const pointsRef = useRef<LatLng[]>(points)
  useEffect(() => {
    pointsRef.current = points
  }, [points])

  useEffect(() => {
    const current = pointsRef.current
    if (current.length === 0) return
    if (current.length === 1) {
      map.setView(current[0], 12)
      return
    }
    map.fitBounds(L.latLngBounds(current), { padding: [28, 28] })
  }, [map, signature])

  return null
}

export function RouteMap({
  routes,
  origin,
  destination,
  height = 360,
  className,
}: {
  routes: MapRoute[]
  origin?: LatLng
  destination?: LatLng
  height?: number
  className?: string
}) {
  const center: LatLng = origin ?? routes[0]?.coordinates[0] ?? [42.7, 23.32]
  const [tileErrors, setTileErrors] = useState(0)
  const [tileKey, setTileKey] = useState(0)

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line ${className ?? ''}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={routes.length > 0 ? 9 : 6}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        worldCopyJump
      >
        <TileLayer
          key={tileKey}
          url={OSM_TILES}
          attribution={OSM_ATTRIBUTION}
          maxZoom={19}
          eventHandlers={{ tileerror: () => setTileErrors((count) => count + 1) }}
        />

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.coordinates}
            pathOptions={
              route.emphasis === 'primary'
                ? { color: '#2dd4bf', weight: 5, opacity: 0.95 }
                : { color: '#64748b', weight: 3, opacity: 0.65, dashArray: '6 8' }
            }
          />
        ))}

        {origin ? (
          <Marker position={origin} icon={pinIcon('#34d399', 'rgba(52,211,153,0.25)')} />
        ) : null}
        {destination ? (
          <Marker position={destination} icon={pinIcon('#f472b6', 'rgba(244,114,182,0.25)')} />
        ) : null}

        <FitBounds routes={routes} origin={origin} destination={destination} />
      </MapContainer>

      {tileErrors > 3 ? (
        <div className="absolute inset-x-3 bottom-3 z-[500] flex items-center justify-between gap-3 rounded-xl border border-warn/40 bg-canvas/95 px-3 py-2 text-xs text-ink shadow-xl">
          <span>Some map tiles failed to load. Check your connection.</span>
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-brand-2 hover:border-brand/50"
            onClick={() => {
              setTileErrors(0)
              setTileKey((key) => key + 1)
            }}
          >
            Retry tiles
          </button>
        </div>
      ) : null}
    </div>
  )
}
