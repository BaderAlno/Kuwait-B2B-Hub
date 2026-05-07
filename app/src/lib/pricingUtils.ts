export interface BulkTier { min_qty: number; max_qty: number | null; price: number; }

export function formatTierRange(tier: BulkTier, locale: 'en' | 'ar' = 'en'): string {
  if (!tier.max_qty) {
    return locale === 'ar' ? `${tier.min_qty}+ وحدة` : `${tier.min_qty}+ units`;
  }
  return locale === 'ar'
    ? `${tier.min_qty}–${tier.max_qty} وحدة`
    : `${tier.min_qty}–${tier.max_qty} units`;
}

export function calcSavingsPct(basePrice: number, tierPrice: number): number {
  if (basePrice <= 0) return 0;
  return Math.round(((basePrice - tierPrice) / basePrice) * 100);
}

export function sortTiers(tiers: BulkTier[]): BulkTier[] {
  return [...tiers].sort((a, b) => a.min_qty - b.min_qty);
}
