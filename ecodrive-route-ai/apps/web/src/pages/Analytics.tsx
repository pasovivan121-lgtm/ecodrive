import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Clock, Leaf, MapPin, Play, Save, Square, Trash2, Zap } from 'lucide-react'
import { useActiveVehicle, useAppStore } from '../store'
import { averageConsumption, buildTrip, formatNumber, summarizeTrips } from '../lib/trips'
import { useTripRecorder } from '../lib/useTripRecorder'
import { estimateTripEnergy } from '../lib/energy'
import { vehicleLabel } from '../lib/vehicles'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
} from '../components/ui'
import { RouteMap } from '../components/RouteMap'
import { TripRow } from '../components/TripRow'

const tooltipStyle = {
  background: '#101a24',
  border: '1px solid #1b2836',
  borderRadius: 12,
  fontSize: 12,
  color: '#e9f1f8',
}

export function Analytics() {
  const trips = useAppStore((state) => state.trips)
  const settings = useAppStore((state) => state.settings)
  const addTrip = useAppStore((state) => state.addTrip)
  const removeTrip = useAppStore((state) => state.removeTrip)
  const loadDemoTrips = useAppStore((state) => state.loadDemoTrips)
  const activeVehicle = useActiveVehicle()
  const recorder = useTripRecorder()

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => summarizeTrips(trips, settings), [trips, settings])
  const average = useMemo(() => averageConsumption(trips), [trips])

  const consumptionSeries = useMemo(
    () =>
      trips
        .slice(0, 8)
        .reverse()
        .map((trip) => ({
          label: new Date(trip.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          value: Number(trip.consumptionPer100km.toFixed(2)),
          unit: trip.consumptionUnit,
        })),
    [trips]
  )

  const averageSpeedKph =
    recorder.durationSec > 0 ? recorder.distanceKm / (recorder.durationSec / 3600) : 0

  const handleStopAndSave = () => {
    setMessage(null)
    setError(null)
    if (!activeVehicle) {
      setError('Choose an active vehicle in My Garage before saving a recorded trip.')
      return
    }
    const result = recorder.stop()
    if (result.distanceKm < 0.05) {
      setError('The recorded distance is too short to save. Record at least 50 metres.')
      return
    }
    const trip = buildTrip({
      vehicle: activeVehicle,
      distanceKm: result.distanceKm,
      durationMin: Math.max(0.1, result.durationSec / 60),
      averageSpeedKph: result.averageSpeedKph || settings.averageSpeedKph,
      originLabel: 'GPS track start',
      destinationLabel: 'GPS track end',
      settings,
      mode: 'gps',
      name: `GPS trip · ${new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      track: recorder.points.filter((_, index) => index % 5 === 0).map((p) => [p.lat, p.lon]),
    })
    addTrip(trip)
    recorder.reset()
    setMessage(
      `Saved ${formatNumber(trip.distanceKm, 2)} km as a GPS trip. Energy figures are modelled from the recorded distance.`
    )
  }

  const previewEnergy = activeVehicle && recorder.distanceKm > 0
    ? estimateTripEnergy({
        vehicle: activeVehicle,
        distanceKm: recorder.distanceKm,
        averageSpeedKph: averageSpeedKph || settings.averageSpeedKph,
        prices: settings,
      })
    : null

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Record, review and compare your driving"
        description="Trips saved from EcoRoute and the GPS recorder feed every chart. Demo rows stay clearly labelled."
        actions={
          <Button variant="secondary" onClick={loadDemoTrips}>
            <Zap className="h-4 w-4" /> Load demo trips
          </Button>
        }
      />

      {message ? (
        <Alert tone="success" className="mb-4" title="Trip saved">
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4" title="Nothing saved">
          {error}
        </Alert>
      ) : null}
      {recorder.error ? (
        <Alert tone="warn" className="mb-4" title="Recorder">
          {recorder.error}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trips"
          value={formatNumber(summary.count, 0)}
          hint={`${summary.monthly.reduce((sum, month) => sum + month.trips, 0)} in the last 6 months`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Distance"
          value={formatNumber(summary.distanceKm, 0)}
          unit="km"
          hint={`${formatNumber(summary.avgCo2PerKm, 3)} kg CO₂/km`}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          label="Average consumption"
          value={average ? formatNumber(average.value, 1) : '—'}
          unit={average?.unit ?? ''}
          hint="Across saved trips with energy data"
          icon={<Leaf className="h-4 w-4" />}
        />
        <StatCard
          label="Energy cost"
          value={formatNumber(summary.costBgn, 2)}
          unit="BGN"
          hint={`${formatNumber(summary.avgCostPerKm, 2)} BGN/km`}
          icon={<Zap className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              GPS trip recorder
            </h2>
            <Badge tone={recorder.status === 'recording' ? 'danger' : 'neutral'}>
              {recorder.status === 'recording' ? 'Recording' : 'Idle'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Uses browser geolocation. Fixes worse than 50 m, steps under 8 m and impossible speed
            spikes are filtered out before distance is accumulated.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Distance', value: `${formatNumber(recorder.distanceKm, 2)} km` },
              {
                label: 'Duration',
                value: `${String(Math.floor(recorder.durationSec / 60)).padStart(2, '0')}:${String(
                  recorder.durationSec % 60
                ).padStart(2, '0')}`,
              },
              { label: 'Avg speed', value: `${formatNumber(averageSpeedKph, 0)} km/h` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-canvas/40 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted">{item.label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span>
              Points kept: <span className="text-ink">{recorder.points.length}</span>
            </span>
            <span>
              Filtered: <span className="text-ink">{recorder.skippedCount}</span>
            </span>
            <span>
              Accuracy:{' '}
              <span className="text-ink">
                {recorder.accuracy === null ? '—' : `${formatNumber(recorder.accuracy, 0)} m`}
              </span>
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {recorder.status === 'recording' ? (
              <>
                <Button variant="danger" onClick={handleStopAndSave}>
                  <Square className="h-4 w-4" /> Stop &amp; save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    recorder.stop()
                    recorder.reset()
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Discard
                </Button>
              </>
            ) : (
              <Button onClick={recorder.start}>
                <Play className="h-4 w-4" /> Start recording
              </Button>
            )}
            {activeVehicle ? (
              <Badge tone="brand" className="self-center">
                {vehicleLabel(activeVehicle)}
              </Badge>
            ) : (
              <Badge tone="warn" className="self-center">
                No active vehicle
              </Badge>
            )}
          </div>

          {previewEnergy ? (
            <p className="mt-3 rounded-lg border border-line/70 bg-canvas/40 p-2.5 text-[11px] text-muted">
              Live estimate: {formatNumber(previewEnergy.electricityKwh, 2)} kWh ·{' '}
              {formatNumber(previewEnergy.fuelLitres, 2)} L ·{' '}
              {formatNumber(previewEnergy.co2Kg, 2)} kg CO₂
            </p>
          ) : null}

          {recorder.points.length > 1 ? (
            <div className="mt-3">
              <RouteMap
                routes={[
                  {
                    id: 'live-track',
                    coordinates: recorder.points.map((point) => [point.lat, point.lon]),
                    emphasis: 'primary',
                  },
                ]}
                height={220}
              />
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-line p-3 text-[11px] text-muted">
              The live track appears here once at least two accurate fixes are received. Recording
              requires permission and works best outdoors.
            </p>
          )}

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted/70">
            <Save className="mt-0.5 h-3 w-3 shrink-0" />
            Saving stores the recorded distance and modelled energy. It does not log speed or
            braking events, so no driving-style score is claimed.
          </p>
        </Card>

        <div className="space-y-4 lg:col-span-7">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Monthly CO₂ (last 6 months)
              </h2>
              <Badge tone="neutral">Model estimate</Badge>
            </div>
            <div className="mt-3 h-56">
              {trips.length === 0 ? (
                <EmptyState
                  title="No data to chart"
                  description="Save a route or load demo trips to populate the trend."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.monthly}>
                    <defs>
                      <linearGradient id="co2Fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1b2836" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#8ea2b6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#8ea2b6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e9f1f8' }} />
                    <Area
                      type="monotone"
                      dataKey="co2Kg"
                      name="CO₂ (kg)"
                      stroke="#34d399"
                      strokeWidth={2}
                      fill="url(#co2Fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Consumption of recent trips
            </h2>
            <div className="mt-3 h-52">
              {consumptionSeries.length === 0 ? (
                <EmptyState title="No trips yet" description="Consumption appears after the first saved trip." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionSeries}>
                    <CartesianGrid stroke="#1b2836" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#8ea2b6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#8ea2b6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e9f1f8' }} />
                    <Bar dataKey="value" name="Per 100 km" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Saved trips
          </h2>
          <span className="text-xs text-muted">{trips.length} total</span>
        </div>
        <div className="mt-3 space-y-2">
          {trips.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-6 w-6" />}
              title="No trips saved"
              description="Plan a route in EcoRoute, record a GPS trip, or load demo data to explore the analytics."
            />
          ) : (
            trips.slice(0, 12).map((trip) => (
              <TripRow key={trip.id} trip={trip} onDelete={removeTrip} />
            ))
          )}
        </div>
        {trips.length > 12 ? (
          <p className="mt-3 text-xs text-muted">
            Showing 12 of {trips.length}. The full list lives in Trip History.
          </p>
        ) : null}
      </Card>

      <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
        Charts use only trips stored in this browser. “Load demo trips” adds clearly-labelled demo
        rows; they are never mixed silently with your own records.
      </p>
    </>
  )
}
