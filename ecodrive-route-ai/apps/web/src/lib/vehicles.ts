import type { Powertrain, Vehicle } from './types.ts'

type CatalogSeed = Omit<Vehicle, 'id' | 'source' | 'createdAt'>

/** Reference specs are typical values for the named generation, not official data. */
const CATALOG_SEEDS: CatalogSeed[] = [
  {
    make: 'Tesla', model: 'Model 3 Long Range', year: 2023, powertrain: 'bev',
    massKg: 1844, dragCoefficient: 0.23, frontalAreaM2: 2.22, batteryKwh: 75,
    referenceConsumption: 16.5,
  },
  {
    make: 'Tesla', model: 'Model Y Long Range', year: 2023, powertrain: 'bev',
    massKg: 1997, dragCoefficient: 0.23, frontalAreaM2: 2.4, batteryKwh: 75,
    referenceConsumption: 18.5,
  },
  {
    make: 'BMW', model: 'i3', year: 2019, powertrain: 'bev',
    massKg: 1345, dragCoefficient: 0.29, frontalAreaM2: 2.09, batteryKwh: 42.2,
    referenceConsumption: 15.5,
  },
  {
    make: 'Nissan', model: 'Leaf 40 kWh', year: 2021, powertrain: 'bev',
    massKg: 1580, dragCoefficient: 0.28, frontalAreaM2: 2.27, batteryKwh: 40,
    referenceConsumption: 17,
  },
  {
    make: 'Volkswagen', model: 'ID.3 Pro', year: 2022, powertrain: 'bev',
    massKg: 1810, dragCoefficient: 0.27, frontalAreaM2: 2.3, batteryKwh: 58,
    referenceConsumption: 16.2,
  },
  {
    make: 'Hyundai', model: 'Ioniq 5', year: 2023, powertrain: 'bev',
    massKg: 1985, dragCoefficient: 0.288, frontalAreaM2: 2.42, batteryKwh: 72.6,
    referenceConsumption: 17.5,
  },
  {
    make: 'Renault', model: 'Zoe R135', year: 2021, powertrain: 'bev',
    massKg: 1502, dragCoefficient: 0.31, frontalAreaM2: 2.1, batteryKwh: 52,
    referenceConsumption: 16.8,
  },
  {
    make: 'Toyota', model: 'Corolla Hybrid', year: 2020, powertrain: 'hybrid',
    massKg: 1400, dragCoefficient: 0.29, frontalAreaM2: 2.18,
    referenceConsumption: 4.5,
  },
  {
    make: 'Toyota', model: 'Prius', year: 2021, powertrain: 'hybrid',
    massKg: 1420, dragCoefficient: 0.24, frontalAreaM2: 2.16,
    referenceConsumption: 4.2,
  },
  {
    make: 'Toyota', model: 'RAV4 Hybrid', year: 2022, powertrain: 'hybrid',
    massKg: 1700, dragCoefficient: 0.31, frontalAreaM2: 2.45,
    referenceConsumption: 5.6,
  },
  {
    make: 'Hyundai', model: 'Ioniq Plug-in', year: 2021, powertrain: 'phev',
    massKg: 1575, dragCoefficient: 0.27, frontalAreaM2: 2.18, batteryKwh: 8.9,
    phevElectricRangeKm: 52, referenceConsumption: 1.1,
  },
  {
    make: 'Mitsubishi', model: 'Outlander PHEV', year: 2021, powertrain: 'phev',
    massKg: 2010, dragCoefficient: 0.33, frontalAreaM2: 2.45, batteryKwh: 13.8,
    phevElectricRangeKm: 45, referenceConsumption: 1.7,
  },
  {
    make: 'Volkswagen', model: 'Golf 1.5 TSI', year: 2022, powertrain: 'petrol',
    massKg: 1350, dragCoefficient: 0.28, frontalAreaM2: 2.15, referenceConsumption: 5.9,
  },
  {
    make: 'Volkswagen', model: 'Golf 2.0 TDI', year: 2021, powertrain: 'diesel',
    massKg: 1450, dragCoefficient: 0.28, frontalAreaM2: 2.15, referenceConsumption: 4.8,
  },
  {
    make: 'Honda', model: 'Civic 1.5 Turbo', year: 2021, powertrain: 'petrol',
    massKg: 1350, dragCoefficient: 0.29, frontalAreaM2: 2.16, referenceConsumption: 6.4,
  },
  {
    make: 'Skoda', model: 'Octavia 2.0 TDI', year: 2022, powertrain: 'diesel',
    massKg: 1500, dragCoefficient: 0.3, frontalAreaM2: 2.2, referenceConsumption: 4.9,
  },
  {
    make: 'BMW', model: '320d', year: 2021, powertrain: 'diesel',
    massKg: 1600, dragCoefficient: 0.26, frontalAreaM2: 2.2, referenceConsumption: 5.1,
  },
  {
    make: 'BMW', model: '330i', year: 2021, powertrain: 'petrol',
    massKg: 1565, dragCoefficient: 0.26, frontalAreaM2: 2.2, referenceConsumption: 7.4,
  },
  {
    make: 'Mercedes-Benz', model: 'C 200', year: 2022, powertrain: 'petrol',
    massKg: 1650, dragCoefficient: 0.26, frontalAreaM2: 2.24, referenceConsumption: 7.1,
  },
  {
    make: 'Audi', model: 'A4 40 TFSI', year: 2021, powertrain: 'petrol',
    massKg: 1585, dragCoefficient: 0.27, frontalAreaM2: 2.2, referenceConsumption: 7.3,
  },
  {
    make: 'Ford', model: 'Focus 1.0 EcoBoost', year: 2020, powertrain: 'petrol',
    massKg: 1350, dragCoefficient: 0.29, frontalAreaM2: 2.2, referenceConsumption: 6.3,
  },
  {
    make: 'Peugeot', model: '208 PureTech 100', year: 2022, powertrain: 'petrol',
    massKg: 1160, dragCoefficient: 0.3, frontalAreaM2: 2.05, referenceConsumption: 5.7,
  },
  {
    make: 'Dacia', model: 'Duster TCe 130', year: 2022, powertrain: 'petrol',
    massKg: 1390, dragCoefficient: 0.36, frontalAreaM2: 2.45, referenceConsumption: 6.9,
  },
]

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const VEHICLE_CATALOG: Omit<Vehicle, 'createdAt'>[] = CATALOG_SEEDS.map((seed) => ({
  ...seed,
  id: `catalog-${slug(`${seed.make}-${seed.model}-${seed.year}`)}`,
  source: 'catalog' as const,
}))

export function catalogVehicleToVehicle(seed: Omit<Vehicle, 'createdAt'>): Vehicle {
  return { ...seed, createdAt: new Date().toISOString() }
}

export function seedGarage(): Vehicle[] {
  const picks = ['catalog-tesla-model-3-long-range-2023', 'catalog-toyota-corolla-hybrid-2020']
  return VEHICLE_CATALOG.filter((v) => picks.includes(v.id)).map(catalogVehicleToVehicle)
}

export const DEFAULT_SPECS: Record<
  Powertrain,
  { massKg: number; dragCoefficient: number; frontalAreaM2: number; phevElectricRangeKm?: number }
> = {
  petrol: { massKg: 1450, dragCoefficient: 0.3, frontalAreaM2: 2.2 },
  diesel: { massKg: 1520, dragCoefficient: 0.29, frontalAreaM2: 2.2 },
  hybrid: { massKg: 1450, dragCoefficient: 0.28, frontalAreaM2: 2.2 },
  phev: { massKg: 1750, dragCoefficient: 0.28, frontalAreaM2: 2.3, phevElectricRangeKm: 50 },
  bev: { massKg: 1850, dragCoefficient: 0.26, frontalAreaM2: 2.3 },
}

export function vehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.make} ${vehicle.model} (${vehicle.year})`
}

export function searchCatalog(query: string, powertrain?: Powertrain | 'all'): Vehicle[] {
  const q = query.trim().toLowerCase()
  return VEHICLE_CATALOG.filter((vehicle) => {
    const matchesPowertrain = !powertrain || powertrain === 'all' || vehicle.powertrain === powertrain
    if (!matchesPowertrain) return false
    if (!q) return true
    return `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.powertrain}`
      .toLowerCase()
      .includes(q)
  }).map(catalogVehicleToVehicle)
}
