import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function MapScreen() {
  const { t, binData } = useApp();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Delhi coordinates from Demo Bin
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  useEffect(() => {
    // Check if Leaflet L is loaded from CDN
    if (!window.L) {
      console.warn("Leaflet script not yet available.");
      return;
    }

    if (mapRef.current && !leafletMap.current) {
      // Initialize map
      leafletMap.current = window.L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: false
      });

      // Add Tile Layer
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(leafletMap.current);

      // Add Zoom Control at bottom right
      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(leafletMap.current);

      setMapLoaded(true);
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

  useEffect(() => {
    if (leafletMap.current && mapLoaded) {
      // Clear old markers if any (for safety, though here we just make one)
      // Add custom icon or standard pin
      const fill = binData?.fill_level || 45;
      
      const popupContent = `
        <div style="color: #000; font-family: sans-serif; font-size: 11px; width: 140px;">
          <b style="font-size: 12px; color: #111;">${binData?.name || 'SmartBin Hub'}</b><br/>
          <span style="color: #666;">${binData?.address || 'New Delhi Central'}</span><br/>
          <div style="margin-top: 6px; display: flex; justify-content: space-between; font-weight: bold;">
            <span>Fill level:</span>
            <span style="color: ${fill > 85 ? '#E85454' : '#4A7C4E'}">${fill}%</span>
          </div>
        </div>
      `;

      const marker = window.L.marker([defaultLat, defaultLng])
        .addTo(leafletMap.current)
        .bindPopup(popupContent);
      
      // Auto-open pop-up
      marker.openPopup();
    }
  }, [binData, mapLoaded]);

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

        {/* Loading overlay if leaflet is not loaded */}
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
    </div>
  );
}
