import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { supabase } from '../lib/supabase';

const SIMULATED_ITEMS = [
  { item_name: 'Soda Can', category: 'metal', recyclable: true, hazardous: false, confidence: 96, description: 'Aluminum beverage container.', disposal_tip: 'Rinse and dry before disposal.' },
  { item_name: 'Water Bottle', category: 'plastic', recyclable: true, hazardous: false, confidence: 94, description: 'PET plastic mineral bottle.', disposal_tip: 'Crush the container and place inside.' },
  { item_name: 'Banana Peel', category: 'wet', recyclable: false, hazardous: false, confidence: 98, description: 'Organic biodegradable fruit waste.', disposal_tip: 'Route directly to the organic wet bin.' },
  { item_name: 'Cardboard Box', category: 'dry', recyclable: true, hazardous: false, confidence: 92, description: 'Paper carton container.', disposal_tip: 'Flatten boxes completely and insert.' }
];

export default function CameraScreen({ user, onNavigate }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedItem, setScannedItem] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('');
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (scanning) return;
    setScanning(true);
    setStatus('Extracting features...');

    setTimeout(() => {
      const item = SIMULATED_ITEMS[Math.floor(Math.random() * SIMULATED_ITEMS.length)];
      setStatus('AI categorization...');
      
      setTimeout(async () => {
        try {
          const coins = item.recyclable ? 15 : 5;
          
          // Write scan to Supabase
          const { error } = await supabase.from('scans').insert({
            user_id: user.uid,
            category: item.category,
            item_name: item.item_name,
            description: item.description,
            confidence: item.confidence,
            recyclable: item.recyclable,
            hazardous: item.hazardous,
            disposal_tip: item.disposal_tip,
            eco_coins_earned: coins
          });

          if (error) throw error;

          // Increment coins
          const { data: profile } = await supabase.from('users').select('eco_coins, total_scans').eq('uid', user.uid).single();
          if (profile) {
            await supabase.from('users').update({
              eco_coins: profile.eco_coins + coins,
              total_scans: profile.total_scans + 1
            }).eq('uid', user.uid);
            await supabase.from('transactions').insert({
              user_id: user.uid,
              type: 'earn',
              amount: coins,
              reason: `Mobile scanned: ${item.item_name}`
            });
          }

          setScannedItem(item);
          setScanning(false);
          setStatus('');
        } catch (err) {
          console.warn(err);
          setScanning(false);
          setStatus('Sync error.');
        }
      }, 1000);
    }, 1200);
  };

  if (hasPermission === null) {
    return <View style={styles.loading}><ActivityIndicator color="#E8C547" /></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: '#fff' }}>No camera permissions. Please allow camera permissions to scan.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scannedItem ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>SCAN COMPLETE</Text>
          
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={styles.itemName}>{scannedItem.item_name}</Text>
              <Text style={[styles.badge, scannedItem.recyclable ? styles.badgeGreen : styles.badgeRed]}>
                {scannedItem.recyclable ? 'RECYCLABLE' : 'ORGANIC'}
              </Text>
            </View>

            <View style={styles.resultBody}>
              <Text style={styles.bodyLabel}>CATEGORY</Text>
              <Text style={styles.bodyText}>{scannedItem.category.toUpperCase()}</Text>

              <Text style={[styles.bodyLabel, { marginTop: 12 }]}>DISPOSAL TIP</Text>
              <Text style={styles.bodyText}>{scannedItem.disposal_tip}</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => setScannedItem(null)}>
              <Text style={styles.btnText}>SCAN AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Camera ref={cameraRef} style={styles.camera} type={Camera.Constants.Type.back}>
            <View style={styles.overlay}>
              <View style={styles.viewfinder} />
              
              {status ? (
                <View style={styles.statusToast}>
                  <Text style={styles.statusToastText}>{status.toUpperCase()}</Text>
                </View>
              ) : null}
              
              <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} disabled={scanning}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </Camera>
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
  loading: {
    flex: 1,
    backgroundColor: '#121210',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#E8C547',
    borderRadius: 16,
    marginTop: 100,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8C547',
  },
  statusToast: {
    backgroundColor: '#1E1E1C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8C547',
  },
  statusToastText: {
    color: '#E8C547',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  resultTitle: {
    color: '#E8C547',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E1C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 14,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    fontSize: 8,
    fontFamily: 'monospace',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeGreen: {
    backgroundColor: 'rgba(74,124,78,0.1)',
    color: '#6BBF6F',
    borderColor: '#4A7C4E',
  },
  badgeRed: {
    backgroundColor: 'rgba(232,84,84,0.1)',
    color: '#E85454',
    borderColor: '#E85454',
  },
  resultBody: {
    paddingVertical: 16,
  },
  bodyLabel: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  bodyText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
