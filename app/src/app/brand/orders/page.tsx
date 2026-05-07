'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { useCurrency } from '@/contexts/CurrencyContext';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Package, Check, X, ChevronRight } from 'lucide-react';
import BrandSidebar from '@/components/BrandSidebar';
import { formatOrderId } from '@/lib/formatters';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';

interface Order {
  id: string; status: string; total_amount: number; created_at: string;
  buyer?: { name: string; company_name: string; whatsapp_number?: string };
  items: { product?: { name: string }; quantity: number; unit_price: number }[];
}

export default function BrandOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const t = useTranslations('brandOrders');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status);
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchOrders();
    setActionLoading(null);
  };

  const { formatPrice } = useCurrency();
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <BrandSidebar pendingCount={orders.filter(o => o.status === 'pending').length} />

        <main className="dash-main fade-up">
          <div className="page-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <div>
              <h1>{t('title')}</h1>
              <p>{t('totalRequests', { count: orders.length })}</p>
            </div>
          </div>

          <div style={{ marginBottom: 20, overflowX: 'auto', margin: '0 -16px 20px', padding: '0 16px', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="filter-tabs" style={{ minWidth: 'max-content' }}>
              {[['all', tCommon('all')], ['pending', tCommon('pending')], ['approved', tCommon('approved')], ['completed', tCommon('completed')], ['rejected', tCommon('rejected')]].map(([val, label]) => (
                <button 
                  key={val} 
                  className={`filter-tab ${filter === val ? 'active' : ''}`} 
                  onClick={() => setFilter(val)}
                >
                  {label}
                  <span style={{ 
                    [locale === 'ar' ? 'marginRight' : 'marginLeft']: 6, fontSize: 11, fontWeight: 700, opacity: 0.8,
                    background: filter === val ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                    padding: '1px 6px', borderRadius: 10, minWidth: 20, display: 'inline-block', textAlign: 'center'
                  }}>
                    {val === 'all' ? orders.length : orders.filter(o => o.status === val).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={28}/></div>
                <h3>{t('empty.title')}</h3>
                <p>{t('empty.subtitle')}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(order => (
                <div key={order.id} className="card fade-up" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-white)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                         <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--navy)', fontSize: 18, flexShrink: 0, border: '1px solid var(--border)' }}>
                          {order.buyer?.company_name?.charAt(0) || order.buyer?.name?.charAt(0)}
                        </div>
                        <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 750, fontSize: 15, color: 'var(--text-primary)' }}>{order.buyer?.company_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('card.buyerId', { name: String(order.buyer?.name || ''), id: formatOrderId(order.id).replace('#', '') })}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>{formatPrice(order.total_amount)}</div>
                        <StatusBadge status={order.status}/>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-page)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                      {order.items?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', padding: '2px 0', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%', textAlign: locale === 'ar' ? 'right' : 'left' }}>{item.product?.name}</span>
                          <span style={{ fontWeight: 600 }}>{item.quantity} × {formatPrice(item.unit_price)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <span>📅 {formatDate(order.created_at, locale as 'en' | 'ar')}</span>
                      <span>{t('card.itemsTotal', { count: order.items?.length })}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 1, background: 'var(--border)' }}>
                    {order.status === 'pending' ? (
                      <>
                         <button className="btn btn-success" style={{ flex: 1, borderRadius: 0, height: 50, background: 'var(--success)', color: 'white', border: 'none', fontWeight: 700 }}
                          disabled={actionLoading === order.id+'approved'}
                          onClick={() => handleAction(order.id, 'approved')}>
                          {actionLoading === order.id+'approved' ? <span className="spinner"/> : <><Check size={16} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/> {t('actions.approve')}</>}
                        </button>
                        <button className="btn btn-ghost" style={{ flex: 1, borderRadius: 0, height: 50, background: 'var(--bg-white)', color: 'var(--danger)', border: 'none', fontWeight: 700 }}
                          disabled={actionLoading === order.id+'rejected'}
                          onClick={() => handleAction(order.id, 'rejected')}>
                          {actionLoading === order.id+'rejected' ? <span className="spinner"/> : <><X size={16} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/> {t('actions.reject')}</>}
                        </button>
                        {order.buyer?.whatsapp_number && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-white)', padding: '0 12px' }}>
                            <WhatsAppButton
                              phoneNumber={order.buyer.whatsapp_number}
                              message={`Hi ${order.buyer.name}! I've received your order request ${formatOrderId(order.id)} on Kuwait B2B Hub and I'm reviewing it now.`}
                              label="Reply"
                              size="sm"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={`/brand/orders/${order.id}`} className="btn btn-ghost" style={{ flex: 1, borderRadius: 0, height: 50, background: 'var(--bg-white)', color: 'var(--text-primary)', border: 'none', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t('actions.viewFullDetails')} <ChevronRight size={16} style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 6, transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }}/>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
