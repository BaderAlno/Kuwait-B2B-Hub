'use client';
import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CURRENCIES, GCC_MARKETS } from '@/lib/currencies';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cfg = CURRENCIES[currency];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--bg-page)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
          height: 32,
        }}
        title="Change currency"
      >
        <span style={{ fontSize: 14 }}>{cfg.flag}</span>
        <span>{cfg.symbol}</span>
        <ChevronDown size={11} style={{ color: 'var(--text-muted)', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg-white)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 200, zIndex: 1000, overflow: 'hidden',
        }}>
          {GCC_MARKETS.map((code, i) => {
            const c = CURRENCIES[code];
            const isActive = code === currency;
            return (
              <button
                key={code}
                onClick={() => { setCurrency(code); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: isActive ? 'var(--blue-light)' : 'transparent',
                  border: 'none', borderBottom: i < GCC_MARKETS.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18 }}>{c.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'var(--blue)' : 'var(--text-primary)' }}>{c.country}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.name} · {c.symbol}</div>
                </div>
                {isActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
