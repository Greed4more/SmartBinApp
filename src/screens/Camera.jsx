import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { uploadToCloudinary } from '../utils/cloudinary';

const SIMULATED_ITEMS = [
  { item_name: 'Soda Can', category: 'metal', recyclable: true, hazardous: false, confidence: 96, description: 'Aluminum beverage tin container.', disposal_tip: 'Rinse thoroughly before dropping in the metal collection compartment.' },
  { item_name: 'Water Bottle', category: 'plastic', recyclable: true, hazardous: false, confidence: 94, description: 'PET plastic mineral bottle.', disposal_tip: 'Crush the container to minimize space and keep the cap secure.' },
  { item_name: 'Banana Peel', category: 'wet', recyclable: false, hazardous: false, confidence: 98, description: 'Organic biodegradable fruit peel.', disposal_tip: 'Compost-ready material. Route directly to the organic wet bin.' },
  { item_name: 'Cardboard Box', category: 'dry', recyclable: true, hazardous: false, confidence: 92, description: 'Pressed cellulose paper carton.', disposal_tip: 'Flatten boxes completely and drop inside the dry recycling container.' },
  { item_name: 'Lithium Battery', category: 'ewaste', recyclable: false, hazardous: true, confidence: 90, description: 'Heavy metal alkaline cell energy source.', disposal_tip: 'Hazardous waste. Must be stored separately to prevent fire risks.' },
]

export default function Camera() {
  const { t, saveScan } = useApp();
  const [streamActive, setStreamActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle, scanning, result, error
  const [activeItem, setActiveItem] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setStreamActive(true);
    } catch (err) {
      console.warn('Rear camera failed, trying default camera:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setStreamActive(true);
      } catch (err2) {
        console.warn('Webcam initialization failed:', err2);
        setStreamActive(false);
      }
    }
  };

  const stopVideo = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  };

  const triggerScan = () => {
    setPhase('scanning');
    setStatusMsg('Capturing scan profile...');

    setTimeout(() => {
      // Pick random simulated item
      const item = SIMULATED_ITEMS[Math.floor(Math.random() * SIMULATED_ITEMS.length)];
      
      // Perform flash
      const flash = document.createElement('div');
      flash.style.position = 'fixed'; flash.style.inset = 0; flash.style.background = '#fff'; flash.style.zIndex = 3000;
      document.body.appendChild(flash);
      setTimeout(() => flash.style.opacity = 0, 50);
      setTimeout(() => document.body.removeChild(flash), 200);

      setStatusMsg('AI Model Sorting...');
      setTimeout(async () => {
        try {
          let photoUrl = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80';
          
          if (videoRef.current && videoRef.current.readyState === 4) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            photoUrl = await uploadToCloudinary(canvas.toDataURL('image/jpeg', 0.6));
          }

          const ecoCoinsEarned = item.hazardous ? 2 : item.recyclable ? 15 : 5;
          const scanRecord = {
            category: item.category,
            item_name: item.item_name,
            description: item.description,
            confidence: item.confidence,
            recyclable: item.recyclable,
            hazardous: item.hazardous,
            disposal_tip: item.disposal_tip,
            eco_coins_earned: ecoCoinsEarned,
            image_url: photoUrl
          };

          await saveScan(scanRecord);
          setActiveItem(scanRecord);
          setPhase('result');
        } catch (err) {
          console.error(err);
          setPhase('error');
          setStatusMsg('Failed to sync scan profile.');
        }
      }, 1000);
    }, 1500);
  };

  const resetScan = () => {
    setActiveItem(null);
    setPhase('idle');
    setStatusMsg('');
  };

  return (
    <div className="screen screen-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Bar */}
      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: 1 }}>
          {t('scanItem').toUpperCase()}
        </div>
        <div />
      </div>

      {/* Frame / Cam viewport */}
      <div style={{
        position: 'relative', flex: 1, margin: '16px 20px', borderRadius: 16, overflow: 'hidden',
        background: '#0D0D0C', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {streamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <span style={{ fontSize: 40 }}>📹</span>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 8 }}>VIRTUAL CAMERA CAMERA EMULATION</div>
          </div>
        )}

        {/* Framing brackets overlay */}
        {phase === 'idle' && (
          <div className="camera-frame">
            <div style={{ position: 'absolute', top: 20, left: 20, width: 24, height: 24, borderLeft: '3px solid var(--yellow)', borderTop: '3px solid var(--yellow)' }} />
            <div style={{ position: 'absolute', top: 20, right: 20, width: 24, height: 24, borderRight: '3px solid var(--yellow)', borderTop: '3px solid var(--yellow)' }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, width: 24, height: 24, borderLeft: '3px solid var(--yellow)', borderBottom: '3px solid var(--yellow)' }} />
            <div style={{ position: 'absolute', bottom: 20, right: 20, width: 24, height: 24, borderRight: '3px solid var(--yellow)', borderBottom: '3px solid var(--yellow)' }} />
          </div>
        )}

        {/* Laser scanner animation */}
        {phase === 'scanning' && (
          <div className="face-scan-laser" />
        )}

        {/* Scan Status banner */}
        {statusMsg && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(20,20,18,0.95)', border: '1px solid var(--yellow)', color: 'var(--yellow)',
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '8px 16px', borderRadius: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 10, whiteSpace: 'nowrap'
          }}>
            {statusMsg.toUpperCase()}
          </div>
        )}
      </div>

      {/* Control panel & results overlay */}
      <div style={{ padding: '0 20px 24px 20px' }}>
        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              {t('scanDescription')}
            </p>
            <button onClick={triggerScan} className="scan-btn" style={{ height: 50, fontSize: 16 }}>
              CAPTURE SCAN
            </button>
          </div>
        )}

        {phase === 'scanning' && (
          <button disabled className="scan-btn" style={{ height: 50, fontSize: 16, opacity: 0.5 }}>
            CLARIFYING IMAGE...
          </button>
        )}

        {phase === 'result' && activeItem && (
          <div className="card card-enter" style={{ border: '1px solid var(--yellow)' }}>
            <div style={{ display: 'flex', justifySpace: 'between', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--yellow)',
                background: 'rgba(232,197,71,0.08)', padding: '2px 8px', borderRadius: 4
              }}>
                {activeItem.item_name}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                background: activeItem.recyclable ? 'rgba(74,124,78,0.2)' : 'rgba(232,84,84,0.2)',
                color: activeItem.recyclable ? '#6BBF6F' : '#E85454',
                border: activeItem.recyclable ? '1px solid #4A7C4E' : '1px solid #E85454',
                padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', marginLeft: 'auto'
              }}>
                {activeItem.recyclable ? 'RECYCLABLE' : 'NON-RECYCLABLE'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>CATEGORY</span>
                <div style={{ fontSize: 13, textTransform: 'capitalize', fontWeight: 600, marginTop: 2 }}>{t(activeItem.category)}</div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>REWARD COINS</span>
                <div style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600, marginTop: 2 }}>+{activeItem.eco_coins_earned} Coins</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>DISPOSAL TIPS</span>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 1.4 }}>{activeItem.disposal_tip}</p>
            </div>

            <button onClick={resetScan} className="scan-btn" style={{ marginTop: 16, height: 40, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)' }}>
              SCAN ANOTHER
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="card card-enter" style={{ border: '1px solid #E85454' }}>
            <div style={{ color: '#E85454', fontFamily: 'var(--font-display)', fontSize: 16 }}>SCAN FAIL</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Please make sure your device is connected and reload.</p>
            <button onClick={resetScan} className="scan-btn" style={{ marginTop: 16, height: 40, fontSize: 13 }}>TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}
