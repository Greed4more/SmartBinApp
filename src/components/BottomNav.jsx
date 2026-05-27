import { useApp } from '../context/AppContext'

const tabs = [
  { id: 'dashboard', icon: '⬡', label: 'home' },
  { id: 'map',       icon: '◎', label: 'map'  },
  { id: 'camera',    icon: '◉', label: 'camera', isFab: true },
  { id: 'rewards',   icon: '◆', label: 'coins' },
  { id: 'profile',   icon: '◈', label: 'me'   },
]

export default function BottomNav({ active, onChange }) {
  const { t } = useApp()
 
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        if (tab.isFab) {
          return (
            <button
              key={tab.id}
              className={`nav-fab ${active === tab.id ? 'active' : ''}`}
              onClick={() => onChange(tab.id)}
              title={t(tab.label)}
            >
              📷
            </button>
          )
        }
        return (
          <button
            key={tab.id}
            className={`nav-item ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{t(tab.label)}</span>
          </button>
        )
      })}
    </nav>
  )
}
