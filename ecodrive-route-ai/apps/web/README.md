# EcoDrive Route AI

A school-project web app that compares driving routes by **modelled** energy use, cost and CO₂ for a selected vehicle, records GPS trips, and explains driving-efficiency findings with a transparent rule engine.

The interface is a dark automotive dashboard (React 19 + Vite + Tailwind CSS v4) with an interactive Leaflet map.

> Every energy, cost and emissions figure is a **model estimate**, not a measurement from a car. Savings statements compare against a configurable "average petrol car" baseline.

## What works

| Area | Status |
| --- | --- |
| Address search (Photon + Nominatim fallback) | Working, no API key |
| Road routing with alternatives (OSRM) | Working, no API key |
| Route geometry on OpenStreetMap (CARTO dark tiles) | Working |
| Per-vehicle energy, cost and CO₂ estimation | Working — physics model |
| Vehicle garage (catalog + manual entry) | Working, persisted locally |
| GPS trip recording with filtering | Working — requires geolocation permission |
| Trip history, filters, CSV export, JSON backup | Working |
| AI Eco Coach | Working — **rule-based, not ML** |
| Green Impact dashboard | Working — derived from saved trips |
| Installable PWA + offline app shell | Working — built output only |
| Accounts / cloud sync | **Not implemented** — explicit demo mode |
| Official vehicle specification database | **Not used** — catalog values are approximate |
| Trained ML model | **Not included** |

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # tsc -b && vite build
npm run typecheck  # tsc -b
npm run test       # node --test (Node 22.7+; Node 23.6+ needs no flag)
npm run lint       # oxlint
npm run preview    # preview the production build
```

Node 20+ is required by Vite; the test runner needs a Node version with TypeScript type stripping (Node 22.7+ with `--experimental-strip-types`, enabled by default from 23.6).

## Configuration

Copy `.env.example` to `.env` if you want to point at your own services:

| Variable | Purpose |
| --- | --- |
| `VITE_OSRM_BASE_URL` | OSRM-compatible routing endpoint |
| `VITE_PHOTON_BASE_URL` | Photon geocoding endpoint |
| `VITE_AUTH_ISSUER`, `VITE_AUTH_CLIENT_ID` | Only change the login-screen message; they do **not** enable auth |

No secrets are required or committed. The public demo endpoints are rate limited; do not build production traffic on them.

## Architecture

```text
src/
  App.tsx                 routes + shell
  main.tsx                React root, production-only service worker
  store.ts                zustand state (vehicles, trips, settings) persisted to localStorage
  lib/
    types.ts              domain types
    energy.ts             physics model (drag, rolling resistance, drivetrain, fuel, CO₂)
    vehicles.ts           reference catalog and manual-entry defaults
    geo.ts                Photon geocoding + OSRM routing + haversine
    trips.ts              trip construction, summaries, monthly buckets, CSV
    coach.ts              deterministic recommendation rules
    useTripRecorder.ts    geolocation watch with accuracy/spike filtering
  components/
    AppShell.tsx          responsive navigation shell
    RouteMap.tsx          Leaflet map, route polylines, markers, fit-bounds
    TripRow.tsx           shared trip summary row
    ui.tsx                buttons, cards, inputs, badges, alerts, stats
  pages/                  Dashboard, EcoRoute, Garage, Analytics, EcoCoach, Impact, History, Settings, Login
  lib/*.test.ts           Node test-runner unit tests
```

### Energy model

At the trip's average speed (derived from route distance/duration):

```text
F = 0.5·ρ·Cd·A·v²  +  Crr·m·g·cosθ  +  m·g·sinθ
E_wheel = F · distance
E_battery = E_wheel / η_drivetrain + P_aux · time      (electric)
E_fuel    = E_wheel / η_drivetrain                      (combustion)
```

Defaults: ρ = 1.225 kg/m³, Crr = 0.011, P_aux = 0.4 kW, petrol 8.9 kWh/L, diesel 9.96 kWh/L, petrol 2.31 kg CO₂/L, diesel 2.64 kg CO₂/L, grid 0.45 kg CO₂/kWh. PHEV trips use electricity for the first `phevElectricRangeKm` kilometres, then petrol. All values are configurable in Settings except the physical constants.

## Deployment (Vercel)

The app lives in `ecodrive-route-ai/apps/web`. In the Vercel project:

1. **Root Directory** → `ecodrive-route-ai/apps/web` (required; the repo root has no package manifest).
2. Framework preset → Vite.
3. Build command → `npm run build`, output → `dist` (also encoded in `vercel.json`).
4. Node.js → 20 or newer.

`vercel.json` adds the SPA rewrite so deep links such as `/navigate` survive a refresh, plus no-cache headers for `sw.js`.

Do not upload `dist/` committed artefacts; Vercel builds from source.

## Data and privacy

- All vehicles, trips and settings live in `localStorage` under `ecodrive-route-ai:v2`.
- Nothing is uploaded. There is no backend, account or telemetry.
- Clearing site data removes everything; use Settings → Export for a JSON backup.
- GPS recording only runs while you press Start and only stores a simplified track with the trip.

## Known limitations

- Cloud authentication and cross-device sync are not implemented; the login screen states this instead of faking a sign-in.
- The built-in vehicle catalog contains typical reference values for a small set of models; it is not an official database. Manual entry is available for anything else.
- The Eco Coach is a deterministic rule engine. It is labelled as such in the UI and makes no ML claims.
- The OSRM demo server and Photon are rate limited public services.
- Safari support for some PWA install prompts differs; the app still works as a normal website.
- No end-to-end browser tests are included; unit tests cover the energy model, summaries, coach rules and geo helpers.

## Attribution

Routing © [OSRM](http://project-osrm.org/) · Search © [Photon](https://photon.komoot.io/) / OpenStreetMap contributors · Tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) · Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
