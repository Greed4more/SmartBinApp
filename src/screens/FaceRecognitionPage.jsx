import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function FaceRecognitionPage() {
  const { user, t } = useApp();
  const [dbProfiles, setDbProfiles] = useState([]);
  const [threshold, setThreshold] = useState(0.6);
  const [scanSpeed, setScanSpeed] = useState('Medium (500ms)');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('users').select('uid, name, email, face_id_enabled, face_descriptor');
    if (data) setDbProfiles(data);
  };

  const getDescriptorString = (descriptor) => {
    if (!descriptor || descriptor.length === 0) return 'Not configured';
    const sliced = descriptor.slice(0, 5).map(val => val.toFixed(4));
    return `[${sliced.join(', ')}, ...] (${descriptor.length} dimensions)`;
  };

  return (
    <div className="screen screen-fade" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'profile' }))}
          style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: 18, cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', letterSpacing: 2 }}>BIOMETRIC CONTROL</h1>
      </div>

      {/* Simulator settings card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--yellow)', letterSpacing: 1 }}>ENGINE METRICS</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>MATCH PASS THRESHOLD (EUCLIDEAN DISTANCE)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--yellow)' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--yellow)', minWidth: 32 }}>{threshold}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>SAMPLING INTERVAL</div>
            <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>{scanSpeed}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>FACE ENGINE STATUS</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#4A7C4E', fontWeight: 600 }}>● RUNNING (V2.1)</div>
          </div>
        </div>
      </div>

      {/* Registered profiles lists */}
      <div className="section-label" style={{ marginTop: 8 }}>ENROLLED BIOMETRICS ({dbProfiles.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        {dbProfiles.map(p => (
          <div key={p.uid} className="card" style={{ padding: 12, background: p.uid === user?.uid ? 'rgba(232,197,71,0.04)' : 'var(--card-dark)', border: p.uid === user?.uid ? '1px solid var(--yellow)' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.email}</div>
              </div>
              <span style={{
                fontSize: 8, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4,
                background: p.face_id_enabled ? 'rgba(74,124,78,0.2)' : 'rgba(255,255,255,0.05)',
                color: p.face_id_enabled ? '#6BBF6F' : 'var(--text-muted)', border: p.face_id_enabled ? '1px solid #4A7C4E' : '1px solid var(--border)'
              }}>
                {p.face_id_enabled ? 'SECURE' : 'NONE'}
              </span>
            </div>
            
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', textTransform: 'uppercase' }}>EMBEDDING TENSOR</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getDescriptorString(p.face_descriptor)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
