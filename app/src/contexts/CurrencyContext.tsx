'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_CURRENCY, CURRENCIES, CurrencyConfig,
  convertPrice, formatPrice as _formatPrice, formatPriceWithVAT as _formatPriceWithVAT,
} from '@/lib/currencies';

interface CurrencyContextValue {
  currency: string;
  config: CurrencyConfig;
  setCurrency: (code: string) => void;
  convertPrice: (kwdAmount: number) => number;
  formatPrice: (kwdAmount: number) => string;
  formatPriceWithVAT: (kwdAmount: number) => string;
  marketModalSeen: boolean;
  dismissMarketModal: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);
  const [marketModalSeen, setMarketModalSeen] = useState(true); // default true avoids flash

  useEffect(() => {
    try {
      const saved = localStorage.getItem('b2b_currency');
      if (saved && CURRENCIES[saved]) setCurrencyState(saved);

      const seen = localStorage.getItem('b2b_market_seen');
      setMarketModalSeen(!!seen);
    } catch { /* ignore */ }
  }, []);

  const setCurrency = useCallback((code: string) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    try { localStorage.setItem('b2b_currency', code); } catch { /* ignore */ }
  }, []);

  const dismissMarketModal = useCallback(() => {
    setMarketModalSeen(true);
    try { localStorage.setItem('b2b_market_seen', '1'); } catch { /* ignore */ }
  }, []);

  const config = CURRENCIES[currency] ?? CURRENCIES[DEFAULT_CURRENCY];

  const value: CurrencyContextValue = {
    currency,
    config,
    setCurrency,
    convertPrice: (amt: number) => convertPrice(amt, currency),
    formatPrice: (amt: number) => _formatPrice(amt, currency),
    formatPriceWithVAT: (amt: number) => _formatPriceWithVAT(amt, currency),
    marketModalSeen,
    dismissMarketModal,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
