import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA functionality
// It will cache assets for offline use and enable install prompts
const isLocalhost = window.location.hostname === 'localhost'
registerSW('/service-worker.js', {
  onNeedRefresh: () => {
    window.location.reload()
  },
  onOfflineReady: () => {
    console.log('App is ready to work offline')
  },
  onRegistered: () => {
    console.log('Service worker registered')
  },
  onRegisterError: () => {
    console.error('Service worker registration failed')
  },
  onCached: () => {
    console.log('Content cached for offline use')
  },
  // Skip waiting on localhost to enable hot reload
  skipWaiting: isLocalhost,
})