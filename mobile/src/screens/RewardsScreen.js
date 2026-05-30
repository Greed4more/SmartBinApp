import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

const STORE_ITEMS = [
  { id: ' seeds', name: 'Organic Garden Seeds', cost: 150, icon: '🌱' },
  { id: 'bottle', name: 'Bamboo Eco Thermos', cost: 450, icon: '🧉' },
  { id: 'tote', name: 'Canvas Tote Bag', cost: 100, icon: '👜' }
];

export default function RewardsScreen({ user }) {
  const [coins, setCoins] = useState(user.eco_coins || 0);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase.from('users').select('eco_coins').eq('uid', user.uid).single();
      if (profile) setCoins(profile.eco_coins);

      const { data: history } = await supabase.from('transactions').select('*').eq('user_id', user.uid).order('created_at', { ascending: false }).limit(10);
      if (history) setTxs(history);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (item) => {
    if (coins < item.cost) return;
    try {
      const newCoins = coins - item.cost;
      await supabase.from('users').update({ eco_coins: newCoins }).eq('uid', user.uid);
      await supabase.from('transactions').insert({
        user_id: user.uid,
        type: 'redeem',
        amount: item.cost,
        reason: `Mobile: ${item.name}`
      });
      setCoins(newCoins);
      fetchData();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ECO LEDGER</Text>
        <Text style={styles.subtitle}>YOUR TRANSACTIONS & ECOCOINS</Text>
      </View>

      <View style={styles.coinsHeader}>
        <Text style={styles.coinsVal}>{coins} <Text style={{ fontSize: 14 }}>Coins</Text></Text>
      </View>

      <Text style={styles.sectionLabel}>ECO REWARDS STORE</Text>
      <View style={{ maxHeight: 180, marginBottom: 12 }}>
        <FlatList
          data={STORE_ITEMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const canAfford = coins >= item.cost;
            return (
              <View style={styles.storeItem}>
                <Text style={styles.storeIcon}>{item.icon}</Text>
                <Text style={styles.storeItemName}>{item.name}</Text>
                <TouchableOpacity
                  style={[styles.redeemBtn, !canAfford && { backgroundColor: '#333' }]}
                  disabled={!canAfford}
                  onPress={() => handleRedeem(item)}
                >
                  <Text style={[styles.redeemText, !canAfford && { color: '#666' }]}>{item.cost} Coins</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>

      <Text style={styles.sectionLabel}>TRANSACTIONS HISTORY</Text>
      {loading ? (
        <ActivityIndicator color="#E8C547" />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View>
                <Text style={styles.txReason}>{item.reason}</Text>
                <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmt, item.type === 'earn' ? { color: '#6BBF6F' } : { color: '#E85454' }]}>
                {item.type === 'earn' ? '+' : '-'}{item.amount}
              </Text>
            </View>
          )}
        />
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
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  coinsHeader: {
    backgroundColor: 'rgba(232,197,71,0.06)',
    borderWidth: 1,
    borderColor: '#E8C547',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  coinsVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8C547',
  },
  sectionLabel: {
    color: '#8E8E8A',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  storeItem: {
    width: 140,
    backgroundColor: '#1E1E1C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeIcon: {
    fontSize: 28,
  },
  storeItemName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 6,
  },
  redeemBtn: {
    backgroundColor: '#E8C547',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  redeemText: {
    color: '#121210',
    fontWeight: 'bold',
    fontSize: 9,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  txReason: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  txDate: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  txAmt: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
