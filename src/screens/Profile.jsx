import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, logout, t, theme, toggleTheme, notificationsEnabled, setNotificationsEnabled } = useApp();

  const handleLogout = () => {
    logout();
  };

  const openBiometricsDebugger = () => {
    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'face-debug' }));
  };

  return (
    <div className="screen screen-fade" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header */}
      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: 1 }}>USER PROFILE</div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#E85454', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer', textTransform: 'uppercase' }}>
          {t('logout')}
        </button>
      </div>

      {/* Avatar details card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--yellow)',
          background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 24 }}>👤</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.name || 'SmartBin Citizen'}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: 'inline-block', background: 'rgba(232,197,71,0.1)', color: 'var(--yellow)', fontSize: 8, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, marginTop: 6, textTransform: 'uppercase' }}>
            RANK: LEVEL {user?.level || 1}
          </div>
        </div>
      </div>

      {/* User Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>City / State</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: '#fff' }}>{user?.city || 'N/A'}, {user?.state || 'N/A'}</div>
        </div>
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pincode</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: '#fff' }}>{user?.pincode || 'N/A'}</div>
        </div>
      </div>

      {/* Application Control center */}
      <div className="section-label" style={{ marginTop: 8 }}>SETTINGS & PREFERENCES</div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Theme Settings Toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Theme Mode</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Toggle Light/Dark layout styling</div>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(232,197,71,0.1)',
              border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6,
              fontSize: 10, fontFamily: 'var(--font-mono)', color: theme === 'dark' ? '#fff' : 'var(--yellow)', cursor: 'pointer'
            }}
          >
            {theme.toUpperCase()}
          </button>
        </div>

        {/* Notifications Toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>System Notifications</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Toggle fill-level alert broadcasts</div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            style={{
              background: notificationsEnabled ? 'rgba(74,124,78,0.1)' : 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6,
              fontSize: 10, fontFamily: 'var(--font-mono)', color: notificationsEnabled ? '#6BBF6F' : 'var(--text-muted)', cursor: 'pointer'
            }}
          >
            {notificationsEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Biometrics calibration linkage */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer'
        }} onClick={openBiometricsDebugger}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Face Biometrics Controller</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Enrolment vector coordinates dashboard</div>
          </div>
          <span style={{ color: 'var(--yellow)', fontSize: 14 }}>➔</span>
        </div>
      </div>
    </div>
  );
}
