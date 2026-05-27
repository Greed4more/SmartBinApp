import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Rewards() {
  const { t, ecoCoins, user } = useApp();
  const [txHistory, setTxHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [ecoCoins]);

  const fetchTransactions = async () => {
    if (!user?.uid) return;
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setTxHistory(data);
    } catch (e) {
      console.warn("Transaction fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const openCatalog = () => {
    // Dispatch event to app navigation to open ecocatalog
    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'ecocatalog' }));
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="screen screen-fade" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top bar */}
      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', letterSpacing: 1 }}>ECO LEDGER</div>
        <button
          onClick={openCatalog}
          className="scan-btn"
          style={{ height: 28, fontSize: 9, width: 'fit-content', padding: '0 12px', background: 'rgba(232,197,71,0.1)', color: 'var(--yellow)', border: '1px solid var(--yellow)' }}
        >
          REDEEM 🎁
        </button>
      </div>

      {/* Hero card */}
      <div className="ecocoins-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{t('rewardsBalance')}</div>
          <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--bg)', marginTop: 4 }}>
            {ecoCoins.toLocaleString()} <span style={{ fontSize: 18 }}>COINS</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10, marginTop: 4 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>TOTAL GAINED</div>
            <div style={{ fontSize: 13, color: 'var(--bg)', fontWeight: 600 }}>{user?.total_eco_coins_earned || ecoCoins}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>CURRENT LEVEL</div>
            <div style={{ fontSize: 13, color: 'var(--bg)', fontWeight: 600 }}>{user?.level || 1}</div>
          </div>
        </div>
      </div>

      {/* Ledger lists */}
      <div className="section-label" style={{ marginTop: 8 }}>{t('scanLedger').toUpperCase()}</div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>{t('loading')}</div>
        ) : txHistory.length > 0 ? (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {txHistory.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tx.type === 'earn' ? 'rgba(74,124,78,0.1)' : 'rgba(232,84,84,0.1)',
                  color: tx.type === 'earn' ? '#6BBF6F' : '#E85454',
                  fontSize: 14
                }}>
                  {tx.type === 'earn' ? '↙' : '↗'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.reason}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDate(tx.created_at)}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 15,
                  color: tx.type === 'earn' ? '#6BBF6F' : '#E85454'
                }}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}
