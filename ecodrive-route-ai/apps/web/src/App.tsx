import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Card, Spinner } from './components/ui'

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))
)
const EcoRoute = lazy(() =>
  import('./pages/EcoRoute').then((module) => ({ default: module.EcoRoute }))
)
const Garage = lazy(() =>
  import('./pages/Garage').then((module) => ({ default: module.Garage }))
)
const Analytics = lazy(() =>
  import('./pages/Analytics').then((module) => ({ default: module.Analytics }))
)
const EcoCoach = lazy(() =>
  import('./pages/EcoCoach').then((module) => ({ default: module.EcoCoach }))
)
const Impact = lazy(() =>
  import('./pages/Impact').then((module) => ({ default: module.Impact }))
)
const History = lazy(() =>
  import('./pages/History').then((module) => ({ default: module.History }))
)
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.SettingsPage }))
)
const Login = lazy(() =>
  import('./pages/Login').then((module) => ({ default: module.Login }))
)
const NotFound = lazy(() =>
  import('./pages/Login').then((module) => ({ default: module.NotFound }))
)

function RouteFallback() {
  return (
    <Card className="flex min-h-[320px] items-center justify-center p-6">
      <Spinner label="Loading page…" />
    </Card>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/navigate" element={<EcoRoute />} />
            <Route path="/garage" element={<Garage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-coach" element={<EcoCoach />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppShell>
    </>
  )
}
