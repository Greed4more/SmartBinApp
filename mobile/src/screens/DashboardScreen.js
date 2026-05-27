import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';

export default function DashboardScreen({ user, onNavigate }) {
  const [binData, setBinData] = useState({ dry: 45, wet: 30, metal: 20, fill_level: 45 });
  const [ecoCoins, setEcoCoins] = useState(user.eco_coins || 0);
  const [totalScans, setTotalScans] = useState(user.total_scans || 0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBinStatus();
    fetchUserStats();
  }, []);

  const fetchBinStatus = async () => {
    const { data } = await supabase.from('bins').select('*').eq('id', 'main_bin').single();
    if (data) setBinData(data);
  };

  const fetchUserStats = async () => {
    const { data } = await supabase.from('users').select('*').eq('uid', user.uid).single();
    if (data) {
      setEcoCoins(data.eco_coins);
      setTotalScans(data.total_scans);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBinStatus(), fetchUserStats()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E8C547" />}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SMARTBIN HUB</Text>
        <Text style={styles.headerStatus}>● SYSTEM ONLINE</Text>
      </View>

      {/* Balance card */}
      <View style={styles.coinsCard}>
        <View style={styles.coinsRow}>
          <View>
            <Text style={styles.coinsValue}>{ecoCoins}</Text>
            <Text style={styles.coinsSub}>AVAILABLE ECOCOINS</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {user.level || 1}</Text>
          </View>
        </View>
      </View>

      {/* Grid metrics */}
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.gridNum}>{totalScans}</Text>
          <Text style={styles.gridSub}>TOTAL SCANS</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={[styles.gridNum, { color: '#6BBF6F' }]}>{(totalScans * 0.4).toFixed(1)}kg</Text>
          <Text style={styles.gridSub}>CO2 REDUCTION</Text>
        </View>
      </View>

      {/* Bin containers status */}
      <Text style={styles.sectionLabel}>CONTAINERS STATUS</Text>
      <View style={styles.card}>
        {/* Dry bin */}
        <View style={styles.binRow}>
          <View style={styles.binMeta}>
            <Text style={styles.binName}>🟡 DRY SEGREGRATED</Text>
            <Text style={styles.binPct}>{binData.dry}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${binData.dry}%`, backgroundColor: '#E8C547' }]} />
          </View>
        </View>

        {/* Wet bin */}
        <View style={[styles.binRow, { marginTop: 14 }]}>
          <View style={styles.binMeta}>
            <Text style={styles.binName}>🟢 ORGANIC WET</Text>
            <Text style={styles.binPct}>{binData.wet}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${binData.wet}%`, backgroundColor: '#4A7C4E' }]} />
          </View>
        </View>

        {/* Metal bin */}
        <View style={[styles.binRow, { marginTop: 14 }]}>
          <View style={styles.binMeta}>
            <Text style={styles.binName}>🔵 METAL CONTAINER</Text>
            <Text style={styles.binPct}>{binData.metal}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${binData.metal}%`, backgroundColor: '#3A5A8C' }]} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121210',
  },
  content: {
    padding: 20,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerStatus: {
    color: '#6BBF6F',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  coinsCard: {
    backgroundColor: '#E8C547',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#E8C547',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    marginBottom: 16,
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#121210',
  },
  coinsSub: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 1,
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: '#121210',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelText: {
    color: '#E8C547',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  gridCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
  },
  gridNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  gridSub: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 4,
  },
  sectionLabel: {
    color: '#8E8E8A',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(30,30,28,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  binRow: {
    width: '100%',
  },
  binMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  binName: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  binPct: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
