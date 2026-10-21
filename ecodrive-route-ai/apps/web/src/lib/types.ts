export type Powertrain = 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'bev'

export const POWERTRAIN_LABELS: Record<Powertrain, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  phev: 'Plug-in hybrid',
  bev: 'Battery electric',
}

/** Approximate reference specs used for demonstration-level estimates. */
export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  powertrain: Powertrain
  massKg: number
  dragCoefficient: number
  frontalAreaM2: number
  batteryKwh?: number
  /** Usable electric-only range, used to split PHEV trips. */
  phevElectricRangeKm?: number
  /** Typical combined consumption from the catalog (L/100km or kWh/100km). */
  referenceConsumption?: number
  source: 'catalog' | 'manual'
  createdAt: string
}

export type TripMode = 'planned' | 'gps' | 'demo'

export interface Trip {
  id: string
  createdAt: string
  name: string
  mode: TripMode
  vehicleId: string
  vehicleLabel: string
  powertrain: Powertrain
  distanceKm: number
  durationMin: number
  electricityKwh: number
  fuelLitres: number
  co2Kg: number
  costBgn: number
  consumptionPer100km: number
  consumptionUnit: string
  originLabel: string
  destinationLabel: string
  /** Optional simplified GPS track, [lat, lon] pairs. */
  track?: [number, number][]
}

export interface PriceSettings {
  electricityPerKwh: number
  petrolPerLitre: number
  dieselPerLitre: number
  gridCo2PerKwh: number
}

export interface Settings extends PriceSettings {
  /** Assumed average speed when a route does not provide one. */
  averageSpeedKph: number
  /** Emissions baseline used only for clearly-labelled savings comparisons. */
  baselinePetrolL100km: number
}

export interface EnergyEstimate {
  powertrain: Powertrain
  distanceKm: number
  /** Mechanical energy required at the wheels, kWh. */
  wheelEnergyKwh: number
  /** Energy taken from the battery, kWh (BEV / PHEV electric portion). */
  electricityKwh: number
  /** Chemical energy of burnt fuel, kWh. */
  fuelEnergyKwh: number
  /** Litres of petrol or diesel burnt. */
  fuelLitres: number
  co2Kg: number
  costBgn: number
  /** Consumption per 100 km in the primary unit for this powertrain. */
  consumptionPer100km: number
  consumptionUnit: 'L/100km' | 'kWh/100km'
  /** Share of the trip driven on electricity (PHEV only). */
  electricShare: number
  drivetrainEfficiency: number
  averageSpeedKph: number
}

export interface Place {
  id: string
  label: string
  lat: number
  lon: number
}

export type LatLng = [number, number]

export interface PlannedRoute {
  id: string
  label: string
  distanceKm: number
  durationMin: number
  coordinates: LatLng[]
}

export interface RouteOption extends PlannedRoute {
  energy: EnergyEstimate
}
