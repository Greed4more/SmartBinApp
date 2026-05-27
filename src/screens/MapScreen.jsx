import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function MapScreen() {
  const { t } = useApp();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const userMarkerRef = useRef(null);
  const binMarkersRef = useRef([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [binsList, setBinsList] = useState([]);

  // Default fallback (Delhi coordinates)
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  // 1. Fetch bins from database in real-time
  useEffect(() => {
    const fetchBins = async () => {
      try {
        const { data, error } = await supabase.from('bins').select('*');
        if (!error && data) {
          setBinsList(data);
        }
      } catch (err) {
        console.warn("Failed to fetch bins:", err);
      }
    };

    fetchBins();

    // Subscribe to realtime database changes for bins
    const channel = supabase.channel('realtime-map-bins')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bins' }, () => {
        fetchBins();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!window.L) {
      console.warn("Leaflet script not yet available.");
      return;
    }

    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: false
      });

      // Dark theme tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(leafletMap.current);

      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(leafletMap.current);

      setMapLoaded(true);

      // Request Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserCoords({ latitude, longitude });

            // Center map on user
            if (leafletMap.current) {
              leafletMap.current.setView([latitude, longitude], 14);
            }

            // Sync the demo bin to be nearby (e.g. ~400 meters away) so the user has local data
            try {
              await supabase.from('bins').update({
                latitude: latitude + 0.003,
                longitude: longitude + 0.003,
                address: 'SmartBin Nearby Node'
              }).eq('id', 'main_bin');
            } catch (err) {
              console.warn("Failed to reposition demo bin:", err);
            }
          },
          (err) => {
            console.warn("Geolocation permission denied or failed:", err.message);
          }
        );
      }
    }

    // Cleanup
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // 3. Render markers (user + bins)
  useEffect(() => {
    if (!leafletMap.current || !mapLoaded) return;

    // Clear existing bin markers
    binMarkersRef.current.forEach(marker => marker.remove());
    binMarkersRef.current = [];

    // Draw user marker if available
    if (userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = window.L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background-color: #3A8DFF; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(58,141,255,0.6); animation: pulse 2s infinite;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      userMarkerRef.current = window.L.marker([userCoords.latitude, userCoords.longitude], { icon: userIcon })
        .addTo(leafletMap.current)
        .bindPopup(`<div style="color: #000; font-family: sans-serif; font-size: 11px; font-weight: bold; text-align: center;">Your Current Location</div>`);
    }

    // Draw bin markers
    binsList.forEach(bin => {
      const fill = bin.fill_level || 0;
      
      const popupContent = `
        <div style="color: #000; font-family: sans-serif; font-size: 11px; width: 150px; padding: 2px;">
          <b style="font-size: 12px; color: #111; display: block; margin-bottom: 4px;">🔋 ${bin.name}</b>
          <span style="color: #666; font-size: 10px; display: block; margin-bottom: 6px;">📍 ${bin.address}</span>
          <div style="border-top: 1px solid #eee; padding-top: 6px; display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Fill Level:</span>
              <span style="font-weight: bold; color: ${fill > 80 ? '#E85454' : '#4A7C4E'}">${fill}%</span>
            </div>
            <div style="font-size: 9px; color: #999; margin-top: 2px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
              <span>🟡 Dry: ${bin.dry}%</span>
              <span>🟢 Wet: ${bin.wet}%</span>
              <span>🔵 Met: ${bin.metal}%</span>
            </div>
          </div>
        </div>
      `;

      // Custom green or yellow bin marker depending on capacity
      const binColor = fill > 80 ? '#E85454' : 'var(--yellow)';
      const binIcon = window.L.divIcon({
        className: 'custom-bin-marker',
        html: `<div style="background-color: ${binColor === 'var(--yellow)' ? '#E8C547' : binColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = window.L.marker([bin.latitude, bin.longitude], { icon: binIcon })
        .addTo(leafletMap.current)
        .bindPopup(popupContent);

      binMarkersRef.current.push(marker);
    });

  }, [binsList, userCoords, mapLoaded]);

  return (
    <div className="screen screen-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: 1 }}>SMARTBIN LOCATOR</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{t('mapSub')}</div>
        </div>
        <div />
      </div>

      {/* Map Content Viewport */}
      <div style={{ flex: 1, position: 'relative', margin: '16px 20px 24px 20px', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#1A1A18' }} />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div style={{
            position: 'absolute', inset: 0, background: '#1A1A18', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 1000
          }}>
            <span style={{ fontSize: 24, animation: 'spin 2s linear infinite' }}>⏳</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{t('loadingMap')}</span>
          </div>
        )}
      </div>

      {/* Keyframe animation for marker pulse */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(58, 141, 255, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(58, 141, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(58, 141, 255, 0); }
        }
      `}</style>
    </div>
  );
}
