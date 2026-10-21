import { ClassValue } from 'clsx';
export function cn(...inputs: (string | ClassValue)[]): string {
  return inputs
    .filter((i): i is string => typeof i === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface EnergyResult {
  energyConsumption: number; // kWh
  fuelConsumption: number; // liters or kWh depending on vehicle type
  fuelUnit: 'kWh' | 'liters';
  consumptionUnit: 'kWh/100km' | 'liters/100km';
  co2Emissions: number; // kg CO2
  tripCost: number; // BGN
}

export const calculateEnergyConsumption = (
  mass: number,
  cd: number,
  frontalArea: number,
  distance: number,
  gradient: number = 0,
  efficiency: number = 0.85,
  isElectric: boolean = true
): EnergyResult => {
  const AIR_DENSITY = 1.225; // kg/m³ at sea level
  const GRAVITY = 9.81; // m/s²
  const ROLLING_RESISTANCE = 0.01; // Crr
  const FUEL_DENSITY_GASOLINE = 8.9; // kWh per liter

  // Aerodynamic drag force: F_drag = 0.5 × ρ × Cd × A × v²
  // v = 50 km/h = 13.89 m/s
  const dragForce = 0.5 * AIR_DENSITY * cd * frontalArea * 13.89 ** 2;

  // Rolling resistance: F_roll = Crr × m × g × cos(θ)
  const cosTheta = Math.max(0.1, Math.abs(Math.cos(gradient)));
  const rollForce = ROLLING_RESISTANCE * mass * GRAVITY * cosTheta;

  // Grade force: F_grade = m × g × sin(θ)
  const gradeForce = mass * GRAVITY * Math.sin(gradient);

  // Total force
  const totalForce = dragForce + rollForce + gradeForce;

  // Energy in joules = force × distance
  const energyJoules = totalForce * distance;

  // Convert joules to kWh (1 kWh = 3.6 MJ = 3,600,000 J)
  const energyKwh = energyJoules / 3_600_000 / efficiency;

  let fuelUnit: 'kWh' | 'liters' = 'kWh';
  let consumptionUnit: 'kWh/100km' | 'liters/100km' = 'kWh/100km';
  let fuelConsumption = energyKwh;

  if (!isElectric) {
    // For ICE vehicles, convert energy to fuel consumption
    fuelConsumption = energyKwh / FUEL_DENSITY_GASOLINE;
    fuelUnit = 'liters';
    consumptionUnit = 'liters/100km';
  }

  const co2Emissions = isElectric
    ? Math.round(energyKwh * 0.5 * 100) / 100 // kg CO2 from electricity generation, approximate
    : Math.round(fuelConsumption * 2.3 * 100) / 100; // kg CO2 from fuel combustion, approximate

  const tripCost = isElectric
    ? Math.round(energyKwh * 0.15 * 100) / 100 // BGN, approximate electricity cost
    : Math.round(fuelConsumption * 2.1 * 100) / 100; // BGN, approximate fuel cost

  return {
    energyConsumption: Math.round(energyKwh * 100) / 100,
    fuelConsumption: Math.round(fuelConsumption * 100) / 100,
    fuelUnit,
    consumptionUnit,
    co2Emissions,
    tripCost,
  };
};