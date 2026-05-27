import { useApp } from '../context/AppContext'
import { LANGUAGES } from '../utils/translations'
import BinModel3D from '../components/BinModel3D'

const NumAnim = ({ val }) => {
  return <>{val.toLocaleString()}</>
}

export default function Dashboard({ onBell, onSettings }) {
  const { user, binData, ecoCoins, totalScans, leaderboard, t, language, changeLanguage, notificationsEnabled } = useApp()

  const BINS = [
    { label: t('dry'),   pct: binData?.dry || 0,   color: '#E8C547', icon: '🟡' },
    { label: t('wet'),   pct: binData?.wet || 0,   color: '#4A7C4E', icon: '🟢' },
    { label: t('metal'), pct: binData?.metal || 0, color: '#3A5A8C', icon: '🔵' },
  ]

  const getLevelProgress = () => {
    const coins = ecoCoins || 0
    const currentLevel = user?.level || 1
    const nextLevelTarget = currentLevel * 200
    const progress = Math.min((coins / nextLevelTarget) * 100, 100)
    return { progress, target: nextLevelTarget }
  }

  const { progress, target } = getLevelProgress()

  return (
    <div className="screen screen-fade">
      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-logo">{t('appName')}</div>
        <div className="topbar-right">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              background: 'var(--card-dark)', color: 'var(--yellow)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              fontSize: 10, padding: '2px 4px', outline: 'none'
            }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}
          </select>
          <button
            className={`icon-btn ${notificationsEnabled ? 'notif-dot' : ''}`}
            title={t('notifications')}
            onClick={() => notificationsEnabled && onBell()}
            style={{ opacity: notificationsEnabled ? 1 : 0.5 }}
          >
            🔔
          </button>
          <button className="icon-btn" title={t('settings')} onClick={onSettings}>⚙</button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="px card-enter" style={{ marginTop: 8 }}>
        <div className="ecocoins-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="ecocoins-num"><NumAnim val={ecoCoins} /></div>
              <div className="ecocoins-sub">{t('yourCoins')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--bg)', background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: 4 }}>{t('level').toUpperCase()} {user?.level || 1}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, marginTop: 4, opacity: 0.7 }}>{t('ecoWarrior')}</div>
            </div>
          </div>
         
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 8, marginBottom: 4, textTransform: 'uppercase', opacity: 0.8 }}>
              <span>{t('progressToLevel')} {(user?.level || 1) + 1}</span>
              <span>{ecoCoins} / {target} {t('xp')}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--bg)', borderRadius: 3, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3D Model */}
      <div className="px card-enter" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 350, background: 'transparent', border: 'none' }}>
          <BinModel3D />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="px card-enter" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1 }}>{totalScans}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>{t('totalScans')}</div>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1, color: '#6BBF6F' }}>{(user?.co2_saved || (totalScans * 0.4)).toFixed(1)}<span style={{ fontSize: 14 }}>{t('kg').toUpperCase()}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>{t('co2Saved')}</div>
        </div>
      </div>

      {/* Bin Status */}
      <div className="section-label px" style={{ marginTop: 24 }}>{t('binStatus')}</div>
      <div className="px card-enter">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {BINS.map(bin => (
            <div key={bin.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{bin.icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{bin.label}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: bin.pct > 80 ? '#E85454' : bin.color, fontWeight: 600 }}>{bin.pct}%</span>
              </div>
              <div className="fill-bar-wrap">
                <div
                  className="fill-bar"
                  style={{ width: `${bin.pct}%`, background: bin.color, boxShadow: `0 0 10px ${bin.color}44` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="section-label px" style={{ marginTop: 24 }}>{t('communityLeaderboard').toUpperCase()}</div>
      <div className="px card-enter">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {leaderboard.length > 0 ? leaderboard.map((u, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: u.uid === user?.uid ? 'rgba(232,197,71,0.05)' : 'transparent'
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 18, width: 24,
                color: i === 0 ? 'var(--yellow)' : 'var(--text-muted)'
              }}>
                #{i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('level').toUpperCase()} {u.level || Math.floor(u.eco_coins / 200) + 1}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--yellow)' }}>{u.eco_coins}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{t('coins').toUpperCase()}</div>
              </div>
            </div>
          )) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{t('loading')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
