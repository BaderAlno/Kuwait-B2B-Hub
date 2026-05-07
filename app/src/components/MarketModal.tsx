'use client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CURRENCIES, GCC_MARKETS } from '@/lib/currencies';

export default function MarketModal() {
  const { marketModalSeen, setCurrency, dismissMarketModal } = useCurrency();

  if (marketModalSeen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-white)', borderRadius: 20, padding: 32,
        maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌍</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Select Your Market
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Prices will be shown in your local currency. You can change this anytime.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {GCC_MARKETS.map(code => {
            const cfg = CURRENCIES[code];
            return (
              <button
                key={code}
                onClick={() => { setCurrency(code); dismissMarketModal(); }}
                style={{
                  border: '2px solid var(--border)', borderRadius: 14,
                  padding: '18px 14px', background: 'var(--bg-page)',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'border-color 0.15s, background 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-light)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-page)';
                }}
              >
                <span style={{ fontSize: 30 }}>{cfg.flag}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{cfg.country}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cfg.symbol} · {code}</span>
                {cfg.vatRate > 0 && (
                  <span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                    VAT {cfg.vatRate * 100}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={dismissMarketModal}
          style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}
        >
          Continue with KWD (Kuwait)
        </button>
      </div>
    </div>
  );
}
