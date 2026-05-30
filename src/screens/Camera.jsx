import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { uploadToCloudinary } from '../utils/cloudinary';

const SIMULATED_ITEMS = [
  { item_name: 'Soda Can', category: 'metal', recyclable: true, hazardous: false, confidence: 96, description: 'Aluminum beverage tin container.', disposal_tip: 'Rinse thoroughly before dropping in the metal collection compartment.' },
  { item_name: 'Water Bottle', category: 'plastic', recyclable: true, hazardous: false, confidence: 94, description: 'PET plastic mineral bottle.', disposal_tip: 'Crush the container to minimize space and keep the cap secure.' },
  { item_name: 'Banana Peel', category: 'wet', recyclable: false, hazardous: false, confidence: 98, description: 'Organic biodegradable fruit peel.', disposal_tip: 'Compost-ready material. Route directly to the organic wet bin.' },
  { item_name: 'Cardboard Box', category: 'dry', recyclable: true, hazardous: false, confidence: 92, description: 'Pressed cellulose paper carton.', disposal_tip: 'Flatten boxes completely and drop inside the dry recycling container.' },
  { item_name: 'Lithium Battery', category: 'ewaste', recyclable: false, hazardous: true, confidence: 90, description: 'Heavy metal alkaline cell energy source.', disposal_tip: 'Hazardous waste. Must be stored separately to prevent fire risks.' },
];

export default function Camera() {
  const { t, saveScan } = useApp();
  const [phase, setPhase] = useState('idle');
  const [activeItem, setActiveItem] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    initializeCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (canvasRef.current) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 640;
        canvas.height = 480;
        
        const drawFrame = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          animationRef.current = requestAnimationFrame(drawFrame);
        };
        
        video.onloadedmetadata = () => {
          drawFrame();
        };
        
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (canvasRef.current) {
        drawSimulatedCamera();
      }
    }
  };

  const drawSimulatedCamera = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    
    let frameCount = 0;
    const draw = () => {
      frameCount++;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a4d2e');
      gradient.addColorStop(0.5, '#0f2818');
      gradient.addColorStop(1, '#051005');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 15;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.strokeStyle = '#E8C547';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = 'rgba(232, 197, 71, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 30, centerY);
      ctx.lineTo(centerX + 30, centerY);
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX, centerY + 30);
      ctx.stroke();
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const triggerScan = () => {
    setPhase('scanning');
    setStatusMsg('Capturing scan profile...');

    setTimeout(() => {
      const item = SIMULATED_ITEMS[Math.floor(Math.random() * SIMULATED_ITEMS.length)];
      
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:3000;opacity:1;transition:opacity 0.2s';
      document.body.appendChild(flash);
      setTimeout(() => flash.style.opacity = 0, 50);
      setTimeout(() => document.body.removeChild(flash), 200);

      setStatusMsg('AI Model Sorting...');
      
      setTimeout(async () => {
        try {
          let photoUrl = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80';
          
          if (canvasRef.current) {
            try {
              photoUrl = await uploadToCloudinary(canvasRef.current.toDataURL('image/jpeg', 0.6));
            } catch (e) {
              console.warn('Failed to upload canvas image', e);
            }
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
          console.error('Scan error:', err);
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
        position: 'relative', 
        flex: 1, 
        margin: '16px 20px', 
        borderRadius: 16, 
        overflow: 'hidden',
        background: '#0D0D0C', 
        border: '1px solid var(--border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#0D0D0C'
          }}
        />

        {/* Framing brackets overlay */}
        {phase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0 }}>
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
            position: 'absolute', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,18,0.95)', 
            border: '1px solid var(--yellow)', 
            color: 'var(--yellow)',
            fontFamily: 'var(--font-mono)', 
            fontSize: 10, 
            padding: '8px 16px', 
            borderRadius: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)', 
            zIndex: 10, 
            whiteSpace: 'nowrap'
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-display)', 
                fontSize: 18, 
                color: 'var(--yellow)',
                background: 'rgba(232,197,71,0.08)', 
                padding: '2px 8px', 
                borderRadius: 4
              }}>
                {activeItem.item_name}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', 
                fontSize: 9,
                background: activeItem.recyclable ? 'rgba(74,124,78,0.2)' : 'rgba(232,84,84,0.2)',
                color: activeItem.recyclable ? '#6BBF6F' : '#E85454',
                border: activeItem.recyclable ? '1px solid #4A7C4E' : '1px solid #E85454',
                padding: '2px 6px', 
                borderRadius: 4, 
                textTransform: 'uppercase', 
                marginLeft: 'auto'
              }}>
                {activeItem.recyclable ? 'RECYCLABLE' : 'NON-RECYCLABLE'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>CATEGORY</span>
                <div style={{ fontSize: 13, textTransform: 'capitalize', fontWeight: 600, marginTop: 2 }}>
                  {t(activeItem.category)}
                </div>
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>REWARD COINS</span>
                <div style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600, marginTop: 2 }}>
                  +{activeItem.eco_coins_earned} Coins
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>DISPOSAL TIPS</span>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 1.4 }}>
                {activeItem.disposal_tip}
              </p>
            </div>

            <button 
              onClick={resetScan} 
              className="scan-btn" 
              style={{ marginTop: 16, height: 40, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)' }}
            >
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
