import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { supabase } from '../lib/supabase';

export default function MapScreen() {
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBinLocation();
  }, []);

  const fetchBinLocation = async () => {
    try {
      const { data } = await supabase.from('bins').select('*').eq('id', 'main_bin').single();
      if (data) setBin(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#E8C547" />
        <Text style={styles.loadingText}>RESOLVING LOCATIONS...</Text>
      </View>
    );
  }

  // Fallback to Delhi coordinates if database fetch fails or returns null
  const region = {
    latitude: bin?.latitude || 28.6139,
    longitude: bin?.longitude || 77.2090,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BIN LOCATOR</Text>
        <Text style={styles.subtitle}>NEAREST SMART SEGREGATORS</Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={region}
          userInterfaceStyle="dark"
        >
          {bin && (
            <Marker
              coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
              pinColor="#E8C547"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{bin.name}</Text>
                  <Text style={styles.calloutAddress}>{bin.address}</Text>
                  <Text style={styles.calloutFill}>Fill capacity: {bin.fill_level}%</Text>
                </View>
              </Callout>
            </Marker>
          )}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121210',
    paddingTop: 48,
  },
  loading: {
    flex: 1,
    backgroundColor: '#121210',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E8A',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 20,
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
  mapWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 140,
    padding: 6,
  },
  calloutName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111',
  },
  calloutAddress: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  calloutFill: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E8C547',
    marginTop: 4,
  },
});
