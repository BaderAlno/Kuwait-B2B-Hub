'use client';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import MarketModal from '@/components/MarketModal';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <MarketModal />
      {children}
    </CurrencyProvider>
  );
}
