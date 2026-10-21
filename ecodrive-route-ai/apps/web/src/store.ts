import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildTrip, newId } from './lib/trips.ts'
import { seedGarage } from './lib/vehicles.ts'
import type { Settings, Trip, Vehicle } from './lib/types.ts'

export const DEFAULT_SETTINGS: Settings = {
  electricityPerKwh: 0.3,
  petrolPerLitre: 2.6,
  dieselPerLitre: 2.7,
  gridCo2PerKwh: 0.45,
  averageSpeedKph: 65,
  baselinePetrolL100km: 7,
}

interface AppState {
  vehicles: Vehicle[]
  activeVehicleId: string | null
  trips: Trip[]
  settings: Settings
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => string
  removeVehicle: (id: string) => void
  setActiveVehicle: (id: string) => void
  addTrip: (trip: Trip) => void
  removeTrip: (id: string) => void
  clearTrips: () => void
  loadDemoTrips: () => void
  updateSettings: (patch: Partial<Settings>) => void
  importState: (data: {
    vehicles?: Vehicle[]
    activeVehicleId?: string | null
    trips?: Trip[]
    settings?: Partial<Settings>
  }) => void
  resetAll: () => void
}

interface DemoRoute {
  name: string
  origin: string
  destination: string
  distanceKm: number
  durationMin: number
}

const DEMO_ROUTES: DemoRoute[] = [
  { name: 'Sofia → Plovdiv', origin: 'Sofia, Bulgaria', destination: 'Plovdiv, Bulgaria', distanceKm: 146, durationMin: 102 },
  { name: 'Sofia → Vitosha', origin: 'Sofia, Bulgaria', destination: 'Vitosha Nature Park, Bulgaria', distanceKm: 19.4, durationMin: 34 },
  { name: 'Sofia → Borovets', origin: 'Sofia, Bulgaria', destination: 'Borovets, Bulgaria', distanceKm: 74, durationMin: 71 },
  { name: 'Plovdiv → Sofia', origin: 'Plovdiv, Bulgaria', destination: 'Sofia, Bulgaria', distanceKm: 146, durationMin: 105 },
  { name: 'Sofia → Rila Monastery', origin: 'Sofia, Bulgaria', destination: 'Rila Monastery, Bulgaria', distanceKm: 118, durationMin: 112 },
  { name: 'Sofia → Varna', origin: 'Sofia, Bulgaria', destination: 'Varna, Bulgaria', distanceKm: 442, durationMin: 265 },
  { name: 'Sofia → Bansko', origin: 'Sofia, Bulgaria', destination: 'Bansko, Bulgaria', distanceKm: 158, durationMin: 128 },
  { name: 'Plovdiv → Bachkovo', origin: 'Plovdiv, Bulgaria', destination: 'Bachkovo Monastery, Bulgaria', distanceKm: 28.7, durationMin: 36 },
]

function createDemoTrips(vehicles: Vehicle[], settings: Settings): Trip[] {
  const pool = vehicles.length > 0 ? vehicles : seedGarage()
  return DEMO_ROUTES.map((route, index) => {
    const vehicle = pool[index % pool.length]
    const trip = buildTrip({
      vehicle,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      averageSpeedKph: (route.distanceKm / route.durationMin) * 60,
      originLabel: route.origin,
      destinationLabel: route.destination,
      settings,
      mode: 'demo',
      name: `Demo · ${route.name}`,
    })
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (index % 5))
    date.setDate(Math.max(2, 26 - index * 3))
    return { ...trip, id: newId('demo'), createdAt: date.toISOString() }
  })
}

const initialVehicles = seedGarage()

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      vehicles: initialVehicles,
      activeVehicleId: initialVehicles[0]?.id ?? null,
      trips: [],
      settings: DEFAULT_SETTINGS,

      addVehicle: (vehicle) => {
        const id = newId('vehicle')
        const created: Vehicle = { ...vehicle, id, createdAt: new Date().toISOString() }
        set((state) => ({
          vehicles: [...state.vehicles, created],
          activeVehicleId: state.activeVehicleId ?? id,
        }))
        return id
      },

      removeVehicle: (id) => {
        set((state) => {
          const vehicles = state.vehicles.filter((vehicle) => vehicle.id !== id)
          return {
            vehicles,
            activeVehicleId:
              state.activeVehicleId === id ? (vehicles[0]?.id ?? null) : state.activeVehicleId,
          }
        })
      },

      setActiveVehicle: (id) => set({ activeVehicleId: id }),

      addTrip: (trip) =>
        set((state) => ({ trips: [trip, ...state.trips].slice(0, 500) })),

      removeTrip: (id) =>
        set((state) => ({ trips: state.trips.filter((trip) => trip.id !== id) })),

      clearTrips: () => set({ trips: [] }),

      loadDemoTrips: () =>
        set((state) => {
          const realTrips = state.trips.filter((trip) => trip.mode !== 'demo')
          return { trips: [...createDemoTrips(state.vehicles, state.settings), ...realTrips] }
        }),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      importState: (data) =>
        set((state) => ({
          vehicles: data.vehicles ?? state.vehicles,
          activeVehicleId:
            data.activeVehicleId ?? data.vehicles?.[0]?.id ?? state.activeVehicleId,
          trips: data.trips ?? state.trips,
          settings: { ...state.settings, ...(data.settings ?? {}) },
        })),

      resetAll: () => {
        const vehicles = seedGarage()
        set({
          vehicles,
          activeVehicleId: vehicles[0]?.id ?? null,
          trips: [],
          settings: DEFAULT_SETTINGS,
        })
      },
    }),
    {
      name: 'ecodrive-route-ai:v2',
      version: 2,
      partialize: (state) => ({
        vehicles: state.vehicles,
        activeVehicleId: state.activeVehicleId,
        trips: state.trips,
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>
        return {
          ...current,
          ...saved,
          settings: { ...current.settings, ...(saved.settings ?? {}) },
        }
      },
    }
  )
)

export function useActiveVehicle(): Vehicle | undefined {
  return useAppStore((state) => state.vehicles.find((vehicle) => vehicle.id === state.activeVehicleId))
}
