import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CameraScreen from './src/screens/CameraScreen';
import MapScreen from './src/screens/MapScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Fetch session or local profiles
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8C547" />
        <Text style={styles.loadingText}>SMARTBIN SECURE SHELL...</Text>
      </View>
    );
  }

  const renderScreen = () => {
    if (!user) {
      return <AuthScreen onLogin={setUser} />;
    }

    switch (activeTab) {
      case 'home':
        return <DashboardScreen user={user} onNavigate={setActiveTab} />;
      case 'camera':
        return <CameraScreen user={user} onNavigate={setActiveTab} />;
      case 'map':
        return <MapScreen user={user} onNavigate={setActiveTab} />;
      case 'rewards':
        return <RewardsScreen user={user} onNavigate={setActiveTab} />;
      case 'profile':
        return <ProfileScreen user={user} onLogout={() => setUser(null)} onNavigate={setActiveTab} />;
      default:
        return <DashboardScreen user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.screenWrapper}>{renderScreen()}</View>
      
      {user && (
        <View style={styles.tabBar}>
          <Text style={[styles.tabItem, activeTab === 'home' && styles.activeTab]} onPress={() => setActiveTab('home')}>⬡{"\n"}Home</Text>
          <Text style={[styles.tabItem, activeTab === 'map' && styles.activeTab]} onPress={() => setActiveTab('map')}>◎{"\n"}Map</Text>
          <Text style={styles.tabItemFab} onPress={() => setActiveTab('camera')}>📷</Text>
          <Text style={[styles.tabItem, activeTab === 'rewards' && styles.activeTab]} onPress={() => setActiveTab('rewards')}>◆{"\n"}Coins</Text>
          <Text style={[styles.tabItem, activeTab === 'profile' && styles.activeTab]} onPress={() => setActiveTab('profile')}>◈{"\n"}Profile</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121210',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121210',
  },
  loadingText: {
    color: '#E8C547',
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 2,
  },
  screenWrapper: {
    flex: 1,
  },
  tabBar: {
    height: 72,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1E1E1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  tabItem: {
    color: '#8E8E8A',
    fontSize: 10,
    textAlign: 'center',
  },
  activeTab: {
    color: '#E8C547',
  },
  tabItemFab: {
    fontSize: 26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8C547',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#121210',
    marginTop: -28,
    lineHeight: 52, // centering fix
    shadowColor: '#E8C547',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
});
