import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDuration, summarizeTrips, tripsToCsv } from './trips.ts'
import type { Settings, Trip } from './types.ts'

const settings: Settings = {
  electricityPerKwh: 0.3,
  petrolPerLitre: 2.6,
  dieselPerLitre: 2.7,
  gridCo2PerKwh: 0.45,
  averageSpeedKph: 65,
  baselinePetrolL100km: 7,
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    createdAt: new Date().toISOString(),
    name: 'Test trip',
    mode: 'planned',
    vehicleId: 'v1',
    vehicleLabel: 'Test Car',
    powertrain: 'bev',
    distanceKm: 100,
    durationMin: 90,
    electricityKwh: 16,
    fuelLitres: 0,
    co2Kg: 7.2,
    costBgn: 4.8,
    consumptionPer100km: 16,
    consumptionUnit: 'kWh/100km',
    originLabel: 'A',
    destinationLabel: 'B',
    ...overrides,
  }
}

test('summary totals only the supplied trips', () => {
  const trips = [makeTrip(), makeTrip({ id: 'trip-2', distanceKm: 50, electricityKwh: 8, co2Kg: 3.6, costBgn: 2.4 })]
  const summary = summarizeTrips(trips, settings)
  assert.equal(summary.count, 2)
  assert.equal(summary.distanceKm, 150)
  assert.equal(summary.electricityKwh, 24)
  assert.equal(summary.co2Kg, 10.8)
  assert.equal(summary.costBgn, 7.2)
})

test('baseline savings are never negative', () => {
  const expensive = makeTrip({ costBgn: 500, co2Kg: 500 })
  const summary = summarizeTrips([expensive], settings)
  assert.equal(summary.co2SavedKg, 0)
  assert.equal(summary.costSavedBgn, 0)
})

test('monthly series has the requested number of buckets and includes current month', () => {
  const summary = summarizeTrips([makeTrip()], settings, 6)
  assert.equal(summary.monthly.length, 6)
  const now = new Date()
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const current = summary.monthly.find((point) => point.key === key)
  assert.ok(current)
  assert.equal(current?.trips, 1)
})

test('trips outside the window are ignored by the chart but included in totals', () => {
  const old = makeTrip({
    createdAt: new Date(2020, 0, 15).toISOString(),
    distanceKm: 10,
  })
  const summary = summarizeTrips([old], settings, 6)
  assert.equal(summary.count, 1)
  assert.equal(summary.monthly.reduce((sum, point) => sum + point.trips, 0), 0)
})

test('CSV export escapes commas and quotes', () => {
  const trip = makeTrip({ name: 'Sofia, "ideal" route' })
  const csv = tripsToCsv([trip])
  const [, row] = csv.split('\n')
  assert.ok(row.includes('"Sofia, ""ideal"" route"'))
})

test('duration formatting handles hours and minutes', () => {
  assert.equal(formatDuration(45), '45 min')
  assert.equal(formatDuration(60), '1 h')
  assert.equal(formatDuration(135), '2 h 15 min')
  assert.equal(formatDuration(0), '—')
})
