import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import FaceEnrollScreen from './FaceEnrollScreen';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ user, onLogout, onNavigate }) {
  const [showEnroll, setShowEnroll] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MY PROFILE</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutBtn}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {user.photo_url ? (
              <Image source={{ uri: user.photo_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
          </View>
          <View>
            <Text style={styles.name}>{user.name || 'Citizen'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>LEVEL {user.level || 1} WARRIOR</Text>
            </View>
          </View>
        </View>
        <View style={{ marginLeft: 12 }}>
          {user?.face_id_enabled ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setShowEnroll(true)} style={{ padding: 8, backgroundColor: 'rgba(232,197,71,0.08)', borderRadius: 8 }}>
                <Text style={{ color: '#E8C547' }}>Re-enrol Face</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                try {
                  await supabase.from('users').update({ face_descriptor: null, face_id_enabled: false }).eq('uid', user.uid);
                } catch (err) {
                  console.warn('Failed to remove face:', err);
                }
              }} style={{ padding: 8, backgroundColor: 'transparent', borderRadius: 8 }}>
                <Text style={{ color: '#fff' }}>Remove Face</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowEnroll(true)} style={{ padding: 8, backgroundColor: 'rgba(232,197,71,0.08)', borderRadius: 8 }}>
              <Text style={{ color: '#E8C547' }}>Register Face</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>STATS ANALYSIS</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{user.total_scans || 0}</Text>
          <Text style={styles.statSub}>SCANS SUBMITTED</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{((user.total_scans || 0) * 0.4).toFixed(1)}kg</Text>
          <Text style={styles.statSub}>CO2 OFFSETS</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>BIOMETRIC PROFILE</Text>
      <View style={styles.card}>
        <View style={styles.biometricRow}>
          <View>
            <Text style={styles.bioTitle}>Face ID Authentication</Text>
            <Text style={styles.bioSub}>Used for quick account logs</Text>
          </View>
          <Text style={styles.bioStatus}>
            {user.face_id_enabled ? '● ENABLED' : '○ DISABLED'}
          </Text>
        </View>
      </View>
      {showEnroll && (
        <FaceEnrollScreen user={user} onClose={() => setShowEnroll(false)} onSuccess={async () => {
          setShowEnroll(false);
          try {
            const { data } = await supabase.from('users').select('*').eq('uid', user.uid).single();
            // simple re-render by navigating back to profile
            onNavigate('profile');
          } catch (err) { console.warn('refresh error', err); }
        }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121210',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoutBtn: {
    color: '#E85454',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(30,30,28,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E8C547',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    color: '#8E8E8A',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: 'rgba(232,197,71,0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rankText: {
    color: '#E8C547',
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  sectionLabel: {
    color: '#8E8E8A',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
  },
  statNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSub: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 4,
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bioSub: {
    color: '#8E8E8A',
    fontSize: 9,
    marginTop: 2,
  },
  bioStatus: {
    color: '#6BBF6F',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
