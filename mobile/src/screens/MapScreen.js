import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

export default function MapScreen() {
  const [dustbinLoc, setDustbinLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoCenter, setAutoCenter] = useState(true);
  
  const mapRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    fetchInitialLocation();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Fetch the initial location on mount
  const fetchInitialLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchErr } = await supabase
        .from('dustbin_locations')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (fetchErr) throw fetchErr;
      
      if (data) {
        setDustbinLoc(data);
        setLastUpdated(new Date(data.updated_at || Date.now()));
      } else {
        throw new Error("No tracking record found with ID = 1");
      }
    } catch (e) {
      console.warn("Initial fetch failed:", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen for realtime Postgres changes
  const setupRealtimeSubscription = () => {
    setConnectionStatus('CONNECTING...');
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('live-gps-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all updates/inserts
          schema: 'public',
          table: 'dustbin_locations',
          filter: 'id=eq.1'
        },
        (payload) => {
          console.log('Live coordinate update:', payload.new);
          if (payload.new) {
            setDustbinLoc(payload.new);
            setLastUpdated(new Date(payload.new.updated_at || Date.now()));
            setConnectionStatus('CONNECTED');
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status change:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('RECONNECTING...');
          setTimeout(setupRealtimeSubscription, 5000);
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('DISCONNECTED');
        }
      });

    channelRef.current = channel;
  };

  // Re-center camera when location updates if autoCenter toggle is on
  useEffect(() => {
    if (autoCenter && dustbinLoc && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: dustbinLoc.latitude,
        longitude: dustbinLoc.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012
      }, 1000);
    }
  }, [dustbinLoc, autoCenter]);

  // Formatter for "Last updated" text
  const formatTimeElapsed = () => {
    if (!lastUpdated) return 'Never';
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const [timeText, setTimeText] = useState('Never');
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeText(formatTimeElapsed());
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8C547" />
        <Text style={styles.loadingText}>CONNECTING TO TELEMETRY MATRIX...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>TELEMETRY SYNC FAILED</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchInitialLocation}>
          <Text style={styles.retryText}>RETRY CONNECTION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const region = {
    latitude: dustbinLoc?.latitude || 28.6139,
    longitude: dustbinLoc?.longitude || 77.2090,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  // Get status color coding
  const getStatusColor = () => {
    if (connectionStatus === 'CONNECTED') return '#6BBF6F';
    if (connectionStatus === 'CONNECTING...' || connectionStatus === 'RECONNECTING...') return '#E8C547';
    return '#E85454';
  };

  const isStale = lastUpdated && (new Date() - lastUpdated) > 600000;

  return (
    <View style={styles.container}>
      {/* Full-screen MapView */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {dustbinLoc && (
          <Marker
            coordinate={{ latitude: dustbinLoc.latitude, longitude: dustbinLoc.longitude }}
            title="ESP32 Smart Dustbin"
            description="Live GPS Tracking Node"
          >
            {/* Custom pulsating marker */}
            <View style={styles.markerContainer}>
              <View style={styles.pulseRing} />
              <View style={styles.markerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating Status Bar Overlay */}
      <View style={styles.statusHeader}>
        <View style={[styles.statusDot, { backgroundColor: isStale ? '#E85454' : getStatusColor() }]} />
        <Text style={styles.statusText}>
          GPS STATUS: <Text style={{ fontWeight: 'bold' }}>{isStale ? 'STALE / OFFLINE' : connectionStatus}</Text>
        </Text>
      </View>

      {/* Offline/Stale Signal Warning Banner */}
      {isStale && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ GPS HARDWARE OFFLINE OR HAS NO SATELLITE LOCK
          </Text>
          <Text style={styles.warningSub}>
            Make sure your hardware is powered on, has WiFi, and has a clear sky view outdoors. Showing last saved location.
          </Text>
        </View>
      )}

      {/* Floating Telemetry Panel */}
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryHeader}>
          <Text style={styles.telemetryTitle}>🛰️ LIVE GPS TELEMETRY</Text>
          <TouchableOpacity 
            style={[styles.autoCenterBtn, autoCenter && styles.autoCenterBtnActive]} 
            onPress={() => setAutoCenter(!autoCenter)}
          >
            <Text style={[styles.autoCenterText, autoCenter && styles.autoCenterTextActive]}>
              {autoCenter ? 'LOCK CAM' : 'FREE CAM'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>LATITUDE</Text>
            <Text style={styles.metricValue}>{dustbinLoc?.latitude?.toFixed(6) || '0.000000'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>LONGITUDE</Text>
            <Text style={styles.metricValue}>{dustbinLoc?.longitude?.toFixed(6) || '0.000000'}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerLabel}>LAST UPDATE PING</Text>
            <Text style={styles.footerValue}>{timeText}</Text>
          </View>
          <TouchableOpacity style={styles.syncBtn} onPress={fetchInitialLocation}>
            <Text style={styles.syncBtnText}>SYNC NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0C',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0D0D0C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#E8C547',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 14,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorTitle: {
    color: '#E85454',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
  },
  errorMsg: {
    color: '#8E8E8A',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  retryBtn: {
    background: 'rgba(232,84,84,0.1)',
    borderColor: '#E85454',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#E85454',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statusHeader: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    backgroundColor: 'rgba(26,26,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  telemetryCard: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26,26,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  autoCenterBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  autoCenterBtnActive: {
    backgroundColor: 'rgba(232,197,71,0.1)',
    borderColor: '#E8C547',
  },
  autoCenterText: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  autoCenterTextActive: {
    color: '#E8C547',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 12,
  },
  footerLabel: {
    color: '#8E8E8A',
    fontSize: 7,
    fontFamily: 'monospace',
  },
  footerValue: {
    color: '#E8C547',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: 'rgba(232,197,71,0.1)',
    borderColor: '#E8C547',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  syncBtnText: {
    color: '#E8C547',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  markerContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(232,197,71,0.2)',
    borderWidth: 1,
    borderColor: '#E8C547',
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8C547',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  warningBanner: {
    position: 'absolute',
    top: 96,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(232,84,84,0.95)',
    borderWidth: 1,
    borderColor: '#E85454',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  warningText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  warningSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 11,
  },
});
