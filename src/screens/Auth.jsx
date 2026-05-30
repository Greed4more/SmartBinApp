import { useState } from 'react'
import { useApp } from '../context/AppContext'
import FaceIDScreen from './FaceIDScreen'

export default function Auth() {
  const { login, register, loading, loginUser, t } = useApp()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
 
  const [showFaceScan, setShowFaceScan] = useState(false)
  const [faceMode, setFaceMode] = useState('setup')
  const [pendingUser, setPendingUser] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        const newUser = await register(name, email, password, { phone, state, city, pincode, dob })
        setPendingUser(newUser)
        setFaceMode('setup')
        setShowFaceScan(true)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleFaceSuccess = (userOrPhotoUrl) => {
    if (pendingUser) {
      const finalUser = { 
        ...pendingUser, 
        photo_url: typeof userOrPhotoUrl === 'string' ? userOrPhotoUrl : null, 
        face_id_enabled: typeof userOrPhotoUrl === 'string' ? true : false 
      }
      loginUser(finalUser)
    } else if (userOrPhotoUrl && typeof userOrPhotoUrl === 'object') {
      loginUser(userOrPhotoUrl)
    }
    setShowFaceScan(false)
  }

  return (
    <div className="screen screen-fade" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 6, color: 'var(--text-light)' }}>
          SMART<span style={{ background: 'var(--yellow)', color: 'var(--bg)', padding: '0 8px' }}>BIN</span>
        </div>
      </div>

      <div className="card" style={{ padding: 20, background: 'rgba(37,37,35,0.8)', backdropFilter: 'blur(10px)', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16, color: 'var(--text-light)', letterSpacing: 2 }}>
          {isLogin ? t('signIn').toUpperCase() : t('createAccount').toUpperCase()}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isLogin && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('fullName').toUpperCase()}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('phoneNumber').toUpperCase()}</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('state').toUpperCase()}</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('city').toUpperCase()}</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('pincode').toUpperCase()}</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('dob').toUpperCase()}</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('emailAddress').toUpperCase()}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('password').toUpperCase()}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ background: '#2A2A28', border: '1px solid #444', borderRadius: 6, padding: 10, color: '#fff', fontSize: 13 }} required />
          </div>

          {error && <div style={{ color: '#E74C3C', fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={loading} className="scan-btn" style={{ marginTop: 8, height: 44, fontSize: 18 }}>
            {loading ? t('processing').toUpperCase() : isLogin ? t('signIn').toUpperCase() : t('signUp').toUpperCase()}
          </button>
        </form>

        <button
          onClick={() => {
            setFaceMode('login')
            setShowFaceScan(true)
          }}
          style={{
            width: '100%', marginTop: 12, padding: '12px',
            background: 'rgba(232,197,71,0.1)', border: '1px solid var(--yellow)',
            color: 'var(--yellow)', borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'
          }}
        >
          👤 {t('signInFaceId').toUpperCase()}
        </button>

        <button
          type="button"
          onClick={async () => {
            setError('')
            try {
              await login('test2@example.com', 'password')
            } catch (err) {
              setError(err.message)
            }
          }}
          style={{
            width: '100%', marginTop: 12, padding: '12px',
            background: 'rgba(107,191,111,0.1)', border: '1px solid #6BBF6F',
            color: '#6BBF6F', borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'
          }}
        >
          ⚡ DEMO QUICK LOGIN (ONE-CLICK)
        </button>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>
            {isLogin ? t('noAccount') : t('alreadyHaveAccount')}
          </button>
        </div>
      </div>

      {showFaceScan && (
        <FaceIDScreen
          mode={faceMode}
          targetUid={pendingUser?.uid}
          onClose={() => setShowFaceScan(false)}
          onSuccess={handleFaceSuccess}
        />
      )}
    </div>
  )
}

