import { baselinePetrolEstimate, estimateTripEnergy } from './energy.ts'
import type { EnergyEstimate, PlannedRoute, Settings, Trip, TripMode, Vehicle } from './types.ts'

export function newId(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}

interface BuildTripInput {
  vehicle: Vehicle
  distanceKm: number
  durationMin: number
  averageSpeedKph: number
  originLabel: string
  destinationLabel: string
  settings: Settings
  mode: TripMode
  name?: string
  track?: [number, number][]
}

export function buildTrip({
  vehicle,
  distanceKm,
  durationMin,
  averageSpeedKph,
  originLabel,
  destinationLabel,
  settings,
  mode,
  name,
  track,
}: BuildTripInput): Trip {
  const energy = estimateTripEnergy({
    vehicle,
    distanceKm,
    averageSpeedKph,
    prices: settings,
  })

  const date = new Date()
  return {
    id: newId('trip'),
    createdAt: date.toISOString(),
    name:
      name ??
      `${originLabel.split(',')[0]} → ${destinationLabel.split(',')[0]} · ${date.toLocaleDateString()}`,
    mode,
    vehicleId: vehicle.id,
    vehicleLabel: `${vehicle.make} ${vehicle.model}`,
    powertrain: vehicle.powertrain,
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin: Number(durationMin.toFixed(1)),
    electricityKwh: energy.electricityKwh,
    fuelLitres: energy.fuelLitres,
    co2Kg: energy.co2Kg,
    costBgn: energy.costBgn,
    consumptionPer100km: energy.consumptionPer100km,
    consumptionUnit: energy.consumptionUnit,
    originLabel,
    destinationLabel,
    track,
  }
}

export function buildTripFromRoute(
  vehicle: Vehicle,
  route: PlannedRoute,
  settings: Settings,
  originLabel: string,
  destinationLabel: string,
  mode: TripMode = 'planned'
): Trip {
  const averageSpeedKph =
    route.durationMin > 0 ? (route.distanceKm / route.durationMin) * 60 : settings.averageSpeedKph
  return buildTrip({
    vehicle,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    averageSpeedKph,
    originLabel,
    destinationLabel,
    settings,
    mode,
    track: route.coordinates.filter((_, index) => index % 6 === 0),
  })
}

export interface MonthlyPoint {
  key: string
  label: string
  distanceKm: number
  co2Kg: number
  costBgn: number
  trips: number
}

export interface TripSummary {
  count: number
  distanceKm: number
  electricityKwh: number
  fuelLitres: number
  co2Kg: number
  costBgn: number
  avgCostPerKm: number
  avgCo2PerKm: number
  baseline: { co2Kg: number; costBgn: number; fuelLitres: number }
  co2SavedKg: number
  costSavedBgn: number
  monthly: MonthlyPoint[]
}

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' })

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function summarizeTrips(trips: Trip[], settings: Settings, monthsBack = 6): TripSummary {
  const distanceKm = trips.reduce((sum, trip) => sum + trip.distanceKm, 0)
  const electricityKwh = trips.reduce((sum, trip) => sum + trip.electricityKwh, 0)
  const fuelLitres = trips.reduce((sum, trip) => sum + trip.fuelLitres, 0)
  const co2Kg = trips.reduce((sum, trip) => sum + trip.co2Kg, 0)
  const costBgn = trips.reduce((sum, trip) => sum + trip.costBgn, 0)

  const baseline = baselinePetrolEstimate(
    distanceKm,
    settings,
    settings.baselinePetrolL100km
  )

  const buckets = new Map<string, MonthlyPoint>()
  const now = new Date()
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(date)
    buckets.set(key, {
      key,
      label: monthFormatter.format(date),
      distanceKm: 0,
      co2Kg: 0,
      costBgn: 0,
      trips: 0,
    })
  }

  for (const trip of trips) {
    const date = new Date(trip.createdAt)
    if (Number.isNaN(date.getTime())) continue
    const bucket = buckets.get(monthKey(date))
    if (!bucket) continue
    bucket.distanceKm += trip.distanceKm
    bucket.co2Kg += trip.co2Kg
    bucket.costBgn += trip.costBgn
    bucket.trips += 1
  }

  const monthly = [...buckets.values()].map((point) => ({
    ...point,
    distanceKm: Number(point.distanceKm.toFixed(1)),
    co2Kg: Number(point.co2Kg.toFixed(2)),
    costBgn: Number(point.costBgn.toFixed(2)),
  }))

  return {
    count: trips.length,
    distanceKm: Number(distanceKm.toFixed(1)),
    electricityKwh: Number(electricityKwh.toFixed(2)),
    fuelLitres: Number(fuelLitres.toFixed(2)),
    co2Kg: Number(co2Kg.toFixed(2)),
    costBgn: Number(costBgn.toFixed(2)),
    avgCostPerKm: distanceKm > 0 ? Number((costBgn / distanceKm).toFixed(3)) : 0,
    avgCo2PerKm: distanceKm > 0 ? Number((co2Kg / distanceKm).toFixed(3)) : 0,
    baseline,
    co2SavedKg: Number(Math.max(0, baseline.co2Kg - co2Kg).toFixed(2)),
    costSavedBgn: Number(Math.max(0, baseline.costBgn - costBgn).toFixed(2)),
    monthly,
  }
}

export function averageConsumption(trips: Trip[]): { value: number; unit: string } | null {
  const withFuel = trips.filter((trip) => trip.fuelLitres > 0)
  if (withFuel.length > 0) {
    const litres = withFuel.reduce((sum, trip) => sum + trip.fuelLitres, 0)
    const km = withFuel.reduce((sum, trip) => sum + trip.distanceKm, 0)
    return km > 0 ? { value: litres / km * 100, unit: 'L/100km' } : null
  }
  const electric = trips.filter((trip) => trip.electricityKwh > 0)
  if (electric.length === 0) return null
  const kwh = electric.reduce((sum, trip) => sum + trip.electricityKwh, 0)
  const km = electric.reduce((sum, trip) => sum + trip.distanceKm, 0)
  return km > 0 ? { value: kwh / km * 100, unit: 'kWh/100km' } : null
}

export function energyToTripPreview(energy: EnergyEstimate): EnergyEstimate {
  return energy
}

const csvEscape = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function tripsToCsv(trips: Trip[]): string {
  const header = [
    'date',
    'name',
    'mode',
    'vehicle',
    'distance_km',
    'duration_min',
    'electricity_kwh',
    'fuel_litres',
    'co2_kg',
    'cost_bgn',
    'consumption',
    'unit',
    'origin',
    'destination',
  ]
  const rows = trips.map((trip) =>
    [
      trip.createdAt,
      trip.name,
      trip.mode,
      trip.vehicleLabel,
      trip.distanceKm,
      trip.durationMin,
      trip.electricityKwh,
      trip.fuelLitres,
      trip.co2Kg,
      trip.costBgn,
      trip.consumptionPer100km,
      trip.consumptionUnit,
      trip.originLabel,
      trip.destinationLabel,
    ]
      .map(csvEscape)
      .join(',')
  )
  return [header.join(','), ...rows].join('\n')
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  const total = Math.round(minutes)
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours === 0) return `${mins} min`
  return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
