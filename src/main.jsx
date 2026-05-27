import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div style={{ padding: 40, color: '#E8C547', fontFamily: 'monospace' }}>[SYSTEM ERROR] Application failed to initialize. Please reload.</div>}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
