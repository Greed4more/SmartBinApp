import { useState } from 'react';
import { useApp } from '../context/AppContext';

const OFFERS = [
  { id: 'seeds', name: 'Organic Garden Seed Kit', cost: 150, desc: 'Set of 5 organic vegetable seed packs to start your green gardening journey.', icon: '🌱' },
  { id: 'bottle', name: 'Stainless Eco Thermos', cost: 450, desc: 'Double-walled stainless steel flask to stay hydrated sustainably.', icon: '🧉' },
  { id: 'tote', name: 'Hemp Fibre Tote Bag', cost: 100, desc: 'Reusable hand-woven organic hemp canvas bag for daily shopping.', icon: '👜' },
  { id: 'power', name: 'Mini Solar Phone Charger', cost: 800, desc: 'Pocket sized solar panel battery pack to charge devices using sunlight.', icon: '🔋' },
  { id: 'pass', name: 'Green Metro Travel Card', cost: 250, desc: 'Metro transit ride card voucher pre-loaded with public commuter fare.', icon: '🎫' },
]

export default function EcoCatalog({ onBack }) {
  const { t, ecoCoins, redeemCoins } = useApp();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRedeem = async (offer) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await redeemCoins(offer.cost, `Redeemed: ${offer.name}`);
      setSuccessMsg(`Successfully redeemed ${offer.name}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Redeem failed.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <div className="screen screen-fade" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: 18, cursor: 'pointer' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', letterSpacing: 2 }}>{t('ecoCatalogTitle').toUpperCase()}</h1>
      </div>

      {/* Balance panel */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>CURRENT COIN BALANCE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--yellow)', marginTop: 2 }}>{ecoCoins} Coins</div>
        </div>
        <span style={{ fontSize: 20 }}>🎁</span>
      </div>

      {/* Action alerts */}
      {successMsg && (
        <div className="card card-enter" style={{ background: 'rgba(74,124,78,0.2)', border: '1px solid #4A7C4E', color: '#6BBF6F', padding: 12, textAlign: 'center', fontSize: 11, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="card card-enter" style={{ background: 'rgba(232,84,84,0.2)', border: '1px solid #E85454', color: '#E85454', padding: 12, textAlign: 'center', fontSize: 11, fontWeight: 500 }}>
          {errorMsg}
        </div>
      )}

      {/* Store item listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
        {OFFERS.map(item => {
          const canAfford = ecoCoins >= item.cost;
          return (
            <div key={item.id} className="card" style={{ display: 'flex', gap: 14, padding: 14 }}>
              <div style={{
                fontSize: 24, width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.name}</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: canAfford ? 'var(--yellow)' : '#E85454', fontWeight: 600 }}>
                    {item.cost}
                  </span>
                </div>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.3 }}>{item.desc}</p>
                
                <button
                  onClick={() => handleRedeem(item)}
                  disabled={!canAfford}
                  className="scan-btn"
                  style={{
                    height: 28, fontSize: 10, marginTop: 10, width: '100%',
                    background: canAfford ? 'var(--yellow)' : 'rgba(255,255,255,0.05)',
                    color: canAfford ? 'var(--bg)' : 'rgba(255,255,255,0.3)',
                    border: canAfford ? 'none' : '1px solid var(--border)',
                    boxShadow: canAfford ? '0 4px 10px rgba(232,197,71,0.15)' : 'none'
                  }}
                >
                  {canAfford ? 'REDEEM REWARD' : 'INSUFFICIENT BALANCE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
