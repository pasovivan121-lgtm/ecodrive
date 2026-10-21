import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PRICES,
  baselinePetrolEstimate,
  estimateTripEnergy,
  wheelEnergyKwh,
} from './energy.ts'

const bev = {
  powertrain: 'bev' as const,
  massKg: 1844,
  dragCoefficient: 0.23,
  frontalAreaM2: 2.22,
}

const petrol = {
  powertrain: 'petrol' as const,
  massKg: 1350,
  dragCoefficient: 0.28,
  frontalAreaM2: 2.15,
}

const phev = {
  powertrain: 'phev' as const,
  massKg: 1575,
  dragCoefficient: 0.27,
  frontalAreaM2: 2.18,
  phevElectricRangeKm: 52,
}

test('zero distance produces zero energy, cost and CO2', () => {
  const result = estimateTripEnergy({ vehicle: bev, distanceKm: 0 })
  assert.equal(result.electricityKwh, 0)
  assert.equal(result.fuelLitres, 0)
  assert.equal(result.co2Kg, 0)
  assert.equal(result.costBgn, 0)
  assert.equal(result.consumptionPer100km, 0)
})

test('wheel energy is positive and scales with distance', () => {
  const short = wheelEnergyKwh({
    massKg: 1500,
    dragCoefficient: 0.3,
    frontalAreaM2: 2.2,
    distanceKm: 10,
    averageSpeedKph: 90,
  })
  const long = wheelEnergyKwh({
    massKg: 1500,
    dragCoefficient: 0.3,
    frontalAreaM2: 2.2,
    distanceKm: 20,
    averageSpeedKph: 90,
  })
  assert.ok(short > 0)
  assert.ok(Math.abs(long - short * 2) < 1e-9)
})

test('heavier vehicles need more wheel energy at the same speed', () => {
  const base = { dragCoefficient: 0.3, frontalAreaM2: 2.2, distanceKm: 50, averageSpeedKph: 90 }
  const light = wheelEnergyKwh({ ...base, massKg: 1200 })
  const heavy = wheelEnergyKwh({ ...base, massKg: 2200 })
  assert.ok(heavy > light)
})

test('higher speed increases energy per kilometre', () => {
  const base = { massKg: 1500, dragCoefficient: 0.3, frontalAreaM2: 2.2, distanceKm: 50 }
  const slow = wheelEnergyKwh({ ...base, averageSpeedKph: 50 })
  const fast = wheelEnergyKwh({ ...base, averageSpeedKph: 130 })
  assert.ok(fast > slow)
})

test('BEV reports battery energy and no fuel', () => {
  const result = estimateTripEnergy({ vehicle: bev, distanceKm: 100, averageSpeedKph: 90 })
  assert.ok(result.electricityKwh > 0)
  assert.equal(result.fuelLitres, 0)
  assert.equal(result.consumptionUnit, 'kWh/100km')
  assert.equal(result.electricShare, 1)
  assert.ok(result.consumptionPer100km > 8 && result.consumptionPer100km < 35)
})

test('petrol vehicle reports litres and plausible L/100km', () => {
  const result = estimateTripEnergy({ vehicle: petrol, distanceKm: 100, averageSpeedKph: 90 })
  assert.equal(result.electricityKwh, 0)
  assert.ok(result.fuelLitres > 0)
  assert.equal(result.consumptionUnit, 'L/100km')
  assert.ok(result.consumptionPer100km > 3 && result.consumptionPer100km < 15)
})

test('cost follows the configured prices', () => {
  const distanceKm = 100
  const result = estimateTripEnergy({
    vehicle: petrol,
    distanceKm,
    averageSpeedKph: 90,
    prices: { ...DEFAULT_PRICES, petrolPerLitre: 5 },
  })
  assert.ok(Math.abs(result.costBgn - result.fuelLitres * 5) < 0.01)
})

test('PHEV uses only electricity within its electric range', () => {
  const result = estimateTripEnergy({ vehicle: phev, distanceKm: 20, averageSpeedKph: 50 })
  assert.equal(result.electricShare, 1)
  assert.equal(result.fuelLitres, 0)
  assert.ok(result.electricityKwh > 0)
})

test('PHEV burns fuel beyond its electric range', () => {
  const result = estimateTripEnergy({ vehicle: phev, distanceKm: 120, averageSpeedKph: 80 })
  assert.ok(result.electricShare > 0 && result.electricShare < 1)
  assert.ok(result.fuelLitres > 0)
  assert.ok(result.electricityKwh > 0)
})

test('baseline petrol estimate matches its stated consumption', () => {
  const baseline = baselinePetrolEstimate(200, { ...DEFAULT_PRICES }, 7)
  assert.ok(Math.abs(baseline.fuelLitres - 14) < 0.001)
  assert.ok(Math.abs(baseline.co2Kg - 14 * 2.31) < 0.01)
  assert.ok(Math.abs(baseline.costBgn - 14 * DEFAULT_PRICES.petrolPerLitre) < 0.01)
})

test('a BEV emits less than the petrol baseline over the same distance', () => {
  const ev = estimateTripEnergy({ vehicle: bev, distanceKm: 100, averageSpeedKph: 90 })
  const baseline = baselinePetrolEstimate(100)
  assert.ok(ev.co2Kg < baseline.co2Kg)
})
