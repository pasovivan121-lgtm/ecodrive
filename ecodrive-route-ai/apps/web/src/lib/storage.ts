export interface Trip {
  id: string;
  name: string;
  distance: number;
  duration: number;
  avgEnergyConsumption: number;
  co2Saved: number;
  startLocation: [number, number];
  endLocation: [number, number];
  date: string;
  vehicleId: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
}

const TRIPS_KEY = 'ecoTrips';
const VEHICLES_KEY = 'ecoVehicles';

export const storage = {
  // Trips
  getTrips: (): Trip[] => {
    const stored = localStorage.getItem(TRIPS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveTrip: (trip: Trip) => {
    const trips = storage.getTrips();
    const exists = trips.some(t => t.id === trip.id);
    if (!exists) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify([...trips, trip]));
    }
  },

  deleteTrip: (tripId: string) => {
    const trips = storage.getTrips().filter(t => t.id !== tripId);
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  },

  // Vehicles
  getVehicles: (): Vehicle[] => {
    const stored = localStorage.getItem(VEHICLES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveVehicle: (vehicle: Vehicle) => {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify([vehicle]));
  },

  deleteVehicle: (vehicleId: string) => {
    const vehicles = storage.getVehicles().filter(v => v.id !== vehicleId);
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  },
};