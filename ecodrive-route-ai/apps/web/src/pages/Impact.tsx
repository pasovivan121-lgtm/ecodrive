import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Leaf, MapPin, Sparkles, TrendingDown, Zap } from 'lucide-react'
import { useAppStore } from '../store'
import { formatNumber, summarizeTrips } from '../lib/trips'
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from '../components/ui'

const tooltipStyle = {
  background: '#101a24',
  border: '1px solid #1b2836',
  borderRadius: 12,
  fontSize: 12,
  color: '#e9f1f8',
}

export function Impact() {
  const trips = useAppStore((state) => state.trips)
  const settings = useAppStore((state) => state.settings)
  const loadDemoTrips = useAppStore((state) => state.loadDemoTrips)

  const summary = useMemo(() => summarizeTrips(trips, settings, 6), [trips, settings])
  const demoCount = trips.filter((trip) => trip.mode === 'demo').length

  const powertrainBreakdown = useMemo(() => {
    const map = new Map<string, { powertrain: string; distanceKm: number; co2Kg: number }>()
    for (const trip of trips) {
      const entry = map.get(trip.powertrain) ?? {
        powertrain: trip.powertrain.toUpperCase(),
        distanceKm: 0,
        co2Kg: 0,
      }
      entry.distanceKm += trip.distanceKm
      entry.co2Kg += trip.co2Kg
      map.set(trip.powertrain, entry)
    }
    return [...map.values()].map((entry) => ({
      ...entry,
      distanceKm: Number(entry.distanceKm.toFixed(1)),
      co2Kg: Number(entry.co2Kg.toFixed(2)),
    }))
  }, [trips])

  return (
    <>
      <PageHeader
        eyebrow="Green Impact"
        title="What your driving adds up to"
        description="Every figure below is derived from saved trips. Savings compare against an average petrol car using the baseline you can edit in Settings."
        actions={
          <>
            <Badge tone="info">Baseline {settings.baselinePetrolL100km} L/100km</Badge>
            <Button variant="secondary" onClick={loadDemoTrips}>
              <Sparkles className="h-4 w-4" /> Load demo trips
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Distance travelled"
          value={formatNumber(summary.distanceKm, 0)}
          unit="km"
          hint={`${summary.count} trips · ${demoCount} demo`}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          label="Estimated CO₂"
          value={formatNumber(summary.co2Kg, 1)}
          unit="kg"
          hint={`${formatNumber(summary.avgCo2PerKm, 3)} kg per km`}
          icon={<Leaf className="h-4 w-4" />}
        />
        <StatCard
          label="Estimated energy cost"
          value={formatNumber(summary.costBgn, 2)}
          unit="BGN"
          hint={`${formatNumber(summary.electricityKwh, 1)} kWh · ${formatNumber(summary.fuelLitres, 1)} L`}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Below petrol baseline"
          value={formatNumber(summary.co2SavedKg, 1)}
          unit="kg CO₂"
          hint={`Saved ${formatNumber(summary.costSavedBgn, 2)} BGN (modelled)`}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Monthly distance and CO₂
            </h2>
            <Badge tone="neutral">Last 6 months</Badge>
          </div>
          <div className="mt-3 h-64">
            {trips.length === 0 ? (
              <EmptyState
                title="Nothing to show yet"
                description="Save a route, record a GPS trip, or load demo data."
                action={
                  <Link to="/navigate">
                    <Button size="sm">Plan a route</Button>
                  </Link>
                }
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthly}>
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
                    width={38}
                  />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e9f1f8' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#8ea2b6' }} />
                  <Bar
                    dataKey="distanceKm"
                    name="Distance (km)"
                    fill="#2dd4bf"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar dataKey="co2Kg" name="CO₂ (kg)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Baseline comparison
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Your modelled CO₂</span>
                <span className="font-semibold tabular-nums text-brand-2">
                  {formatNumber(summary.co2Kg, 1)} kg
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Average petrol car</span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatNumber(summary.baseline.co2Kg, 1)} kg
                </span>
              </div>
              <div className="h-px bg-line" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Below baseline</span>
                <span className="font-semibold tabular-nums text-brand-2">
                  {formatNumber(summary.co2SavedKg, 1)} kg
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Cost vs baseline</span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatNumber(summary.costSavedBgn, 2)} BGN
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted/70">
              Baseline = {settings.baselinePetrolL100km} L/100km petrol at{' '}
              {settings.petrolPerLitre.toFixed(2)} BGN/L and 2.31 kg CO₂/L. This is a comparison
              model, not a verified saving.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              By powertrain
            </h2>
            <div className="mt-3 space-y-2">
              {powertrainBreakdown.length === 0 ? (
                <p className="text-sm text-muted">No trips yet.</p>
              ) : (
                powertrainBreakdown.map((entry) => (
                  <div
                    key={entry.powertrain}
                    className="flex items-center justify-between rounded-lg border border-line bg-canvas/40 px-3 py-2"
                  >
                    <Badge tone="brand">{entry.powertrain}</Badge>
                    <div className="text-right text-xs text-muted">
                      <p className="text-ink">{formatNumber(entry.distanceKm, 0)} km</p>
                      <p>{formatNumber(entry.co2Kg, 2)} kg CO₂</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-ink">Method and limitations</h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
          <li>
            CO₂ from fuel uses 2.31 kg/L (petrol) and 2.64 kg/L (diesel); electricity uses a flat{' '}
            {settings.gridCo2PerKwh} kg/kWh grid factor.
          </li>
          <li>
            Consumption is estimated from vehicle mass, drag, rolling resistance and drivetrain
            efficiency at the trip's average speed. Real-world values differ with weather, traffic,
            load and driving style.
          </li>
          <li>
            Trips labelled <span className="text-ink">Demo data</span> are generated to explore the
            interface and are counted separately from your own records in the trip list.
          </li>
          <li>
            Only this browser's local storage holds the data. There is no cloud sync in this build.
          </li>
        </ul>
      </Card>
    </>
  )
}
