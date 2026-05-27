import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [ecoCoins, setEcoCoins] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [binData, setBinData] = useState({ dry: 0, wet: 0, metal: 0 });
  const [loading, setLoading] = useState(true);
  const subscriptions = useRef([]);

  useEffect(() => {
    AsyncStorage.getItem('language').then((lang) => { if (lang) setLanguageState(lang); });
    AsyncStorage.getItem('userId').then((uid) => { if (uid) loadUserData(uid); else setLoading(false); });
    return () => subscriptions.current.forEach((sub) => sub?.unsubscribe?.());
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const translate = (key) => t(language, key);

  const loadUserData = async (uid) => {
    try {
      // Fetch initial user data
      const { data: userData } = await supabase.from('users').select('*').eq('uid', uid).single();
      if (userData) {
        setUserProfile(userData);
        setUser({ uid, ...userData });
        setEcoCoins(userData.eco_coins || 0);
        setTotalScans(userData.total_scans || 0);
      }
      setLoading(false);

      // Real-time: user profile changes
      const userSub = supabase
        .channel('user-' + uid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `uid=eq.${uid}` }, (payload) => {
          const d = payload.new;
          setUserProfile(d); setUser((p) => ({ ...p, ...d }));
          setEcoCoins(d.eco_coins || 0); setTotalScans(d.total_scans || 0);
        })
        .subscribe();

      // Real-time: main bin status
      const binSub = supabase
        .channel('bin-main')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bins', filter: 'id=eq.main_bin' }, (payload) => {
          if (payload.new) setBinData(payload.new);
        })
        .subscribe();

      // Fetch initial bin data
      const { data: binRow } = await supabase.from('bins').select('*').eq('id', 'main_bin').single();
      if (binRow) setBinData(binRow);

      // Real-time: recent scans
      const scansSub = supabase
        .channel('scans-' + uid)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans', filter: `user_id=eq.${uid}` }, async () => {
          const { data } = await supabase.from('scans').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20);
          if (data) setRecentScans(data);
        })
        .subscribe();

      // Fetch initial scans
      const { data: scansData } = await supabase.from('scans').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20);
      if (scansData) setRecentScans(scansData);

      subscriptions.current = [userSub, binSub, scansSub];
    } catch (error) {
      console.error('loadUserData:', error);
      setLoading(false);
    }
  };

  const loginUser = async (uid, profileData) => {
    await AsyncStorage.setItem('userId', uid);
    setUser({ uid, ...profileData });
    setUserProfile(profileData);
    loadUserData(uid);
  };

  const logoutUser = async () => {
    subscriptions.current.forEach((sub) => sub?.unsubscribe?.());
    await AsyncStorage.removeItem('userId');
    setUser(null); setUserProfile(null); setEcoCoins(0); setTotalScans(0); setRecentScans([]);
  };

  const updateUserProfile = async (updates) => {
    if (!user?.uid) throw new Error('Not logged in');
    const { error } = await supabase.from('users').update(updates).eq('uid', user.uid);
    if (error) throw new Error(error.message);
    setUserProfile((p) => ({ ...p, ...updates }));
    setUser((p) => ({ ...p, ...updates }));
  };

  const addEcoCoins = async (amount, reason) => {
    if (!user?.uid) return;
    const newCoins = ecoCoins + amount;
    await supabase.from('users').update({ eco_coins: newCoins, total_eco_coins_earned: (userProfile?.total_eco_coins_earned || 0) + amount }).eq('uid', user.uid);
    await supabase.from('transactions').insert({ user_id: user.uid, type: 'earn', amount, reason });
    setEcoCoins(newCoins);
  };

  const redeemEcoCoins = async (amount, rewardName) => {
    if (ecoCoins < amount) throw new Error('Insufficient EcoCoins');
    const newCoins = ecoCoins - amount;
    const { error } = await supabase.from('users').update({ eco_coins: newCoins }).eq('uid', user.uid);
    if (error) throw new Error(error.message);
    await supabase.from('transactions').insert({ user_id: user.uid, type: 'redeem', amount, reason: rewardName });
    setEcoCoins(newCoins);
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, t: translate, user, userProfile, ecoCoins, totalScans, recentScans, binData, loading, loginUser, logoutUser, updateUserProfile, addEcoCoins, redeemEcoCoins, loadUserData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
