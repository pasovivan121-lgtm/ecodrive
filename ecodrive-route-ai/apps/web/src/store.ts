import { create } from 'zustand'

type AuthState = {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

export const useStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}))