import type { EnergyEstimate, Powertrain, PriceSettings, Vehicle } from './types.ts'

export const GRAVITY = 9.81 // m/s²
export const AIR_DENSITY = 1.225 // kg/m³ at sea level
export const ROLLING_RESISTANCE_COEFFICIENT = 0.011

/**
 * Tank/battery-to-wheel efficiency.
 *
 * ICE values are effective part-load efficiency (engine + driveline); the
 * hybrid value already includes electrical assistance. BEV/PHEV values cover
 * motor, inverter and reduction gear losses, including limited regen recovery.
 */
export const DRIVETRAIN_EFFICIENCY: Record<Powertrain, number> = {
  bev: 0.88,
  phev: 0.86,
  hybrid: 0.36,
  petrol: 0.3,
  diesel: 0.34,
}

export const PETROL_KWH_PER_LITRE = 8.9
export const DIESEL_KWH_PER_LITRE = 9.96
export const PETROL_CO2_KG_PER_LITRE = 2.31
export const DIESEL_CO2_KG_PER_LITRE = 2.64

/** Auxiliary load (HVAC, lights, electronics) drawn while driving. */
export const AUXILIARY_POWER_KW = 0.4

export const DEFAULT_PRICES: PriceSettings = {
  electricityPerKwh: 0.3,
  petrolPerLitre: 2.6,
  dieselPerLitre: 2.7,
  gridCo2PerKwh: 0.45,
}

export const BASELINE_PETROL_L100KM = 7

export function round(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

interface WheelEnergyInput {
  massKg: number
  dragCoefficient: number
  frontalAreaM2: number
  distanceKm: number
  averageSpeedKph: number
  gradientPercent?: number
}

/**
 * Mechanical energy at the wheels in kWh.
 * F = 0.5·ρ·Cd·A·v² + Crr·m·g·cosθ + m·g·sinθ, then E = F·distance.
 * Negative totals (steep, long descents) are clamped to zero.
 */
export function wheelEnergyKwh({
  massKg,
  dragCoefficient,
  frontalAreaM2,
  distanceKm,
  averageSpeedKph,
  gradientPercent = 0,
}: WheelEnergyInput): number {
  if (distanceKm <= 0) return 0
  const speedMs = Math.max(1, averageSpeedKph) / 3.6
  const theta = Math.atan(gradientPercent / 100)

  const dragForce = 0.5 * AIR_DENSITY * dragCoefficient * frontalAreaM2 * speedMs ** 2
  const rollingForce = ROLLING_RESISTANCE_COEFFICIENT * massKg * GRAVITY * Math.cos(theta)
  const gradeForce = massKg * GRAVITY * Math.sin(theta)
  const totalForce = Math.max(0, dragForce + rollingForce + gradeForce)

  return (totalForce * distanceKm * 1000) / 3_600_000
}

export function auxiliaryEnergyKwh(distanceKm: number, averageSpeedKph: number): number {
  if (distanceKm <= 0) return 0
  const hours = distanceKm / Math.max(10, averageSpeedKph)
  return AUXILIARY_POWER_KW * hours
}

export interface EnergyInput {
  vehicle: Pick<
    Vehicle,
    'powertrain' | 'massKg' | 'dragCoefficient' | 'frontalAreaM2' | 'phevElectricRangeKm'
  >
  distanceKm: number
  averageSpeedKph?: number
  gradientPercent?: number
  prices?: PriceSettings
}

/**
 * Estimate energy use, cost and tailpipe/grid CO₂ for a trip.
 * These are model estimates, not measurements.
 */
export function estimateTripEnergy({
  vehicle,
  distanceKm,
  averageSpeedKph = 60,
  gradientPercent = 0,
  prices = DEFAULT_PRICES,
}: EnergyInput): EnergyEstimate {
  const powertrain = vehicle.powertrain
  const distance = Math.max(0, distanceKm)
  const speed = Math.max(10, averageSpeedKph)
  const geometry = {
    massKg: vehicle.massKg,
    dragCoefficient: vehicle.dragCoefficient,
    frontalAreaM2: vehicle.frontalAreaM2,
    averageSpeedKph: speed,
    gradientPercent,
  }

  const wheelTotal = wheelEnergyKwh({ ...geometry, distanceKm: distance })
  let electricityKwh = 0
  let fuelEnergyKwh = 0
  let fuelLitres = 0
  let co2Kg = 0
  let costBgn = 0
  let electricShare = 0

  if (powertrain === 'bev') {
    electricityKwh =
      wheelTotal / DRIVETRAIN_EFFICIENCY.bev + auxiliaryEnergyKwh(distance, speed)
    co2Kg = electricityKwh * prices.gridCo2PerKwh
    costBgn = electricityKwh * prices.electricityPerKwh
    electricShare = 1
  } else if (powertrain === 'phev') {
    const electricRange = Math.max(0, vehicle.phevElectricRangeKm ?? 50)
    const evKm = Math.min(distance, electricRange)
    const iceKm = Math.max(0, distance - evKm)
    const evWheel = wheelEnergyKwh({ ...geometry, distanceKm: evKm })
    const iceWheel = wheelEnergyKwh({ ...geometry, distanceKm: iceKm })

    electricityKwh = evWheel / DRIVETRAIN_EFFICIENCY.phev + auxiliaryEnergyKwh(evKm, speed)
    fuelEnergyKwh = iceWheel / DRIVETRAIN_EFFICIENCY.petrol
    fuelLitres = fuelEnergyKwh / PETROL_KWH_PER_LITRE
    co2Kg =
      electricityKwh * prices.gridCo2PerKwh + fuelLitres * PETROL_CO2_KG_PER_LITRE
    costBgn =
      electricityKwh * prices.electricityPerKwh + fuelLitres * prices.petrolPerLitre
    electricShare = distance > 0 ? evKm / distance : 0
  } else if (powertrain === 'diesel') {
    fuelEnergyKwh = wheelTotal / DRIVETRAIN_EFFICIENCY.diesel
    fuelLitres = fuelEnergyKwh / DIESEL_KWH_PER_LITRE
    co2Kg = fuelLitres * DIESEL_CO2_KG_PER_LITRE
    costBgn = fuelLitres * prices.dieselPerLitre
  } else {
    fuelEnergyKwh = wheelTotal / DRIVETRAIN_EFFICIENCY[powertrain]
    fuelLitres = fuelEnergyKwh / PETROL_KWH_PER_LITRE
    co2Kg = fuelLitres * PETROL_CO2_KG_PER_LITRE
    costBgn = fuelLitres * prices.petrolPerLitre
  }

  const usesFuel = powertrain !== 'bev'
  const consumptionPer100km =
    distance > 0
      ? (usesFuel ? (fuelLitres * 100) / distance : (electricityKwh * 100) / distance)
      : 0

  return {
    powertrain,
    distanceKm: distance,
    wheelEnergyKwh: round(wheelTotal, 3),
    electricityKwh: round(electricityKwh, 3),
    fuelEnergyKwh: round(fuelEnergyKwh, 3),
    fuelLitres: round(fuelLitres, 3),
    co2Kg: round(co2Kg, 3),
    costBgn: round(costBgn, 2),
    consumptionPer100km: round(consumptionPer100km, 2),
    consumptionUnit: usesFuel ? 'L/100km' : 'kWh/100km',
    electricShare: round(electricShare, 3),
    drivetrainEfficiency: DRIVETRAIN_EFFICIENCY[powertrain],
    averageSpeedKph: speed,
  }
}

export interface BaselineEstimate {
  fuelLitres: number
  co2Kg: number
  costBgn: number
}

/**
 * Reference baseline: an average petrol car. Used only for clearly-labelled
 * savings comparisons, never presented as a measured saving.
 */
export function baselinePetrolEstimate(
  distanceKm: number,
  prices: PriceSettings = DEFAULT_PRICES,
  consumptionL100km = BASELINE_PETROL_L100KM
): BaselineEstimate {
  const fuelLitres = (Math.max(0, distanceKm) * consumptionL100km) / 100
  return {
    fuelLitres: round(fuelLitres, 3),
    co2Kg: round(fuelLitres * PETROL_CO2_KG_PER_LITRE, 3),
    costBgn: round(fuelLitres * prices.petrolPerLitre, 2),
  }
}
