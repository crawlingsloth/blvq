import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with immediate auto-update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Show brief notification and reload
    console.log('New version available, updating...')
    updateSW(true) // Auto-reload with new version
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  onRegistered(registration: ServiceWorkerRegistration | undefined) {
    console.log('Service Worker registered')
    // Check for updates every 60 seconds
    setInterval(() => {
      registration?.update()
    }, 60000)
  },
  onRegisterError(error: Error) {
    console.error('SW registration error', error)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
