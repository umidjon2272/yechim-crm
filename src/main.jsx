import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import './styles/main.scss'

performance.mark?.('yechim:app:start')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
      performance.mark?.('yechim:sw:registered')
      console.info?.(`[YECHIM perf] service-worker registered state=${registration.active ? 'active' : 'installing'}`)
      registration.update().catch(() => {})

      // A newly installed worker can claim this tab without changing the JS
      // that is already running. Reload once only when an older worker was
      // controlling the page, so a stale chunk cannot survive a deployment.
      if (navigator.serviceWorker.controller) {
        const reloadKey = 'yechim.sw.reloaded.v5'
        const reloadOnControllerChange = () => {
          if (sessionStorage.getItem(reloadKey)) return
          sessionStorage.setItem(reloadKey, '1')
          window.location.reload()
        }
        navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange, { once: true })
      }
    }).catch(() => {
      // The app remains fully usable when a browser blocks service workers.
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
)
