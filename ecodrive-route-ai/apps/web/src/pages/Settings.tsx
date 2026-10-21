import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw, Smartphone, Upload, Zap } from 'lucide-react'
import { DEFAULT_SETTINGS, useAppStore } from '../store'
import { getAuth } from '../lib/auth'
import { ROUTING_ATTRIBUTION } from '../lib/geo'
import type { Settings as SettingsModel, Trip, Vehicle } from '../lib/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
} from '../components/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface ExportPayload {
  version: number
  exportedAt: string
  vehicles: Vehicle[]
  trips: Trip[]
  settings: SettingsModel
  activeVehicleId: string | null
}

const numeric = (value: string, fallback: number): number => {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function toForm(settings: SettingsModel) {
  return {
    electricityPerKwh: String(settings.electricityPerKwh),
    petrolPerLitre: String(settings.petrolPerLitre),
    dieselPerLitre: String(settings.dieselPerLitre),
    gridCo2PerKwh: String(settings.gridCo2PerKwh),
    averageSpeedKph: String(settings.averageSpeedKph),
    baselinePetrolL100km: String(settings.baselinePetrolL100km),
  }
}

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const vehicles = useAppStore((state) => state.vehicles)
  const activeVehicleId = useAppStore((state) => state.activeVehicleId)
  const trips = useAppStore((state) => state.trips)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const importState = useAppStore((state) => state.importState)
  const loadDemoTrips = useAppStore((state) => state.loadDemoTrips)
  const clearTrips = useAppStore((state) => state.clearTrips)
  const resetAll = useAppStore((state) => state.resetAll)
  const { cloudConfigured } = getAuth()

  const [form, setForm] = useState(() => toForm(settings))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const next: SettingsModel = {
      electricityPerKwh: numeric(form.electricityPerKwh, settings.electricityPerKwh),
      petrolPerLitre: numeric(form.petrolPerLitre, settings.petrolPerLitre),
      dieselPerLitre: numeric(form.dieselPerLitre, settings.dieselPerLitre),
      gridCo2PerKwh: numeric(form.gridCo2PerKwh, settings.gridCo2PerKwh),
      averageSpeedKph: numeric(form.averageSpeedKph, settings.averageSpeedKph),
      baselinePetrolL100km: numeric(form.baselinePetrolL100km, settings.baselinePetrolL100km),
    }

    if (next.averageSpeedKph < 10 || next.averageSpeedKph > 130) {
      setError('The fallback average speed must be between 10 and 130 km/h.')
      return
    }
    if (next.baselinePetrolL100km < 1 || next.baselinePetrolL100km > 20) {
      setError('The petrol baseline must be between 1 and 20 L/100km.')
      return
    }
    if (
      [next.electricityPerKwh, next.petrolPerLitre, next.dieselPerLitre].some(
        (value) => !Number.isFinite(value) || value <= 0
      )
    ) {
      setError('Energy prices must be positive numbers.')
      return
    }
    if (next.gridCo2PerKwh < 0) {
      setError('The grid CO₂ factor cannot be negative.')
      return
    }

    updateSettings(next)
    setMessage('Assumptions saved. New route estimates use these values immediately.')
  }

  const handleExport = () => {
    const payload: ExportPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      vehicles,
      trips,
      settings,
      activeVehicleId,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ecodrive-data-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    setError(null)
    setMessage(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Partial<ExportPayload>
      if (!Array.isArray(data.trips) && !Array.isArray(data.vehicles)) {
        throw new Error('The file does not contain EcoDrive data.')
      }
      importState({
        vehicles: Array.isArray(data.vehicles) ? data.vehicles : undefined,
        trips: Array.isArray(data.trips) ? data.trips : undefined,
        settings: data.settings,
        activeVehicleId: data.activeVehicleId ?? undefined,
      })
      if (data.settings) setForm(toForm({ ...settings, ...data.settings }))
      setMessage('Imported data from the selected file.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read that file.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Assumptions, data and install"
        description="Prices and efficiency assumptions feed every estimate. All data lives in this browser unless you export it."
        actions={<Badge tone="info">Demo mode</Badge>}
      />

      {message ? (
        <Alert tone="success" className="mb-4" title="Saved">
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4" title="Check the values">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Energy price and model assumptions
          </h2>
          <form className="mt-4 space-y-3" onSubmit={handleSave}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Electricity (BGN/kWh)" htmlFor="electricity">
                <Input
                  id="electricity"
                  inputMode="decimal"
                  value={form.electricityPerKwh}
                  onChange={(event) => setForm({ ...form, electricityPerKwh: event.target.value })}
                />
              </Field>
              <Field label="Petrol (BGN/L)" htmlFor="petrol">
                <Input
                  id="petrol"
                  inputMode="decimal"
                  value={form.petrolPerLitre}
                  onChange={(event) => setForm({ ...form, petrolPerLitre: event.target.value })}
                />
              </Field>
              <Field label="Diesel (BGN/L)" htmlFor="diesel">
                <Input
                  id="diesel"
                  inputMode="decimal"
                  value={form.dieselPerLitre}
                  onChange={(event) => setForm({ ...form, dieselPerLitre: event.target.value })}
                />
              </Field>
              <Field
                label="Grid CO₂ (kg/kWh)"
                htmlFor="grid"
                hint="EU average is roughly 0.25–0.45 depending on the country and time of day."
              >
                <Input
                  id="grid"
                  inputMode="decimal"
                  value={form.gridCo2PerKwh}
                  onChange={(event) => setForm({ ...form, gridCo2PerKwh: event.target.value })}
                />
              </Field>
              <Field
                label="Fallback average speed (km/h)"
                htmlFor="speed"
                hint="Used when a route has no duration data."
              >
                <Input
                  id="speed"
                  inputMode="decimal"
                  value={form.averageSpeedKph}
                  onChange={(event) => setForm({ ...form, averageSpeedKph: event.target.value })}
                />
              </Field>
              <Field
                label="Petrol baseline (L/100km)"
                htmlFor="baseline"
                hint="Comparison only. Savings are never presented as measured."
              >
                <Input
                  id="baseline"
                  inputMode="decimal"
                  value={form.baselinePetrolL100km}
                  onChange={(event) =>
                    setForm({ ...form, baselinePetrolL100km: event.target.value })
                  }
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <Zap className="h-4 w-4" /> Save assumptions
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm({
                  electricityPerKwh: String(DEFAULT_SETTINGS.electricityPerKwh),
                  petrolPerLitre: String(DEFAULT_SETTINGS.petrolPerLitre),
                  dieselPerLitre: String(DEFAULT_SETTINGS.dieselPerLitre),
                  gridCo2PerKwh: String(DEFAULT_SETTINGS.gridCo2PerKwh),
                  averageSpeedKph: String(DEFAULT_SETTINGS.averageSpeedKph),
                  baselinePetrolL100km: String(DEFAULT_SETTINGS.baselinePetrolL100km),
                })}
              >
                <RefreshCw className="h-4 w-4" /> Reset fields
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Data controls
            </h2>
            <p className="mt-1 text-xs text-muted">
              {trips.length} trips and {vehicles.length} vehicles stored in this browser.
            </p>
            <div className="mt-3 grid gap-2">
              <Button variant="secondary" onClick={handleExport}>
                <Download className="h-4 w-4" /> Export everything (JSON)
              </Button>
              <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" /> Import JSON backup
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleImport(file)
                  event.target.value = ''
                }}
              />
              <Button variant="secondary" onClick={loadDemoTrips}>
                <Zap className="h-4 w-4" /> Load demo trips
              </Button>
              <Button variant="ghost" onClick={clearTrips} disabled={trips.length === 0}>
                Delete all trips
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      'Reset vehicles, trips and assumptions to the defaults? This cannot be undone.'
                    )
                  ) {
                    resetAll()
                    setForm(toForm(DEFAULT_SETTINGS))
                    setMessage('Everything was reset to the defaults.')
                  }
                }}
              >
                Reset everything
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Install as an app
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              The app ships a manifest and a service worker, so it can be installed and its shell
              loads offline. Trip data stays in local storage.
            </p>
            <div className="mt-3">
              {installPrompt ? (
                <Button
                  onClick={async () => {
                    await installPrompt.prompt()
                    const choice = await installPrompt.userChoice
                    if (choice.outcome === 'accepted') setMessage('App installed.')
                    setInstallPrompt(null)
                  }}
                >
                  <Smartphone className="h-4 w-4" /> Install EcoDrive
                </Button>
              ) : (
                <p className="rounded-lg border border-dashed border-line p-3 text-[11px] text-muted">
                  Install prompt is not available right now. In Chrome or Edge, use the install
                  icon in the address bar. Static hosting must serve the manifest and service
                  worker for this to be offered.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-ink">Accounts and services</h2>
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
          <p>
            <span className="text-ink">Authentication:</span>{' '}
            {cloudConfigured
              ? 'Cloud variables are present, but the sign-in flow is not implemented in this build. The app continues in demo mode.'
              : 'Demo mode only. No account is required and nothing is uploaded. Cloud sign-in needs an auth provider and issuer configuration before it can be enabled.'}
          </p>
          <p>
            <span className="text-ink">Routing and search:</span> {ROUTING_ATTRIBUTION}. The public
            demo endpoints are rate limited and not intended as production infrastructure; set
            VITE_OSRM_BASE_URL / VITE_PHOTON_BASE_URL to point at your own deployment.
          </p>
          <p>
            <span className="text-ink">Not implemented:</span> account sync, backend persistence,
            trained ML recommendations, official vehicle-spec database. These are labelled as
            limitations rather than simulated.
          </p>
        </div>
      </Card>
    </>
  )
}
