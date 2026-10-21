import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BarChart3,
  Car,
  ChevronRight,
  History,
  Home,
  Leaf,
  Menu,
  Navigation,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from 'lucide-react'
import { useActiveVehicle } from '../store'
import { cn } from '../lib/utils'
import { Badge } from './ui'
import { vehicleLabel } from '../lib/vehicles'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/navigate', label: 'EcoRoute', icon: Navigation },
  { to: '/garage', label: 'My Garage', icon: Car },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ai-coach', label: 'AI Eco Coach', icon: Sparkles },
  { to: '/impact', label: 'Green Impact', icon: Leaf },
  { to: '/history', label: 'Trip History', icon: History },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand/12 text-brand-2 ring-1 ring-inset ring-brand/25'
                : 'text-muted hover:bg-white/5 hover:text-ink'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('h-4 w-4', isActive ? 'text-brand-2' : 'text-muted/80')} />
              <span>{label}</span>
              {isActive ? <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" /> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-inset ring-brand/30">
        <Leaf className="h-5 w-5 text-brand-2" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-ink">EcoDrive</span>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">Route AI</span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeVehicle = useActiveVehicle()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[268px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-line/70 bg-surface/50 px-4 py-6 backdrop-blur lg:flex">
        <div>
          <Brand />
          <div className="mt-8">
            <NavList />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-canvas/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Active vehicle
            </p>
            <p className="mt-1 truncate text-sm font-medium text-ink">
              {activeVehicle ? vehicleLabel(activeVehicle) : 'None selected'}
            </p>
            <Link
              to="/garage"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-2 hover:underline"
            >
              Manage garage <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <Badge tone="info">Demo mode · no cloud sign-in</Badge>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line/70 bg-canvas/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <p className="text-xs text-muted">
              Estimates from a physics model — not measured vehicle data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="brand" className="hidden sm:inline-flex">
              {activeVehicle ? activeVehicle.powertrain.toUpperCase() : 'NO VEHICLE'}
            </Badge>
            <button
              type="button"
              className="rounded-lg border border-line p-2 text-muted transition hover:text-ink lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <footer className="border-t border-line/60 px-4 py-4 text-[11px] leading-relaxed text-muted/70 sm:px-6 lg:px-10">
          Energy, cost and CO₂ figures are model estimates using configurable price and grid
          assumptions. Routing © OSRM · search © Photon/OpenStreetMap · tiles © OpenStreetMap contributors.
        </footer>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface px-4 py-5">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                className="rounded-lg border border-line p-2 text-muted"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="mt-6">
              <Badge tone="info">Demo mode · no cloud sign-in</Badge>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
