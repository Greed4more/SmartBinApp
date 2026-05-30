import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import FaceIDScreen from './FaceIDScreen';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { user, logout, t, theme, toggleTheme, notificationsEnabled, setNotificationsEnabled, updateUserProfile } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceMode, setFaceMode] = useState('setup');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');

  // Initialize form states when user loads or isEditing changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setPincode(user.pincode || '');
      setAddress(user.address || '');
      setDob(user.dob || '');
    }
  }, [user, isEditing]);

  const handleLogout = () => {
    logout();
  };

  const openBiometricsDebugger = () => {
    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'face-debug' }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const photoUrl = await uploadToCloudinary(reader.result);
          await updateUserProfile({ photo_url: photoUrl });
          setSuccessMsg('Profile photo updated successfully!');
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          setErrorMsg('Photo upload failed: ' + err.message);
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg('Failed to read image file.');
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateUserProfile({
        name,
        phone,
        email,
        pincode,
        address,
        dob: dob || null
      });
      setSuccessMsg('Profile details updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update details: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen screen-fade" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
      {/* Top Header */}
      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: 1 }}>USER PROFILE</div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#E85454', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer', textTransform: 'uppercase' }}>
          {t('logout')}
        </button>
      </div>
      {showFaceModal && (
        <FaceIDScreen
          mode={faceMode}
          targetUid={user?.uid}
          onClose={() => setShowFaceModal(false)}
          onSuccess={async (result) => {
            setShowFaceModal(false);
            try {
              const { data } = await supabase.from('users').select('*').eq('uid', user.uid).single();
              if (data) updateUserProfile({ ...data });
            } catch (err) {
              setErrorMsg('Failed to refresh profile: ' + err.message);
            }
          }}
        />
      )}

      {/* Success/Error Notifications */}
      {successMsg && (
        <div className="card card-enter" style={{ background: 'rgba(74,124,78,0.2)', border: '1px solid #4A7C4E', color: '#6BBF6F', padding: 10, textAlign: 'center', fontSize: 10, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="card card-enter" style={{ background: 'rgba(232,84,84,0.2)', border: '1px solid #E85454', color: '#E85454', padding: 10, textAlign: 'center', fontSize: 10, fontWeight: 500 }}>
          {errorMsg}
        </div>
      )}

      {/* Avatar details card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--yellow)',
            background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {uploadingPhoto ? (
              <span style={{ fontSize: 20, animation: 'spin 2s linear infinite' }}>⏳</span>
            ) : user?.photo_url ? (
              <img src={user.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28 }}>👤</span>
            )}
          </div>
          <label style={{
            position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%',
            background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', border: '2px solid #1A1A18'
          }}>
            📷
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhoto} />
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {user?.face_id_enabled ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>FaceID: Enabled</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setFaceMode('setup'); setShowFaceModal(true); }} style={{ background: 'rgba(232,197,71,0.08)', border: '1px solid var(--yellow)', color: 'var(--yellow)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Re-enrol Face</button>
                <button onClick={async () => {
                  // remove face descriptor from DB
                  setErrorMsg('');
                  try {
                    await supabase.from('users').update({ face_descriptor: null, face_id_enabled: false }).eq('uid', user.uid);
                    // fetch latest profile and update
                    const { data } = await supabase.from('users').select('*').eq('uid', user.uid).single();
                    if (data) updateUserProfile({ ...data });
                  } catch (err) {
                    setErrorMsg('Failed to remove FaceID: ' + err.message);
                  }
                }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Remove Face</button>
              </div>
            </>
          ) : (
            <button onClick={() => { setFaceMode('setup'); setShowFaceModal(true); }} style={{ background: 'rgba(232,197,71,0.08)', border: '1px solid var(--yellow)', color: 'var(--yellow)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Register Face</button>
          )}
          {/* Always-visible manage control in case flags are out-of-sync or user needs to enroll */}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => { setFaceMode('setup'); setShowFaceModal(true); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Manage FaceID</button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.name || 'SmartBin Citizen'}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: 'inline-block', background: 'rgba(232,197,71,0.1)', color: 'var(--yellow)', fontSize: 8, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, marginTop: 6, textTransform: 'uppercase' }}>
            RANK: LEVEL {user?.level || 1}
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      {isEditing ? (
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--yellow)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 4 }}>EDIT DETAILS</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>NAME</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>PHONE</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>PINCODE</label>
              <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>EMAIL ID</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>ADDRESS</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>DATE OF BIRTH</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="scan-btn" style={{ flex: 1, height: 38, fontSize: 12 }}>
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="scan-btn" style={{ flex: 1, height: 38, fontSize: 12, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)' }}>
              CANCEL
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* User Details display card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>PROFILE INFORMATION</span>
              <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', textTransform: 'uppercase' }}>
                [ EDIT DETAILS ]
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>Phone Number</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2 }}>{user?.phone || 'Not added'}</div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>Pincode</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2 }}>{user?.pincode || 'Not added'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>Date of Birth</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2 }}>{user?.dob || 'Not added'}</div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>City / State</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2 }}>{(user?.city || user?.state) ? `${user?.city || ''}, ${user?.state || ''}` : 'Not added'}</div>
              </div>
            </div>

            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>Address</span>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2, lineHeight: 1.3 }}>{user?.address || 'Not added'}</div>
            </div>
          </div>
        </div>
      )}

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
      {/* Floating quick access for FaceID (always visible when logged in) */}
      {user && (
        <button onClick={() => { setFaceMode('setup'); setShowFaceModal(true); }}
          title="Open FaceID"
          style={{
            position: 'fixed', right: 18, bottom: 18, zIndex: 3000,
            background: 'linear-gradient(180deg,#E8C547,#C89E22)', border: 'none', color: '#111', padding: '10px 12px', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.4)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13
          }}
        >
          👤 FaceID
        </button>
      )}
    </div>
  );
}
