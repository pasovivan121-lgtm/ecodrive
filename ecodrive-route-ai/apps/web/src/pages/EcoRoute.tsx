import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Fuel,
  Gauge,
  Leaf,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  TrendingDown,
  Zap,
} from 'lucide-react'
import { useActiveVehicle, useAppStore } from '../store'
import { estimateTripEnergy, baselinePetrolEstimate } from '../lib/energy'
import { planRoutes, resolvePlace, searchPlaces, GEOCODE_ATTRIBUTION, ROUTING_ATTRIBUTION } from '../lib/geo'
import { buildTripFromRoute, formatDuration, formatNumber } from '../lib/trips'
import { vehicleLabel } from '../lib/vehicles'
import type { Place, RouteOption } from '../lib/types'
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader } from '../components/ui'
import { RouteMap } from '../components/RouteMap'

function usePlaceSuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!enabled || trimmed.length < 3) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      searchPlaces(trimmed, controller.signal)
        .then((places) => {
          if (!controller.signal.aborted) setSuggestions(places)
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 450)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, enabled])

  const active = enabled && query.trim().length >= 3
  return { suggestions: active ? suggestions : [], loading: active ? loading : false }
}

function PlaceInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  suggestions,
  loading,
  showList,
  onFocus,
  onBlur,
  action,
  containerRef,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSelect: (place: Place) => void
  suggestions: Place[]
  loading: boolean
  showList: boolean
  onFocus: () => void
  onBlur: () => void
  action?: React.ReactNode
  containerRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="relative" ref={containerRef}>
      <Field label={label} htmlFor={id}>
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(event) => {
              onChange(event.target.value)
              onFocus()
            }}
            onFocus={onFocus}
            onBlur={() => window.setTimeout(onBlur, 150)}
          />
          {action}
        </div>
      </Field>
      {showList && (loading || suggestions.length > 0) ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-surface-2 shadow-2xl">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </div>
          ) : (
            suggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(place)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-ink transition hover:bg-white/5"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-2" />
                <span className="leading-snug">{place.label}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export function EcoRoute() {
  const vehicles = useAppStore((state) => state.vehicles)
  const activeVehicleId = useAppStore((state) => state.activeVehicleId)
  const setActiveVehicle = useAppStore((state) => state.setActiveVehicle)
  const settings = useAppStore((state) => state.settings)
  const addTrip = useAppStore((state) => state.addTrip)
  const activeVehicle = useActiveVehicle()

  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [originQuery, setOriginQuery] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')
  const [originPlace, setOriginPlace] = useState<Place | null>(null)
  const [destinationPlace, setDestinationPlace] = useState<Place | null>(null)
  const [showOriginList, setShowOriginList] = useState(false)
  const [showDestinationList, setShowDestinationList] = useState(false)
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'planning'>('idle')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const originBoxRef = useRef<HTMLDivElement | null>(null)
  const destinationBoxRef = useRef<HTMLDivElement | null>(null)

  // Close suggestions on any pointer press outside the two comboboxes, so an
  // open dropdown can never swallow a click meant for the submit button.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        originBoxRef.current?.contains(target) ||
        destinationBoxRef.current?.contains(target)
      ) {
        return
      }
      setShowOriginList(false)
      setShowDestinationList(false)
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [])

  const effectiveVehicleId = vehicleId ?? activeVehicleId ?? ''

  const originSuggestions = usePlaceSuggestions(originQuery, showOriginList)
  const destinationSuggestions = usePlaceSuggestions(destinationQuery, showDestinationList)

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === effectiveVehicleId) ?? activeVehicle,
    [vehicles, effectiveVehicleId, activeVehicle]
  )

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteId) ?? routes[0],
    [routes, activeRouteId]
  )

  const baseline = useMemo(
    () =>
      activeRoute
        ? baselinePetrolEstimate(activeRoute.distanceKm, settings, settings.baselinePetrolL100km)
        : null,
    [activeRoute, settings]
  )

  const clearResults = () => {
    setRoutes([])
    setActiveRouteId(null)
    setSaved(false)
    setNotice(null)
  }

  const handlePlan = async () => {
    if (status === 'planning') return
    setShowOriginList(false)
    setShowDestinationList(false)
    setError(null)
    setNotice(null)
    setSaved(false)

    if (!selectedVehicle) {
      setError('Select a vehicle in My Garage before planning a route.')
      return
    }
    if (!originQuery.trim() || !destinationQuery.trim()) {
      setError('Enter both a starting point and a destination.')
      return
    }

    setStatus('planning')
    try {
      const from = originPlace ?? (await resolvePlace(originQuery))
      const to = destinationPlace ?? (await resolvePlace(destinationQuery))
      if (!from) throw new Error('Could not find that starting point. Try a city or "lat, lon".')
      if (!to) throw new Error('Could not find that destination. Try a city or "lat, lon".')
      setOriginPlace(from)
      setDestinationPlace(to)
      setOriginQuery(from.label)
      setDestinationQuery(to.label)

      const planned = await planRoutes(from, to)
      const options = planned
        .map((route) => {
          const averageSpeedKph =
            route.durationMin > 0
              ? (route.distanceKm / route.durationMin) * 60
              : settings.averageSpeedKph
          const energy = estimateTripEnergy({
            vehicle: selectedVehicle,
            distanceKm: route.distanceKm,
            averageSpeedKph,
            prices: settings,
          })
          return { ...route, energy }
        })
        .sort((a, b) => a.energy.co2Kg - b.energy.co2Kg || a.durationMin - b.durationMin)

      setRoutes(options)
      setActiveRouteId(options[0]?.id ?? null)
      setNotice(
        `${options.length} route${options.length === 1 ? '' : 's'} ranked by estimated CO₂ for ${vehicleLabel(
          selectedVehicle
        )}.`
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not plan that route.')
      clearResults()
    } finally {
      setStatus('idle')
    }
  }

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('This browser does not expose geolocation.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place: Place = {
          id: 'current-location',
          label: `My location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }
        setOriginPlace(place)
        setOriginQuery(place.label)
        setLocating(false)
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied. Enter a starting point manually.'
            : 'Could not read your location. Enter a starting point manually.'
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  const handleSaveTrip = () => {
    if (!activeRoute || !selectedVehicle) return
    const trip = buildTripFromRoute(
      selectedVehicle,
      activeRoute,
      settings,
      originPlace?.label ?? originQuery,
      destinationPlace?.label ?? destinationQuery,
      'planned'
    )
    addTrip(trip)
    setSaved(true)
  }

  return (
    <>
      <PageHeader
        eyebrow="EcoRoute"
        title="Compare routes by energy, cost and CO₂"
        description="Address search and road routing use open services, then each alternative is scored for your selected vehicle."
        actions={
          <>
            <Badge tone="info">OSRM routing</Badge>
            <Badge tone="brand">Physics estimate</Badge>
          </>
        }
      />

      {vehicles.length === 0 ? (
        <Alert tone="warn" title="No vehicle yet" className="mb-4">
          Add a vehicle in{' '}
          <Link to="/garage" className="font-medium underline">
            My Garage
          </Link>{' '}
          so routes can be scored with realistic mass and drag values.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-5">
          <form
            className="space-y-4"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault()
                void handlePlan()
              }
            }}
          >
            <Field label="Vehicle" htmlFor="vehicle">
              <select
                id="vehicle"
                value={effectiveVehicleId}
                onChange={(event) => {
                  setVehicleId(event.target.value)
                  setActiveVehicle(event.target.value)
                  clearResults()
                }}
                className="h-11 w-full appearance-none rounded-xl border border-line bg-canvas/70 px-3.5 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
              >
                <option value="">Select a vehicle…</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicleLabel(vehicle)} · {vehicle.powertrain.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>

            <PlaceInput
              id="origin"
              label="Starting point"
              placeholder="City, address, or 42.6984, 23.3261"
              value={originQuery}
              onChange={(value) => {
                setOriginQuery(value)
                setOriginPlace(null)
                clearResults()
              }}
              onSelect={(place) => {
                setOriginPlace(place)
                setOriginQuery(place.label)
                setShowOriginList(false)
                clearResults()
              }}
              suggestions={originSuggestions.suggestions}
              loading={originSuggestions.loading}
              showList={showOriginList}
              onFocus={() => setShowOriginList(true)}
              onBlur={() => setShowOriginList(false)}
              containerRef={originBoxRef}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  className="w-11 shrink-0 px-0"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  title="Use my current location"
                  aria-label="Use my current location"
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                </Button>
              }
            />

            <PlaceInput
              id="destination"
              label="Destination"
              placeholder="City, address, or 42.1354, 24.7453"
              value={destinationQuery}
              onChange={(value) => {
                setDestinationQuery(value)
                setDestinationPlace(null)
                clearResults()
              }}
              onSelect={(place) => {
                setDestinationPlace(place)
                setDestinationQuery(place.label)
                setShowDestinationList(false)
                clearResults()
              }}
              suggestions={destinationSuggestions.suggestions}
              loading={destinationSuggestions.loading}
              showList={showDestinationList}
              onFocus={() => setShowDestinationList(true)}
              onBlur={() => setShowDestinationList(false)}
              containerRef={destinationBoxRef}
            />

            <Button
              type="button"
              className="w-full"
              disabled={status === 'planning'}
              onClick={() => void handlePlan()}
            >
              {status === 'planning' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Planning…
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" /> Plan eco route
                </>
              )}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted/80">
              Tip: a city centre is enough for a demo. Coordinates are accepted as "lat, lon". The
              public routing service is rate limited, so avoid rapid repeated requests.
            </p>
          </form>

          {error ? (
            <Alert tone="danger" title="Route not planned" className="mt-4">
              {error}
            </Alert>
          ) : null}
          {notice ? (
            <Alert tone="success" className="mt-4">
              {notice}
            </Alert>
          ) : null}
        </Card>

        <div className="lg:col-span-7">
          {activeRoute ? (
            <div className="lg:sticky lg:top-20">
              <RouteMap
                routes={routes.map((route) => ({
                  id: route.id,
                  coordinates: route.coordinates,
                  emphasis: route.id === activeRoute.id ? 'primary' : 'muted',
                }))}
                origin={originPlace ? [originPlace.lat, originPlace.lon] : undefined}
                destination={
                  destinationPlace ? [destinationPlace.lat, destinationPlace.lon] : undefined
                }
                height={420}
              />
              <p className="mt-2 text-[10px] text-muted/70">{ROUTING_ATTRIBUTION}</p>
            </div>
          ) : (
            <Card className="flex h-full min-h-[420px] items-center justify-center p-6">
              <EmptyState
                icon={<Navigation className="h-7 w-7" />}
                title="Your route will appear here"
                description="Enter a start and destination, then compare alternatives by modelled energy use."
              />
            </Card>
          )}
        </div>
      </div>

      {activeRoute ? (
        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Alternatives
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Ranked lowest estimated CO₂ first for {selectedVehicle ? vehicleLabel(selectedVehicle) : 'your vehicle'}.
                </p>
              </div>
              <Badge tone="brand">
                <Leaf className="h-3 w-3" /> Best: {activeRoute.label}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {routes.map((route) => {
                const isActive = route.id === activeRoute.id
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      setActiveRouteId(route.id)
                      setSaved(false)
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      isActive
                        ? 'border-brand/50 bg-brand/8 ring-1 ring-brand/20'
                        : 'border-line bg-canvas/40 hover:border-line/80 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{route.label}</span>
                      {route.id === routes[0].id ? (
                        <Badge tone="brand">Lowest CO₂</Badge>
                      ) : (
                        <Badge>Alternative</Badge>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5" /> {formatNumber(route.distanceKm, 1)} km
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {formatDuration(route.durationMin)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Fuel className="h-3.5 w-3.5" />{' '}
                        {formatNumber(route.energy.consumptionPer100km, 1)}{' '}
                        {route.energy.consumptionUnit}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Leaf className="h-3.5 w-3.5" /> {formatNumber(route.energy.co2Kg, 2)} kg
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Estimated cost{' '}
                      <span className="font-medium text-ink">
                        {formatNumber(route.energy.costBgn, 2)} BGN
                      </span>
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Energy breakdown · {activeRoute.label}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {formatNumber(activeRoute.distanceKm, 1)} km ·{' '}
                  {formatDuration(activeRoute.durationMin)} · average{' '}
                  {formatNumber(activeRoute.energy.averageSpeedKph, 0)} km/h
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSaveTrip}>
                  {saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Saved
                    </>
                  ) : (
                    <>Save this trip</>
                  )}
                </Button>
                <Link to="/history">
                  <Button variant="ghost">
                    History <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Zap className="h-4 w-4" />,
                  label: 'Battery energy',
                  value: `${formatNumber(activeRoute.energy.electricityKwh, 2)} kWh`,
                  hint: 'Electric portion',
                },
                {
                  icon: <Fuel className="h-4 w-4" />,
                  label: 'Fuel burnt',
                  value: `${formatNumber(activeRoute.energy.fuelLitres, 2)} L`,
                  hint: 'Petrol/diesel',
                },
                {
                  icon: <Leaf className="h-4 w-4" />,
                  label: 'Estimated CO₂',
                  value: `${formatNumber(activeRoute.energy.co2Kg, 2)} kg`,
                  hint: baseline
                    ? `Petrol baseline ${formatNumber(baseline.co2Kg, 2)} kg`
                    : undefined,
                },
                {
                  icon: <TrendingDown className="h-4 w-4" />,
                  label: 'Estimated cost',
                  value: `${formatNumber(activeRoute.energy.costBgn, 2)} BGN`,
                  hint: baseline
                    ? `Baseline ${formatNumber(baseline.costBgn, 2)} BGN`
                    : undefined,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-line bg-canvas/40 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
                    {item.icon} {item.label}
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-ink">{item.value}</p>
                  {item.hint ? <p className="text-[11px] text-muted/70">{item.hint}</p> : null}
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-3">
              <p>
                Wheel energy:{' '}
                <span className="text-ink">
                  {formatNumber(activeRoute.energy.wheelEnergyKwh, 2)} kWh
                </span>
              </p>
              <p>
                Drivetrain efficiency:{' '}
                <span className="text-ink">
                  {Math.round(activeRoute.energy.drivetrainEfficiency * 100)}%
                </span>
              </p>
              <p>
                Electric share:{' '}
                <span className="text-ink">
                  {Math.round(activeRoute.energy.electricShare * 100)}%
                </span>
              </p>
            </div>

            <p className="mt-4 rounded-lg border border-line/70 bg-canvas/40 p-3 text-[11px] leading-relaxed text-muted/80">
              Model estimate: drag, rolling resistance and grade force at the trip's average speed,
              divided by a fixed drivetrain efficiency, with a 0.4 kW auxiliary load for electric
              driving. Real consumption varies with traffic, temperature, tyre pressure and driving
              style. {GEOCODE_ATTRIBUTION}.
            </p>
          </Card>
        </div>
      ) : null}
    </>
  )
}
