import { useState, useEffect } from 'react'
import ParticlesBg from './components/ParticlesBg'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './screens/Dashboard'
import CameraScreen from './screens/Camera'
import Profile from './screens/Profile'
import Alerts from './screens/Alerts'
import MapScreen from './screens/MapScreen'
import Rewards from './screens/Rewards'
import AuthScreen from './screens/Auth'
import FaceRecognitionPage from './screens/FaceRecognitionPage'
import EcoCatalog from './screens/EcoCatalog'
import { AppProvider, useApp } from './context/AppContext'

function AppContent() {
  const { user, loading } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')
 
  useEffect(() => {
    const handleTabChange = (e) => setActiveTab(e.detail)
    window.addEventListener('changeTab', handleTabChange)
    return () => window.removeEventListener('changeTab', handleTabChange)
  }, [])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1A1A18', color: 'var(--yellow)', fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 4
      }}>
        LOADING...
      </div>
    )
  }

  const renderScreen = () => {
    if (!user) {
      return <AuthScreen />
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard key="dashboard" onBell={() => setActiveTab('alerts')} onSettings={() => setActiveTab('ecocatalog')} />
      case 'camera':    return <CameraScreen key="camera" />
      case 'profile':   return <Profile key="profile" />
      case 'alerts':    return <Alerts key="alerts" onBack={() => setActiveTab('dashboard')} />
      case 'map':       return <MapScreen key="map" />
      case 'rewards':   return <Rewards key="rewards" />
      case 'face-debug': return <FaceRecognitionPage key="face-debug" />
      case 'ecocatalog': return <EcoCatalog key="ecocatalog" onBack={() => setActiveTab('dashboard')} />
      default:          return <Dashboard key="dashboard" onBell={() => setActiveTab('alerts')} onSettings={() => setActiveTab('ecocatalog')} />
    }
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw' }}>
      {/* Ambient desktop background */}
      <div className="desktop-only" style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 30% 50%, rgba(232,197,71,0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(196,98,45,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Team credit */}
      <div className="desktop-only" style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.12)',
        textTransform: 'uppercase', letterSpacing: 4, whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        SmartBin | AI Waste Management | Team Leavron
      </div>

      {/* Phone shell */}
      <div className="phone-shell">
        <ParticlesBg />
        <div className="texture" style={{ zIndex: 0 }} />

        <ErrorBoundary>
          {renderScreen()}
        </ErrorBoundary>

        {user && <BottomNav active={activeTab} onChange={setActiveTab} />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
