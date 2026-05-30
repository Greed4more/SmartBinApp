import { useApp } from '../context/AppContext';

export default function Alerts({ onBack }) {
  const { t, binData } = useApp();

  const getSystemAlerts = () => {
    const alerts = [];
    if (binData) {
      if (binData.dry > 80) alerts.push({ id: 'dry-full', type: 'warning', title: 'Dry Container Filled', desc: `Dry segregation box in ${binData.name} has reached ${binData.dry}%. Emptying scheduled.` });
      if (binData.wet > 80) alerts.push({ id: 'wet-full', type: 'warning', title: 'Wet Container Filled', desc: `Wet segregation box in ${binData.name} has reached ${binData.wet}%. Emptying scheduled.` });
      if (binData.metal > 80) alerts.push({ id: 'metal-full', type: 'warning', title: 'Metal Container Filled', desc: `Metal segregation box in ${binData.name} has reached ${binData.metal}%. Emptying scheduled.` });
      if (binData.fill_level > 80) alerts.push({ id: 'bin-full', type: 'danger', title: 'Critical Fill Level', desc: `Main hub ${binData.name} exceeds 80% fill capacity. Immediate clearance recommended.` });
    }
    return alerts;
  };

  const systemAlerts = getSystemAlerts();

  return (
    <div className="screen screen-fade" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: 18, cursor: 'pointer' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', letterSpacing: 2 }}>{t('alertsTitle').toUpperCase()}</h1>
      </div>

      {/* Alerts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {systemAlerts.map(alert => (
          <div key={alert.id} className="card" style={{
            borderLeft: `4px solid ${alert.type === 'danger' ? '#E85454' : 'var(--yellow)'}`,
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: alert.type === 'danger' ? '#E85454' : 'var(--yellow)' }}>{alert.title.toUpperCase()}</h3>
              <span style={{ fontSize: 14 }}>{alert.type === 'danger' ? '🚨' : '⚠️'}</span>
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.4 }}>{alert.desc}</p>
          </div>
        ))}
      </div>

      {/* Diagnostics checkmarks */}
      <div className="section-label" style={{ marginTop: 8 }}>HARDWARE TELEMETRY DIAGNOSTICS</div>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6BBF6F' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>ESP32-Cam AI Classifier</span>
          </div>
          <span style={{ color: '#6BBF6F', fontSize: 8, fontFamily: 'var(--font-mono)' }}>ONLINE (100%)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6BBF6F' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Gravity Segregator Servo Gateway</span>
          </div>
          <span style={{ color: '#6BBF6F', fontSize: 8, fontFamily: 'var(--font-mono)' }}>CALIBRATED</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6BBF6F' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Ultrasonic Proximity Lid Sensor</span>
          </div>
          <span style={{ color: '#6BBF6F', fontSize: 8, fontFamily: 'var(--font-mono)' }}>OPERATIONAL</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6BBF6F' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Supabase Real-Time Broadcasts</span>
          </div>
          <span style={{ color: '#6BBF6F', fontSize: 8, fontFamily: 'var(--font-mono)' }}>CONNECTED</span>
        </div>
      </div>
    </div>
  );
}
