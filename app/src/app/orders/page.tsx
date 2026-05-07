'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Package, ChevronRight, RefreshCw, Store } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';
import { formatOrderId } from '@/lib/formatters';

interface Order {
  id: string; status: string; total_amount: number; created_at: string;
  brand?: { brand_name: string; logo_url: string };
  items: { quantity: number; product?: { name: string } }[];
}

const STATUS_ORDER = ['pending', 'approved', 'rejected', 'completed'];

export default function BuyerOrdersPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data.orders || []);
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const { formatPrice } = useCurrency();

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const counts: Record<string, number> = { all: orders.length };
  STATUS_ORDER.forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });

  return (
    <div className="page-root">
      <Navbar />
      <div className="main-content">
        {/* Page header */}
        <div className="page-header" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
          <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <h1>{t('title')}</h1>
            <p>{t('subtitle', { count: orders.length })}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <Link href="/marketplace" className="btn btn-primary btn-sm" style={{ gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <Store size={16} /> {t('newOrder')}
            </Link>
            <button onClick={handleRefresh} className="btn btn-ghost btn-sm" disabled={refreshing} style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.65s linear infinite' : 'none' }} />
              {tCommon('retry')}
            </button>
          </div>
        </div>

        <div className="container-lg" style={{ padding: '0 32px 60px' }}>
          {/* Filter tabs — scrollable on mobile */}
          <div style={{ padding: '16px 0 20px', overflowX: 'auto', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="filter-tabs" style={{ minWidth: 'max-content', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              {[
                ['all', tCommon('all')],
                ['pending', tCommon('pending')],
                ['approved', tCommon('approved')],
                ['completed', tCommon('completed')],
                ['rejected', tCommon('rejected')]
              ].map(([val, label]) => (
                <button
                  key={val}
                  className={`filter-tab${filter === val ? ' active' : ''}`}
                  onClick={() => setFilter(val)}
                  style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}
                >
                  {t(`filters.${val}`)}
                  {counts[val] > 0 && (
                    <span style={{
                      [locale === 'ar' ? 'marginRight' : 'marginLeft']: 5, fontSize: 11, fontWeight: 700, minWidth: 18, height: 18,
                      background: filter === val ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                      color: filter === val ? 'white' : 'var(--text-muted)',
                      borderRadius: 20, padding: '0 5px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {counts[val]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={28} /></div>
                <h3>{t('empty.title')}</h3>
                <p>{t('empty.subtitle')}</p>
                <Link href="/marketplace" className="btn btn-primary btn-sm">{t('empty.cta')}</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(order => (
                <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                  {/* ── MOBILE ORDER CARD ── */}
                  <div className="order-card-mobile mobile-only">
                    <div className="order-card-mobile-top">
                      <div className="order-card-mobile-avatar">
                        {order.brand?.logo_url
                          ? <img src={order.brand.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                          : <div style={{ width: '100%', height: '100%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{order.brand?.brand_name?.charAt(0)}</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="order-card-mobile-brand">{order.brand?.brand_name}</div>
                        <div className="order-card-mobile-id">{t('orderNumber', { id: formatOrderId(order.id).replace('#', '') })}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {t('itemsCount', { count: order.items?.length })} · {order.items?.slice(0, 2).map(i => i.product?.name).filter(Boolean).join(', ')}{order.items?.length > 2 ? '…' : ''}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} />
                    </div>
                    <div className="order-card-mobile-bottom">
                      <span className="order-card-mobile-date">
                        {formatDate(order.created_at, locale as any)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <StatusBadge status={order.status} />
                        <span className="order-card-mobile-amount">{formatPrice(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── DESKTOP ORDER ROW ── */}
                  <div className="card desktop-only" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
                      {order.brand?.logo_url
                        ? <img src={order.brand.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : <div style={{ width: '100%', height: '100%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{order.brand?.brand_name?.charAt(0)}</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{order.brand?.brand_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {t('orderNumber', { id: formatOrderId(order.id).replace('#', '') })} · {formatDate(order.created_at, locale as any)} · {t('itemsCount', { count: order.items?.length })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <StatusBadge status={order.status} />
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{formatPrice(order.total_amount)}</span>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
