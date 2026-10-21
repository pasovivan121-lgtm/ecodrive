import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRecommendations } from './coach.ts'
import type { Settings, Trip, Vehicle } from './types.ts'

const settings: Settings = {
  electricityPerKwh: 0.3,
  petrolPerLitre: 2.6,
  dieselPerLitre: 2.7,
  gridCo2PerKwh: 0.45,
  averageSpeedKph: 65,
  baselinePetrolL100km: 7,
}

const petrolCar: Vehicle = {
  id: 'v1',
  make: 'Test',
  model: 'Petrol',
  year: 2020,
  powertrain: 'petrol',
  massKg: 1400,
  dragCoefficient: 0.3,
  frontalAreaM2: 2.2,
  referenceConsumption: 6,
  source: 'catalog',
  createdAt: new Date().toISOString(),
}

function trip(overrides: Partial<Trip>): Trip {
  return {
    id: Math.random().toString(),
    createdAt: new Date().toISOString(),
    name: 'Trip',
    mode: 'planned',
    vehicleId: 'v1',
    vehicleLabel: 'Test Petrol',
    powertrain: 'petrol',
    distanceKm: 30,
    durationMin: 30,
    electricityKwh: 0,
    fuelLitres: 3,
    co2Kg: 6.9,
    costBgn: 7.8,
    consumptionPer100km: 10,
    consumptionUnit: 'L/100km',
    originLabel: 'A',
    destinationLabel: 'B',
    ...overrides,
  }
}

test('no trips returns a single data recommendation', () => {
  const result = buildRecommendations({ trips: [], vehicle: petrolCar, settings })
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'no-data')
  assert.equal(result[0].severity, 'info')
})

test('consumption far above the reference is flagged as a warning', () => {
  const trips = [trip({ consumptionPer100km: 11, fuelLitres: 11, distanceKm: 100 })]
  const result = buildRecommendations({ trips, vehicle: petrolCar, settings })
  const warning = result.find((item) => item.id === 'above-reference')
  assert.ok(warning)
  assert.equal(warning?.severity, 'warning')
})

test('consumption below the reference is praised', () => {
  const trips = [trip({ fuelLitres: 4.5, distanceKm: 100, consumptionPer100km: 4.5 })]
  const result = buildRecommendations({ trips, vehicle: petrolCar, settings })
  assert.ok(result.some((item) => item.id === 'below-reference' && item.severity === 'good'))
})

test('demo rows are disclosed in the analysis', () => {
  const trips = [trip({ mode: 'demo' })]
  const result = buildRecommendations({ trips, vehicle: petrolCar, settings })
  assert.ok(result.some((item) => item.id === 'demo-data'))
})

test('manual vehicle specs are disclosed', () => {
  const trips = [trip({})]
  const manual = { ...petrolCar, source: 'manual' as const }
  const result = buildRecommendations({ trips, vehicle: manual, settings })
  assert.ok(result.some((item) => item.id === 'manual-specs'))
})

test('recommendations are sorted by severity', () => {
  const order = { critical: 0, warning: 1, good: 2, info: 3 }
  const trips = [trip({})]
  const result = buildRecommendations({ trips, vehicle: petrolCar, settings })
  const severities = result.map((item) => order[item.severity])
  const sorted = [...severities].sort((a, b) => a - b)
  assert.deepEqual(severities, sorted)
})
