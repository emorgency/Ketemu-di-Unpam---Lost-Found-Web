import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { logger } from './lib/logger'

// T-039: global handler agar unhandled error / promise rejection tercatat di app_logs.
window.addEventListener('error', (e) => {
  logger.error('window.onerror', e.message || 'Unhandled error', {
    filename: e.filename,
    lineno: e.lineno,
  })
})
window.addEventListener('unhandledrejection', (e) => {
  logger.error('unhandledrejection', e.reason?.message || String(e.reason || ''), {
    stack: String(e.reason?.stack || '').slice(0, 2000),
  })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
