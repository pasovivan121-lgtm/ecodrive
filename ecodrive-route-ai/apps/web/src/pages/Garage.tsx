import { useMemo, useState } from 'react'
import { Car, Check, Plus, Search, Trash2 } from 'lucide-react'
import { useAppStore } from '../store'
import { DEFAULT_SPECS, searchCatalog, vehicleLabel } from '../lib/vehicles'
import { POWERTRAIN_LABELS } from '../lib/types'
import type { Powertrain, Vehicle } from '../lib/types'
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select } from '../components/ui'

const POWERTRAIN_OPTIONS: Powertrain[] = ['petrol', 'diesel', 'hybrid', 'phev', 'bev']
const CURRENT_YEAR = new Date().getFullYear()

export function Garage() {
  const vehicles = useAppStore((state) => state.vehicles)
  const activeVehicleId = useAppStore((state) => state.activeVehicleId)
  const addVehicle = useAppStore((state) => state.addVehicle)
  const removeVehicle = useAppStore((state) => state.removeVehicle)
  const setActiveVehicle = useAppStore((state) => state.setActiveVehicle)

  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogFilter, setCatalogFilter] = useState<Powertrain | 'all'>('all')
  const [selectedCatalogPowertrain, setSelectedCatalogPowertrain] =
    useState<Powertrain>('petrol')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: String(CURRENT_YEAR),
    massKg: '',
    dragCoefficient: '',
    frontalAreaM2: '',
  })

  const catalog = useMemo(
    () => searchCatalog(catalogQuery, catalogFilter),
    [catalogQuery, catalogFilter]
  )

  const specs = DEFAULT_SPECS[selectedCatalogPowertrain]

  const findSaved = (seed: Vehicle) =>
    vehicles.find(
      (saved) =>
        saved.make === seed.make && saved.model === seed.model && saved.year === seed.year
    )

  const handleAddFromCatalog = (seed: Vehicle) => {
    setError(null)
    const saved = findSaved(seed)
    if (saved) {
      setActiveVehicle(saved.id)
      setMessage(`${vehicleLabel(seed)} is already in the garage and is now active.`)
      return
    }
    const newId = addVehicle({
      make: seed.make,
      model: seed.model,
      year: seed.year,
      powertrain: seed.powertrain,
      massKg: seed.massKg,
      dragCoefficient: seed.dragCoefficient,
      frontalAreaM2: seed.frontalAreaM2,
      batteryKwh: seed.batteryKwh,
      phevElectricRangeKm: seed.phevElectricRangeKm,
      referenceConsumption: seed.referenceConsumption,
      source: 'catalog',
    })
    setActiveVehicle(newId)
    setMessage(`${vehicleLabel(seed)} added and set as the active vehicle.`)
  }

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const year = Number(form.year)
    if (!form.make.trim() || !form.model.trim()) {
      setError('Manufacturer and model are required.')
      return
    }
    if (!Number.isFinite(year) || year < 1950 || year > CURRENT_YEAR + 1) {
      setError('Enter a model year between 1950 and next year.')
      return
    }

    const mass = form.massKg.trim() ? Number(form.massKg) : specs.massKg
    const cd = form.dragCoefficient.trim() ? Number(form.dragCoefficient) : specs.dragCoefficient
    const area = form.frontalAreaM2.trim() ? Number(form.frontalAreaM2) : specs.frontalAreaM2

    if (![mass, cd, area].every((value) => Number.isFinite(value) && value > 0)) {
      setError('Mass, drag coefficient and frontal area must be positive numbers.')
      return
    }

    const id = addVehicle({
      make: form.make.trim(),
      model: form.model.trim(),
      year,
      powertrain: selectedCatalogPowertrain,
      massKg: mass,
      dragCoefficient: cd,
      frontalAreaM2: area,
      phevElectricRangeKm:
        selectedCatalogPowertrain === 'phev' ? specs.phevElectricRangeKm : undefined,
      source: 'manual',
    })
    setActiveVehicle(id)
    setMessage(`Manual vehicle added and set as active. Estimates use the entered specs.`)
    setForm({
      make: '',
      model: '',
      year: String(CURRENT_YEAR),
      massKg: '',
      dragCoefficient: '',
      frontalAreaM2: '',
    })
  }

  return (
    <>
      <PageHeader
        eyebrow="My Garage"
        title="Vehicles drive every estimate"
        description="Pick a reference vehicle from the catalog or enter your own specs. The active vehicle is used for route scoring and trip estimates."
        actions={<Badge tone="info">{vehicles.length} saved</Badge>}
      />

      {message ? (
        <Alert tone="success" className="mb-4" title="Garage updated">
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4" title="Could not add vehicle">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Your vehicles
            </h2>
            <div className="mt-3 space-y-2">
              {vehicles.length === 0 ? (
                <EmptyState
                  icon={<Car className="h-6 w-6" />}
                  title="Garage is empty"
                  description="Add a catalog vehicle or enter your own specs to start estimating energy use."
                />
              ) : (
                vehicles.map((vehicle) => {
                  const isActive = vehicle.id === activeVehicleId
                  return (
                    <div
                      key={vehicle.id}
                      className={`rounded-xl border p-3.5 ${
                        isActive ? 'border-brand/45 bg-brand/5' : 'border-line bg-canvas/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {vehicleLabel(vehicle)}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge tone="brand">{POWERTRAIN_LABELS[vehicle.powertrain]}</Badge>
                            <Badge>{vehicle.source === 'catalog' ? 'Catalog specs' : 'Manual specs'}</Badge>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-lg border border-line p-2 text-muted transition hover:border-danger/40 hover:text-danger"
                          onClick={() => removeVehicle(vehicle.id)}
                          aria-label={`Remove ${vehicleLabel(vehicle)}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted">
                        <span>
                          Mass <span className="text-ink">{vehicle.massKg} kg</span>
                        </span>
                        <span>
                          Cd <span className="text-ink">{vehicle.dragCoefficient}</span>
                        </span>
                        <span>
                          Area <span className="text-ink">{vehicle.frontalAreaM2} m²</span>
                        </span>
                      </div>
                      <div className="mt-3">
                        {isActive ? (
                          <Badge tone="brand">
                            <Check className="h-3 w-3" /> Active vehicle
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setActiveVehicle(vehicle.id)}
                          >
                            Set active
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Add a manual vehicle
            </h2>
            <p className="mt-1 text-xs text-muted">
              Blank spec fields fall back to typical values for the selected powertrain.
            </p>
            <form className="mt-3 space-y-3" onSubmit={handleManualSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Manufacturer" htmlFor="make">
                  <Input
                    id="make"
                    value={form.make}
                    onChange={(event) => setForm({ ...form, make: event.target.value })}
                    placeholder="e.g. Mazda"
                  />
                </Field>
                <Field label="Model" htmlFor="model">
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                    placeholder="e.g. CX-5"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Model year" htmlFor="year">
                  <Input
                    id="year"
                    inputMode="numeric"
                    value={form.year}
                    onChange={(event) => setForm({ ...form, year: event.target.value })}
                  />
                </Field>
                <Field label="Powertrain" htmlFor="powertrain">
                  <Select
                    id="powertrain"
                    value={selectedCatalogPowertrain}
                    onChange={(event) =>
                      setSelectedCatalogPowertrain(event.target.value as Powertrain)
                    }
                  >
                    {POWERTRAIN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {POWERTRAIN_LABELS[option]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Mass (kg)" htmlFor="mass">
                  <Input
                    id="mass"
                    inputMode="decimal"
                    placeholder={String(specs.massKg)}
                    value={form.massKg}
                    onChange={(event) => setForm({ ...form, massKg: event.target.value })}
                  />
                </Field>
                <Field label="Cd" htmlFor="cd">
                  <Input
                    id="cd"
                    inputMode="decimal"
                    placeholder={String(specs.dragCoefficient)}
                    value={form.dragCoefficient}
                    onChange={(event) => setForm({ ...form, dragCoefficient: event.target.value })}
                  />
                </Field>
                <Field label="Area (m²)" htmlFor="area">
                  <Input
                    id="area"
                    inputMode="decimal"
                    placeholder={String(specs.frontalAreaM2)}
                    value={form.frontalAreaM2}
                    onChange={(event) => setForm({ ...form, frontalAreaM2: event.target.value })}
                  />
                </Field>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4" /> Add vehicle
              </Button>
            </form>
          </Card>
        </div>

        <Card className="p-5 lg:col-span-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Reference catalog
              </h2>
              <p className="mt-1 text-xs text-muted">
                {catalog.length} vehicles with typical specs. Values are approximate and editable
                after adding.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder="Search make or model"
                  className="pl-9"
                  aria-label="Search vehicle catalog"
                />
              </div>
              <Select
                value={catalogFilter}
                onChange={(event) =>
                  setCatalogFilter(event.target.value as Powertrain | 'all')
                }
                aria-label="Filter by powertrain"
                className="w-36 shrink-0"
              >
                <option value="all">All types</option>
                {POWERTRAIN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {POWERTRAIN_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {catalog.length === 0 ? (
              <EmptyState
                title="No catalog matches"
                description="Try a different search term, or add the vehicle manually on the left."
              />
            ) : (
              catalog.map((vehicle) => {
                const saved = findSaved(vehicle)
                return (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/40 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {vehicle.make} {vehicle.model}{' '}
                        <span className="font-normal text-muted">({vehicle.year})</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {POWERTRAIN_LABELS[vehicle.powertrain]} · {vehicle.massKg} kg · Cd{' '}
                        {vehicle.dragCoefficient}
                        {vehicle.referenceConsumption
                          ? ` · ref ${vehicle.referenceConsumption} ${
                              vehicle.powertrain === 'bev' ? 'kWh' : 'L'
                            }/100km`
                          : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={saved ? 'secondary' : 'primary'}
                      onClick={() => handleAddFromCatalog(vehicle)}
                    >
                      {saved ? (saved.id === activeVehicleId ? 'Active' : 'Set active') : 'Add'}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
