import { NextResponse } from 'next/server';
import { EXCHANGE_RATES, CURRENCIES } from '@/lib/currencies';

// Future-ready endpoint — currently returns static rates.
// Replace with live rates by fetching from an FX provider here.
export async function GET() {
  return NextResponse.json({
    base: 'KWD',
    updated_at: new Date().toISOString(),
    rates: EXCHANGE_RATES,
    currencies: Object.fromEntries(
      Object.entries(CURRENCIES).map(([code, cfg]) => [
        code,
        { symbol: cfg.symbol, name: cfg.name, decimals: cfg.decimals, vat_rate: cfg.vatRate },
      ])
    ),
  });
}
