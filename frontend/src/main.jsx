import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.scss'

performance.mark?.('yechim:app:start')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
      performance.mark?.('yechim:sw:registered')
      console.info?.(`[YECHIM perf] service-worker registered state=${registration.active ? 'active' : 'installing'}`)
    }).catch(() => {
      // The app remains fully usable when a browser blocks service workers.
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
