import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../utils/translations'

const AppContext = createContext({})

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn('localStorage write blocked:', err);
  }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [binData, setBinData] = useState({ dry: 45, wet: 30, metal: 20, fill_level: 45 })
  const [ecoCoins, setEcoCoins] = useState(0)
  const [totalScans, setTotalScans] = useState(0)
  const [recentScans, setRecentScans] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('dark')
  const [faceVerified, setFaceVerified] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const subs = useRef([])

  useEffect(() => {
    const init = async () => {
      try {
        const saved = localStorage.getItem('sb_user')
        const savedTheme = localStorage.getItem('sb_theme') || 'dark'
       
        setTheme(savedTheme)
        document.body.className = savedTheme

        if (saved && saved !== 'undefined' && saved !== 'null') {
          const localUser = JSON.parse(saved)
          setUser(localUser)
         
          if (localUser.uid) {
            console.log('Refreshing user data from DB...')
            const { data, error } = await supabase.from('users').select('*').eq('uid', localUser.uid).single()
            if (!error && data) {
              setUser(data)
              setEcoCoins(data.eco_coins || 0)
              setTotalScans(data.total_scans || 0)
              setLanguage(data.language || 'en')
              safeSetItem('sb_user', JSON.stringify(data))
              subscribeRealtime(data.uid)
            } else if (error) {
              console.warn('Persistence refresh failed:', error.message)
              subscribeRealtime(localUser.uid)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load persisted state:', err)
      } finally {
        try {
          await Promise.all([
            loadBinData().catch(() => {}),
            fetchLeaderboard().catch(() => {})
          ]);
        } catch (e) {}
        setLoading(false)
      }
    }
    init()
  }, [])

  const loadUserData = async (uid) => {
    const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single()
    if (!error && data) {
      setUser(data)
      setEcoCoins(data.eco_coins || 0)
      setTotalScans(data.total_scans || 0)
      safeSetItem('sb_user', JSON.stringify(data))
      return data
    }
    return null
  }

  const updateUserProfile = async (updates) => {
    if (!user?.uid) throw new Error('Not logged in')
    
    if (updates.email && updates.email !== user.email) {
      const oldEmailKey = user.email.replace(/[.@]/g, '_')
      const newEmailKey = updates.email.replace(/[.@]/g, '_')
      await supabase.from('user_emails').delete().eq('email_key', oldEmailKey)
      await supabase.from('user_emails').insert({ email_key: newEmailKey, uid: user.uid, email: updates.email })
    }

    const { error } = await supabase.from('users').update(updates).eq('uid', user.uid)
    if (error) throw error
    const updated = { ...user, ...updates }
    setUser(updated)
    safeSetItem('sb_user', JSON.stringify(updated))
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    safeSetItem('sb_theme', newTheme)
    document.body.className = newTheme
  }

  const loadBinData = async () => {
    const { data } = await supabase.from('bins').select('*').eq('id', 'main_bin').single()
    if (data) setBinData(data)
  }

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('users').select('uid, name, eco_coins, level, phone').order('eco_coins', { ascending: false }).limit(5)
    if (data) setLeaderboard(data)
  }

  const subscribeRealtime = (uid) => {
    const binSub = supabase.channel('web-bin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bins', filter: 'id=eq.main_bin' },
        (p) => { if (p.new) setBinData(p.new) })
      .subscribe()

    const scanSub = supabase.channel('web-scans-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans', filter: `user_id=eq.${uid}` },
        () => {
          fetchScans(uid)
          fetchLeaderboard()
        })
      .subscribe()

    const boardSub = supabase.channel('web-leaderboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' },
        () => fetchLeaderboard())
      .subscribe()

    subs.current = [binSub, scanSub, boardSub]
    fetchScans(uid)
  }

  const fetchScans = async (uid) => {
    const { data } = await supabase.from('scans').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10)
    if (data) setRecentScans(data)
  }

  const loginUser = (userData) => {
    safeSetItem('sb_user', JSON.stringify(userData))
    setUser(userData)
    setEcoCoins(userData.eco_coins || 0)
    setTotalScans(userData.total_scans || 0)
    setLanguage(userData.language || 'en')
    subscribeRealtime(userData.uid)
  }

  const login = async (email, password) => {
    setLoading(true)
    const emailKey = email.replace(/[.@]/g, '_')
    const { data: emailRow } = await supabase.from('user_emails').select('uid').eq('email_key', emailKey).single()
    if (!emailRow) { setLoading(false); throw new Error('No account found') }
    const { data: userData } = await supabase.from('users').select('*').eq('uid', emailRow.uid).single()
    if (!userData || userData.password !== password) { setLoading(false); throw new Error('Incorrect password') }
    loginUser(userData)
    setLoading(false)
    return userData
  }

  const register = async (name, email, password, extra = {}) => {
    setLoading(true)
    const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const profileData = {
      uid, name, email, password,
      ...extra,
      language: 'en',
      eco_coins: 0, total_scans: 0,
      level: 1
    }
    const { error } = await supabase.from('users').insert(profileData)
    if (error) { setLoading(false); throw new Error(error.message) }
    await supabase.from('user_emails').insert({ email_key: email.replace(/[.@]/g, '_'), uid, email })
    setLoading(false)
    return profileData
  }

  const logout = () => {
    subs.current.forEach(s => s?.unsubscribe?.())
    localStorage.removeItem('sb_user')
    setUser(null); setEcoCoins(0); setTotalScans(0); setRecentScans([]); setFaceVerified(false)
  }

  const addEcoCoins = async (amount, reason) => {
    if (!user?.uid) return
    const newCoins = ecoCoins + amount
    await supabase.from('users').update({ eco_coins: newCoins, total_eco_coins_earned: (user.total_eco_coins_earned || 0) + amount, total_scans: totalScans + 1 }).eq('uid', user.uid)
    await supabase.from('transactions').insert({ user_id: user.uid, type: 'earn', amount, reason })
    const updated = { ...user, eco_coins: newCoins, total_scans: totalScans + 1 }
    safeSetItem('sb_user', JSON.stringify(updated))
    setUser(updated); setEcoCoins(newCoins); setTotalScans(t => t + 1)
  }

  const saveScan = async (scanData) => {
    if (!user?.uid) return
    await supabase.from('scans').insert({ user_id: user.uid, ...scanData })
    await addEcoCoins(scanData.eco_coins_earned || 5, `Scanned: ${scanData.item_name}`)
  }

  const redeemCoins = async (amount, rewardName) => {
    if (ecoCoins < amount) throw new Error('Insufficient EcoCoins')
    const newCoins = ecoCoins - amount
    await supabase.from('users').update({ eco_coins: newCoins }).eq('uid', user.uid)
    await supabase.from('transactions').insert({ user_id: user.uid, type: 'redeem', amount, reason: rewardName })
    const updated = { ...user, eco_coins: newCoins }
    safeSetItem('sb_user', JSON.stringify(updated))
    setUser(updated); setEcoCoins(newCoins)
  }

  const changeLanguage = async (newLang) => {
    setLanguage(newLang)
    if (user?.uid) {
      await supabase.from('users').update({ language: newLang }).eq('uid', user.uid)
      const updated = { ...user, language: newLang }
      safeSetItem('sb_user', JSON.stringify(updated))
      setUser(updated)
    }
  }

  const translate = (key) => t(language, key)

  return (
    <AppContext.Provider value={{
      user, setUser, binData, ecoCoins, totalScans, recentScans, leaderboard,
      loading, language, changeLanguage, t: translate,
      theme, toggleTheme, faceVerified, setFaceVerified,
      notificationsEnabled, setNotificationsEnabled,
      login, register, logout, addEcoCoins, saveScan, redeemCoins, updateUserProfile, loginUser
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
