# EcoDrive Route AI - Deployment Guide

## Build Commands

### Development
```bash
npm run dev
```
Runs the app in development mode at http://localhost:5173

### Production Build
```bash
npm run build
```
Builds the app for production to the `dist` folder

### Preview
```bash
npm run preview
```
Preview the production build locally

## Configuration

### Environment Variables
Create a `.env` file in the root with:
```
VITE_API_URL=https://your-api-endpoint.com
```

### Tailwind Configuration
The project uses Tailwind CSS with custom colors (emerald and charcoal). Ensure `tailwind.config.ts` is deployed with the project.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Home screen with vehicle selection |
| `/navigate` | EcoRouteNavigation | Route planning and energy analysis |
| `/garage` | Garage | Vehicle management |
| `/analytics` | EcoDriveAnalytics | Trip recording and GPS analysis |
| `/ai-coach` | AIEcoCoach | Personalized recommendations |
| `/impact` | GreenImpact | Environmental impact statistics |
| `/history` | TripHistory | Trip history (coming soon) |
| `/settings` | Settings | Application settings |

## Features Summary

### Phase 3 - Routing
- OpenRouteService API integration for route calculation
- Driving-route directions with geometry
- Energy consumption calculation per route

### Phase 4 - Vehicle Database
- Vehicle model storage and selection
- Fuel type classification (electric/hybrid/gasoline)
- Garage management interface

### Phase 5 - Energy Modeling
- Physically informed energy consumption prediction
- Drag force, rolling resistance, and grade force calculations
- CO2 emissions estimation
- Trip cost calculation in BGN

### Phase 6 - EcoRoute Optimization
- Multiple route comparison
- Best route selection based on trip cost
- Energy efficiency analysis display

### Phase 7 - GPS Analytics
- Trip recording and storage
- GPS point tracking
- Driving pattern analysis
- Historical trip data

### Phase 8 - AI Eco Coach
- Explainable recommendations based on driving patterns
- Personalized driving style suggestions
- Vehicle switch recommendations
- Impact-based priority labeling

### Phase 9 - Green Dashboard
- Trip counting and distance tracking
- CO2 savings calculations
- Energy savings tracking
- Monthly bar chart visualization
- Impact maximization tips

### Phase 10 - Cloud Integration
- Freebuff auth protection via `ProtectedRoute`
- User session management
- Data persistence through localStorage

### Phase 11 - PWA
- Web app manifest (`manifest.json`)
- Service worker for offline caching
- Install prompts and add to home screen
- Asset caching strategy

## Production Checklist

- [ ] Run `npm run build` and verify no errors
- [ ] Verify all routes navigate correctly
- [ ] Test energy calculations with sample data
- [ ] Verify localStorage data persistence
- [ ] Test PWA features (manifest, service worker)
- [ ] Confirm responsive design on mobile/devices
- [ ] Check accessibility (contrast, aria labels)
- [ ] Verify Tailwind config is included in build
- [ ] Set up domain and HTTPS if deploying publicly