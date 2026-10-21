import { averageConsumption, summarizeTrips } from './trips.ts'
import type { Settings, Trip, Vehicle } from './types.ts'

export type Severity = 'critical' | 'warning' | 'good' | 'info'

export interface Recommendation {
  id: string
  title: string
  detail: string
  severity: Severity
  category: 'driving' | 'vehicle' | 'routes' | 'data'
  metric?: string
}

export interface CoachInput {
  trips: Trip[]
  vehicle?: Vehicle
  settings: Settings
}

/**
 * Deterministic, explainable rule engine.
 * There is no trained ML model in this build; the UI labels it accordingly.
 */
export function buildRecommendations({ trips, vehicle, settings }: CoachInput): Recommendation[] {
  const results: Recommendation[] = []
  const summary = summarizeTrips(trips, settings)
  const average = averageConsumption(trips)
  const demoCount = trips.filter((trip) => trip.mode === 'demo').length

  if (trips.length === 0) {
    return [
      {
        id: 'no-data',
        title: 'Plan or record a trip first',
        detail:
          'The coach analyses your saved trips. Plan an eco route or use the GPS recorder in Analytics, then generate recommendations again.',
        severity: 'info',
        category: 'data',
      },
    ]
  }

  if (demoCount > 0) {
    results.push({
      id: 'demo-data',
      title: 'Demo trips are included in this analysis',
      detail: `${demoCount} of ${trips.length} trips are labelled demo data. Their numbers are model estimates, not real driving measurements.`,
      severity: 'info',
      category: 'data',
    })
  }

  if (average && vehicle) {
    const reference = vehicle.referenceConsumption
    if (reference && reference > 0) {
      const delta = ((average.value - reference) / reference) * 100
      if (delta > 15) {
        results.push({
          id: 'above-reference',
          title: 'Consumption is above this car’s reference value',
          detail: `Your trips average ${average.value.toFixed(1)} ${average.unit}, about ${delta.toFixed(0)}% above the catalog reference of ${reference.toFixed(1)}. Smooth acceleration, steady cruising and correct tyre pressure usually close most of that gap.`,
          severity: 'warning',
          category: 'driving',
          metric: `${delta.toFixed(0)}% above reference`,
        })
      } else if (delta < -5) {
        results.push({
          id: 'below-reference',
          title: 'You are beating the reference consumption',
          detail: `Your average of ${average.value.toFixed(1)} ${average.unit} is ${Math.abs(delta).toFixed(0)}% better than the catalog reference. Keep the same route and speed profile.`,
          severity: 'good',
          category: 'driving',
          metric: `${Math.abs(delta).toFixed(0)}% better than reference`,
        })
      }
    } else if (vehicle.powertrain === 'bev' && average.value > 22) {
      results.push({
        id: 'bev-high',
        title: 'High electric consumption',
        detail: `An average of ${average.value.toFixed(1)} kWh/100km is high for a car of this size. Motorway speeds above 110 km/h and heavy HVAC use are the usual causes.`,
        severity: 'warning',
        category: 'driving',
      })
    } else if (
      (vehicle.powertrain === 'petrol' || vehicle.powertrain === 'hybrid') &&
      average.value > 8
    ) {
      results.push({
        id: 'fuel-high',
        title: 'Fuel use suggests an inefficient driving style',
        detail: `Averaging ${average.value.toFixed(1)} L/100km points to hard acceleration, excessive idling or short cold-start trips.`,
        severity: 'warning',
        category: 'driving',
      })
    }
  }

  const shortTrips = trips.filter((trip) => trip.distanceKm < 5).length
  if (shortTrips / trips.length > 0.4) {
    results.push({
      id: 'short-trips',
      title: 'Many trips are under 5 km',
      detail: `${shortTrips} of ${trips.length} saved trips are shorter than 5 km. Cold engines and cabin heating dominate consumption on short runs; walking, cycling or combining errands avoids the worst of it.`,
      severity: 'warning',
      category: 'routes',
      metric: `${shortTrips}/${trips.length} short trips`,
    })
  }

  if (summary.distanceKm > 0 && summary.co2SavedKg > 0) {
    results.push({
      id: 'baseline-saving',
      title: 'Estimated emissions below the petrol baseline',
      detail: `Across ${summary.distanceKm.toFixed(0)} km your estimated ${summary.co2Kg.toFixed(1)} kg CO₂ is ${summary.co2SavedKg.toFixed(1)} kg below an average petrol car at ${settings.baselinePetrolL100km} L/100km. This is a modelled comparison, not a measurement.`,
      severity: 'good',
      category: 'routes',
      metric: `${summary.co2SavedKg.toFixed(1)} kg CO₂ below baseline`,
    })
  }

  if (vehicle && vehicle.source === 'manual') {
    results.push({
      id: 'manual-specs',
      title: 'Vehicle specs were entered manually',
      detail:
        'Energy estimates are only as good as the mass, drag coefficient and frontal area you entered. Check them if the numbers look off.',
      severity: 'info',
      category: 'vehicle',
    })
  }

  if (vehicle && vehicle.year < 2012 && vehicle.powertrain !== 'bev') {
    results.push({
      id: 'older-vehicle',
      title: 'Older combustion vehicle',
      detail:
        'Pre-2012 engines are typically 10–20% less efficient than current equivalents. Maintenance (air filter, plugs, tyre pressure) has a measurable effect at this age.',
      severity: 'info',
      category: 'vehicle',
    })
  }

  if (vehicle && (vehicle.powertrain === 'bev' || vehicle.powertrain === 'phev')) {
    results.push({
      id: 'charge-smart',
      title: 'Shift charging to low-carbon hours',
      detail:
        'Charging overnight or during high-renewable periods lowers the grid emissions factor used in these estimates. The current calculation uses a flat ' +
        `${settings.gridCo2PerKwh} kg CO₂/kWh grid average.`,
      severity: 'info',
      category: 'vehicle',
    })
  }

  if (trips.filter((trip) => trip.mode === 'planned').length === 0) {
    results.push({
      id: 'plan-routes',
      title: 'Compare routes before driving',
      detail:
        'No planned routes are saved yet. EcoRoute compares alternatives by modelled energy, cost and CO₂, which is where most of the savings are found on longer trips.',
      severity: 'info',
      category: 'routes',
    })
  }

  const order: Record<Severity, number> = { critical: 0, warning: 1, good: 2, info: 3 }
  return results.sort((a, b) => order[a.severity] - order[b.severity])
}
