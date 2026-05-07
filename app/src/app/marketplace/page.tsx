'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BrandAvatar from '@/components/BrandAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import TrustScore from '@/components/TrustScore';
import { StarDisplay } from '@/components/StarRating';
import { useTranslations, useLocale } from 'next-intl';
import { useCurrency } from '@/contexts/CurrencyContext';
import BrandCard from '@/components/BrandCard';
import { Search, SlidersHorizontal, ChevronRight, Plus, RefreshCw } from 'lucide-react';

interface Brand {
  id: string; brand_name: string; description: string;
  logo_url: string; owner_name: string; product_count: number;
  verification_tier?: string;
  avg_rating?: number; total_reviews?: number;
  trust?: {
    response_rate?: number; total_fulfilled?: number;
    badges?: string[]; member_since?: string;
  };
}

export default function MarketplacePage() {
  const t = useTranslations('marketplace');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const { config: currencyConfig } = useCurrency();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrands = useCallback(async (q = '') => {
    const brandsRes = await fetch(`/api/brands${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    const brandsData = await brandsRes.json();
    const rawBrands: Brand[] = brandsData.brands || [];

    const enriched = await Promise.all(rawBrands.map(async brand => {
      try {
        const [trustRes, reviewRes] = await Promise.all([
          fetch(`/api/trust/${brand.id}`),
          fetch(`/api/reviews?brand_id=${brand.id}`),
        ]);
        const [trustData, reviewData] = await Promise.all([trustRes.json(), reviewRes.json()]);
        return { ...brand, trust: trustData, avg_rating: reviewData.avg_rating, total_reviews: reviewData.total_reviews };
      } catch { return brand; }
    }));
    return enriched;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBrands().then(b => { setBrands(b); setLoading(false); });
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    const timer = setTimeout(() => {
      setLoading(true);
      fetchBrands(val).then(b => { setBrands(b); setLoading(false); });
    }, 350);
    return () => clearTimeout(timer);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const b = await fetchBrands(search);
    setBrands(b);
    setRefreshing(false);
  };

  // Product count display — "0" → coming-soon label
  function productCountLabel(count: number): string {
    if (count === 0) return isRTL ? 'جاري إعداد الكتالوج' : 'Catalog coming soon';
    if (isRTL) return `${count} منتج`;
    return `${count} product${count !== 1 ? 's' : ''}`;
  }

  return (
    <div className="page-root">
      <Navbar />
      <div className="main-content">
        {/* ── HERO ──────────────────────────────────────────────── */}
        <div
          className="marketplace-hero"
          dir={isRTL ? 'rtl' : 'ltr'}
          style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', padding: '40px 32px 32px' }}
        >
          <div className="container-lg">
            <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>
                  ⭐ {t('hero.badge')}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {currencyConfig.flag} {tCommon('currency.pricesIn', { symbol: currencyConfig.symbol })}
                </div>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: isRTL ? 28 : 36,
                fontWeight: isRTL ? 700 : 800,
                color: 'var(--text-primary)',
                lineHeight: isRTL ? 1.45 : 1.15,
                marginBottom: 12,
                letterSpacing: isRTL ? 0 : -0.5,
                wordBreak: 'break-word',
              }}>
                {t('hero.title')}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 28px' }}>
                {t('hero.subtitle')}
              </p>
              <div className="search-bar marketplace-search-bar" style={{ maxWidth: 560, margin: '0 auto', height: 50 }}>
                <Search size={17} />
                <input id="brand-search" placeholder={t('hero.searchPlaceholder')}
                  value={search} onChange={e => handleSearch(e.target.value)} style={{ fontSize: 15 }} />
                <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>{t('hero.searchButton')}</button>
              </div>
            </div>

            {/* Stats bar — desktop only */}
            <div className="marketplace-stats" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border)', padding: '14px 0', maxWidth: 720, margin: '0 auto' }}>
              {[
                [brands.length.toString(), t('stats.activeBrands')],
                [String(brands.reduce((s, b) => s + (b.product_count || 0), 0)), t('stats.productsListed')],
                ['100%', t('stats.verified')],
                ['24h', t('stats.fastProcessing')],
              ].map(([val, label], i) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none', padding: '0 20px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE FILTER CHIPS ─────────────────────────────────── */}
        <div className="filter-chips-row" style={{ padding: '12px 16px 4px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', direction: isRTL ? 'rtl' : 'ltr' }}>
          {[
            { label: `✦ ${t('filters.all')}`, value: '' },
            { label: `👒 ${t('filters.fashion')}`, value: 'fashion' },
            { label: `📱 ${t('filters.electronics')}`, value: 'electronics' },
            { label: `🍱 ${t('filters.food')}`, value: 'food' },
            { label: `💄 ${t('filters.beauty')}`, value: 'beauty' },
            { label: `🏠 ${t('filters.home')}`, value: 'home' },
            { label: `⚽ ${t('filters.sports')}`, value: 'sports' },
          ].map(chip => (
            <button
              key={chip.value}
              className={`filter-chip${activeChip === chip.value ? ' active' : ''}`}
              onClick={() => setActiveChip(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────── */}
        <div className="container-lg" style={{ padding: '32px 32px 60px' }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            {/* ── DESKTOP FILTER SIDEBAR ─────────────────────────── */}
            <div className="filter-sidebar" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <SlidersHorizontal size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{tCommon('filter')}</span>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">{t('filters.all')}</div>
                {[
                  t('filters.fashion'), t('filters.electronics'), t('filters.food'),
                  t('filters.beauty'), t('filters.home'), t('filters.sports')
                ].map(cat => (
                  <label key={cat} className="filter-option" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <input type="checkbox" /> <span className="filter-option-label" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 8 }}>{cat}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <div className="filter-section-title">{tCommon('confirm')}</div>
                {['Premium Verified', 'Verified Business', 'New Supplier'].map(opt => (
                  <label key={opt} className="filter-option" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <input type="checkbox" /> <span className="filter-option-label" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 8 }}>{t(`brandCard.${opt === 'Premium Verified' ? 'premiumVerified' : opt === 'Verified Business' ? 'verifiedBusiness' : 'newSupplier'}`)}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <div className="filter-section-title">{t('moq.title')}</div>
                {Object.entries(t.raw('moq.ranges')).map(([key, label]) => (
                  <label key={key} className="filter-option" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <input type="radio" name="moq" /> <span className="filter-option-label" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 8 }}>{label as string}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <div className="filter-section-title">{t('sort.title')}</div>
                {Object.entries(t.raw('sort.options')).map(([key, label]) => (
                  <label key={key} className="filter-option" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <input type="radio" name="sort" defaultChecked={key === 'recent'} /> <span className="filter-option-label" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 8 }}>{label as string}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── BRAND RESULTS ───────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {loading ? tCommon('loading') : t('results.found', { count: brands.length })}
                </p>
                <button onClick={handleRefresh} className="btn btn-ghost btn-sm" style={{ gap: 5 }} disabled={refreshing}>
                  <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.65s linear infinite' : 'none' }} />
                  {tCommon('retry')}
                </button>
              </div>

              {loading ? (
                <>
                  <div className="grid-3 brand-grid-desktop">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220 }} />)}
                  </div>
                  <div className="brand-list-mobile" style={{ display: 'none' }}>
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 0 }} />)}
                  </div>
                </>
              ) : brands.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon"><Search size={28} /></div>
                    <h3>{t('results.noResults')}</h3>
                    <p>{t('results.noResultsHint')}</p>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); fetchBrands('').then(b => setBrands(b)); }}>{tCommon('retry')}</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── DESKTOP: 3-col card grid ── */}
                  <div className="grid-3 brand-grid-desktop fade-up">
                    {brands.map(brand => (
                      <BrandCard key={brand.id} brand={brand} variant="desktop" />
                    ))}
                  </div>

                  {/* ── MOBILE: compact list ── */}
                  <div className="brand-list-mobile" style={{ display: 'none', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {brands.map((brand, idx) => (
                      <div
                        key={brand.id}
                        style={{ borderBottom: idx < brands.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <BrandCard brand={brand} variant="mobile" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── MOBILE FAB ─────────────────────────────────────────── */}
        <Link href="/marketplace" className="mobile-fab" aria-label="Browse brands">
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
