import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function MapScreen() {
  const { t } = useApp();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const userMarkerRef = useRef(null);
  const gpsMarkerRef = useRef(null);
  const channelRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [dustbinLoc, setDustbinLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [timeText, setTimeText] = useState('Never');

  // Default fallback (Delhi coordinates)
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  // 1. Fetch initial live GPS coordinates
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
        
        // If map is initialized, center on it
        if (leafletMap.current && autoCenter) {
          leafletMap.current.setView([data.latitude, data.longitude], 14);
        }
      } else {
        throw new Error("No tracking record found with ID = 1");
      }
    } catch (e) {
      console.warn("Initial GPS fetch failed:", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Set up realtime Supabase channel listener
  const setupRealtimeSubscription = () => {
    setConnectionStatus('CONNECTING...');
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('live-web-gps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dustbin_locations',
          filter: 'id=eq.1'
        },
        (payload) => {
          console.log('Realtime coordinate update:', payload.new);
          if (payload.new) {
            setDustbinLoc(payload.new);
            setLastUpdated(new Date(payload.new.updated_at || Date.now()));
            setConnectionStatus('CONNECTED');
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime socket status:', status);
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

  // Trigger initial fetch and setup subscription
  useEffect(() => {
    fetchInitialLocation();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!window.L) {
      console.warn("Leaflet script not yet available.");
      return;
    }

    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: false
      });

      // Premium Dark theme tiles from CartoDB
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(leafletMap.current);

      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(leafletMap.current);

      setMapLoaded(true);

      // Request Geolocation to show user marker on map
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserCoords({ latitude, longitude });
          },
          (err) => {
            console.warn("Geolocation permission denied:", err.message);
          }
        );
      }
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // 4. Update markers dynamically when GPS coordinates or user position change
  useEffect(() => {
    if (!leafletMap.current || !mapLoaded) return;

    // A. Draw or update User marker
    if (userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = window.L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background-color: #3A8DFF; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(58,141,255,0.6); animation: pulseUser 2s infinite;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      userMarkerRef.current = window.L.marker([userCoords.latitude, userCoords.longitude], { icon: userIcon })
        .addTo(leafletMap.current)
        .bindPopup(`<div style="color: #000; font-family: monospace; font-size: 11px; font-weight: bold; text-align: center;">Your Current Location</div>`);
    }

    // B. Draw or update GPS Tracked Dustbin marker
    if (dustbinLoc) {
      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.remove();
      }

      const binIcon = window.L.divIcon({
        className: 'custom-bin-marker',
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(232, 197, 71, 0.2); border: 1.5px solid #E8C547; animation: pulseBin 2s infinite;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #E8C547; border: 1.5px solid #fff; box-shadow: 0 0 6px rgba(0,0,0,0.4); z-index: 10;"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const popupContent = `
        <div style="color: #000; font-family: monospace; font-size: 11px; padding: 4px; width: 160px;">
          <b style="font-size: 12px; color: #111; display: block; margin-bottom: 4px;">🛰️ GPS Dustbin Node</b>
          <span style="color: #666; font-size: 9px; display: block; margin-bottom: 6px;">ID: Node-01 (ESP32)</span>
          <div style="border-top: 1px solid #eee; padding-top: 6px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Lat:</span>
              <span style="font-weight: bold;">${dustbinLoc.latitude.toFixed(6)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>Lng:</span>
              <span style="font-weight: bold;">${dustbinLoc.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      `;

      gpsMarkerRef.current = window.L.marker([dustbinLoc.latitude, dustbinLoc.longitude], { icon: binIcon })
        .addTo(leafletMap.current)
        .bindPopup(popupContent);

      // Autocenter on update
      if (autoCenter) {
        leafletMap.current.setView([dustbinLoc.latitude, dustbinLoc.longitude], leafletMap.current.getZoom());
      }
    }
  }, [dustbinLoc, userCoords, mapLoaded, autoCenter]);

  // 5. Update last updated display timer
  useEffect(() => {
    const formatTimeElapsed = () => {
      if (!lastUpdated) return 'Never';
      const seconds = Math.floor((new Date() - lastUpdated) / 1000);
      if (seconds < 5) return 'Just now';
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    };

    setTimeText(formatTimeElapsed());
    const interval = setInterval(() => {
      setTimeText(formatTimeElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getStatusColor = () => {
    if (connectionStatus === 'CONNECTED') return '#6BBF6F';
    if (connectionStatus === 'CONNECTING...' || connectionStatus === 'RECONNECTING...') return '#E8C547';
    return '#E85454';
  };

  return (
    <div className="screen screen-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: 1 }}>SMARTBIN LOCATOR</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>LIVE ESP32 GPS TRACKING</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(26,26,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor() }}></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#fff', letterSpacing: 0.5 }}>
            GPS STATUS: <b>{connectionStatus}</b>
          </div>
        </div>
      </div>

      {/* Map Content Viewport */}
      <div style={{ flex: 1, position: 'relative', margin: '16px 20px 24px 20px', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#1A1A18' }} />

        {/* Floating Telemetry Panel */}
        {dustbinLoc && (
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(26,26,24,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 16,
            zIndex: 1000,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            pointerEvents: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>🛰️ LIVE GPS TELEMETRY</span>
              <button 
                onClick={() => setAutoCenter(!autoCenter)}
                style={{
                  background: autoCenter ? 'rgba(232,197,71,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${autoCenter ? '#E8C547' : 'rgba(255,255,255,0.1)'}`,
                  color: autoCenter ? '#E8C547' : '#8E8E8A',
                  fontSize: 8,
                  fontFamily: 'var(--font-mono)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: autoCenter ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {autoCenter ? 'LOCK CAM' : 'FREE CAM'}
              </button>
            </div>

            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#8E8E8A', fontSize: 8, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>LATITUDE</div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                  {dustbinLoc.latitude.toFixed(6)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#8E8E8A', fontSize: 8, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>LONGITUDE</div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                  {dustbinLoc.longitude.toFixed(6)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
              <div>
                <div style={{ color: '#8E8E8A', fontSize: 7, fontFamily: 'var(--font-mono)' }}>LAST UPDATE PING</div>
                <div style={{ color: '#E8C547', fontSize: 10, fontWeight: 'bold', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {timeText}
                </div>
              </div>
              <button 
                onClick={fetchInitialLocation}
                style={{
                  background: 'rgba(232,197,71,0.1)',
                  border: '1px solid #E8C547',
                  color: '#E8C547',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                SYNC NOW
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(loading || !mapLoaded) && (
          <div style={{
            position: 'absolute', inset: 0, background: '#1A1A18', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 1100
          }}>
            <span style={{ fontSize: 24, animation: 'spin 2s linear infinite' }}>⏳</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              CONNECTING TO TELEMETRY MATRIX...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div style={{
            position: 'absolute', inset: 0, background: '#1A1A18', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1100, textAlign: 'center'
          }}>
            <span style={{ fontSize: 32, marginBottom: 12 }}>⚠️</span>
            <span style={{ color: '#E85454', fontSize: 14, fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>
              TELEMETRY SYNC FAILED
            </span>
            <span style={{ color: '#8E8E8A', fontSize: 10, maxWidth: 300, marginBottom: 20, lineHeight: 1.5 }}>
              {error}
            </span>
            <button 
              onClick={fetchInitialLocation}
              style={{
                background: 'rgba(232,84,84,0.1)',
                border: '1px solid #E85454',
                color: '#E85454',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                padding: '10px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              RETRY CONNECTION
            </button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulseUser {
          0% { box-shadow: 0 0 0 0 rgba(58, 141, 255, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(58, 141, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(58, 141, 255, 0); }
        }
        @keyframes pulseBin {
          0% { transform: scale(0.9); opacity: 1; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
