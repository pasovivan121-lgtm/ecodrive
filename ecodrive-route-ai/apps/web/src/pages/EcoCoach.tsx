import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Leaf,
  Sparkles,
  TrendingDown,
  XCircle,
} from 'lucide-react'
import { useActiveVehicle, useAppStore } from '../store'
import { buildRecommendations } from '../lib/coach'
import { averageConsumption, formatNumber, summarizeTrips } from '../lib/trips'
import { vehicleLabel } from '../lib/vehicles'
import type { Severity } from '../lib/coach'
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'

const SEVERITY_META: Record<
  Severity,
  { label: string; tone: 'danger' | 'warn' | 'brand' | 'info'; icon: typeof Info }
> = {
  critical: { label: 'Act now', tone: 'danger', icon: XCircle },
  warning: { label: 'Improve', tone: 'warn', icon: AlertTriangle },
  good: { label: 'Working well', tone: 'brand', icon: CheckCircle2 },
  info: { label: 'Context', tone: 'info', icon: Info },
}

export function EcoCoach() {
  const trips = useAppStore((state) => state.trips)
  const settings = useAppStore((state) => state.settings)
  const activeVehicle = useActiveVehicle()

  const recommendations = useMemo(
    () => buildRecommendations({ trips, vehicle: activeVehicle, settings }),
    [trips, activeVehicle, settings]
  )
  const summary = useMemo(() => summarizeTrips(trips, settings), [trips, settings])
  const average = useMemo(() => averageConsumption(trips), [trips])
  const demoCount = trips.filter((trip) => trip.mode === 'demo').length

  return (
    <>
      <PageHeader
        eyebrow="AI Eco Coach"
        title="Explainable driving recommendations"
        description="A deterministic rule engine reads your saved trips, vehicle specs and price assumptions. Every tip below states the rule and the numbers behind it."
        actions={<Badge tone="info">Rule-based · no ML model</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Inputs used
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Trips analysed</dt>
              <dd className="font-medium text-ink">{trips.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Demo rows included</dt>
              <dd className="font-medium text-ink">{demoCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Distance</dt>
              <dd className="font-medium text-ink">{formatNumber(summary.distanceKm, 0)} km</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Average consumption</dt>
              <dd className="font-medium text-ink">
                {average ? `${formatNumber(average.value, 1)} ${average.unit}` : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Vehicle</dt>
              <dd className="text-right font-medium text-ink">
                {activeVehicle ? vehicleLabel(activeVehicle) : 'Not selected'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Baseline</dt>
              <dd className="font-medium text-ink">
                {settings.baselinePetrolL100km} L/100km petrol
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl border border-line bg-canvas/40 p-3 text-xs leading-relaxed text-muted">
            <p className="font-medium text-ink">What this is</p>
            <p className="mt-1">
              Threshold rules applied to stored trips and catalog specs. It explains itself and
              cannot hallucinate a measurement.
            </p>
            <p className="mt-2 font-medium text-ink">What it is not</p>
            <p className="mt-1">
              Not a trained machine-learning model, and not a driving-style score based on speed or
              braking logs.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <Link to="/navigate">
              <Button variant="secondary" className="w-full">
                <Leaf className="h-4 w-4" /> Plan a lower-emission route
              </Button>
            </Link>
            <Link to="/garage">
              <Button variant="ghost" className="w-full">
                Review vehicle specs
              </Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-3 lg:col-span-8">
          {trips.length === 0 ? (
            <Card className="p-5">
              <EmptyState
                icon={<Sparkles className="h-7 w-7" />}
                title="The coach needs trip data"
                description="Plan a route or record a GPS trip first. Demo trips can be loaded from Analytics, and are labelled as demo in the analysis."
                action={
                  <Link to="/navigate">
                    <Button size="sm">Plan a route</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            recommendations.map((recommendation) => {
              const meta = SEVERITY_META[recommendation.severity]
              const Icon = meta.icon
              return (
                <Card key={recommendation.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        meta.tone === 'danger'
                          ? 'border-danger/30 bg-danger/10 text-danger'
                          : meta.tone === 'warn'
                            ? 'border-warn/30 bg-warn/10 text-warn'
                            : meta.tone === 'brand'
                              ? 'border-brand/30 bg-brand/10 text-brand-2'
                              : 'border-sky-400/25 bg-sky-400/10 text-sky-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink">{recommendation.title}</h3>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Badge>{recommendation.category}</Badge>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        {recommendation.detail}
                      </p>
                      {recommendation.metric ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas/40 px-2 py-1 text-[11px] text-ink">
                          <TrendingDown className="h-3 w-3 text-brand-2" />
                          {recommendation.metric}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })
          )}

          <Alert tone="info" title="How to read this">
            Recommendations refresh automatically whenever trips or the active vehicle change.
            Savings statements compare modelled emissions with an average petrol car; they are not
            verified reductions.
          </Alert>
        </div>
      </div>
    </>
  )
}
