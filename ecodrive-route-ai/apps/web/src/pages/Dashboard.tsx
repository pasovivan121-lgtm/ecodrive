import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Car,
  Leaf,
  MapPin,
  Navigation,
  Plus,
  Sparkles,
  TrendingDown,
} from 'lucide-react'
import { useActiveVehicle, useAppStore } from '../store'
import { summarizeTrips, formatNumber } from '../lib/trips'
import { vehicleLabel } from '../lib/vehicles'
import { getAuth } from '../lib/auth'
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from '../components/ui'
import { TripRow } from '../components/TripRow'

export function Dashboard() {
  const trips = useAppStore((state) => state.trips)
  const settings = useAppStore((state) => state.settings)
  const loadDemoTrips = useAppStore((state) => state.loadDemoTrips)
  const activeVehicle = useActiveVehicle()
  const { user } = getAuth()
  const summary = summarizeTrips(trips, settings)
  const recentTrips = trips.slice(0, 4)
  const hasRealTrips = trips.some((trip) => trip.mode !== 'demo')

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${user.name}`}
        description="Plan lower-emission routes, compare your vehicles and track what your trips cost in energy and CO₂."
        actions={
          <>
            <Link to="/navigate">
              <Button>
                <Navigation className="h-4 w-4" /> Plan an eco route
              </Button>
            </Link>
            <Link to="/garage">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Garage
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trips saved"
          value={formatNumber(summary.count, 0)}
          hint={hasRealTrips ? 'Includes planned and GPS trips' : 'No real trips yet'}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          label="Distance"
          value={formatNumber(summary.distanceKm, 0)}
          unit="km"
          hint={`${formatNumber(summary.electricityKwh, 1)} kWh · ${formatNumber(summary.fuelLitres, 1)} L`}
          icon={<Navigation className="h-4 w-4" />}
        />
        <StatCard
          label="Est. CO₂"
          value={formatNumber(summary.co2Kg, 1)}
          unit="kg"
          hint="Model estimate, not measured"
          icon={<Leaf className="h-4 w-4" />}
        />
        <StatCard
          label="Est. cost"
          value={formatNumber(summary.costBgn, 2)}
          unit="BGN"
          hint={`${formatNumber(summary.avgCostPerKm, 2)} BGN/km`}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Recent trips
            </h2>
            <Link to="/history" className="text-xs font-medium text-brand-2 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentTrips.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-6 w-6" />}
                title="No trips yet"
                description="Plan a route to save your first trip, or load clearly-labelled demo data to explore the dashboard."
                action={
                  <Button variant="secondary" size="sm" onClick={loadDemoTrips}>
                    <Sparkles className="h-4 w-4" /> Load demo trips
                  </Button>
                }
              />
            ) : (
              recentTrips.map((trip) => <TripRow key={trip.id} trip={trip} />)
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Active vehicle
            </h2>
            {activeVehicle ? (
              <>
                <p className="mt-2 text-base font-medium text-ink">{vehicleLabel(activeVehicle)}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{activeVehicle.powertrain.toUpperCase()}</Badge>
                  <Badge>{activeVehicle.massKg} kg</Badge>
                  <Badge>Cd {activeVehicle.dragCoefficient}</Badge>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {activeVehicle.source === 'catalog'
                    ? 'Reference specs from the built-in catalog (approximate).'
                    : 'Specs entered manually — estimates depend on them.'}
                </p>
                <Link
                  to="/garage"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-2 hover:underline"
                >
                  Change vehicle <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-muted">No vehicle selected.</p>
                <Link to="/garage" className="mt-2 inline-flex">
                  <Button size="sm" variant="secondary">
                    <Car className="h-4 w-4" /> Choose a vehicle
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Quick actions
            </h2>
            <div className="mt-3 space-y-2">
              {[
                { to: '/navigate', label: 'Compare eco routes', icon: Navigation },
                { to: '/analytics', label: 'Record a GPS trip', icon: MapPin },
                { to: '/ai-coach', label: 'Get driving tips', icon: Sparkles },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2.5 rounded-lg border border-line/80 px-3 py-2 text-sm text-ink transition hover:border-brand/40 hover:text-brand-2"
                >
                  <Icon className="h-4 w-4 text-muted" />
                  {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">How these numbers are produced</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Consumption is modelled from vehicle mass, aerodynamic drag, rolling resistance,
              drivetrain efficiency and your saved price assumptions. It is a physics-based estimate
              for comparison, not a measurement from the car.
            </p>
          </div>
          <Link to="/settings" className="text-xs font-medium text-brand-2 hover:underline">
            Edit assumptions
          </Link>
        </div>
      </Card>
    </>
  )
}
