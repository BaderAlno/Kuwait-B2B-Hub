'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { formatAdminPrice } from '@/lib/currencies';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';
import { formatOrderId } from '@/lib/formatters';
import { LayoutDashboard, Tags, Users, Package, Search } from 'lucide-react';

interface Order {
  id: string; status: string; total_amount: number; created_at: string;
  buyer?: { name: string; company_name: string };
  brand?: { brand_name: string };
  items: { quantity: number }[];
}

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders').then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); });
  }, []);


  const filtered = orders.filter(o =>
    (filter === 'all' || o.status === filter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) ||
     o.brand?.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
     o.buyer?.company_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <aside className="dash-sidebar desktop-only">
          <span className="dash-sidebar-label">{t('sidebar.panel')}</span>
          <Link href="/admin/dashboard" className="sidebar-link"><LayoutDashboard size={16}/> {t('sidebar.dashboard')}</Link>
          <Link href="/admin/brands"    className="sidebar-link"><Tags size={16}/> {t('sidebar.brands')}</Link>
          <Link href="/admin/users"     className="sidebar-link"><Users size={16}/> {t('sidebar.users')}</Link>
          <Link href="/admin/orders"    className="sidebar-link active"><Package size={16}/> {t('sidebar.orders')}</Link>
        </aside>

        <main className="dash-main fade-up">
          <div className="page-header" style={{ marginBottom: 20, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <h1>{locale === 'ar' ? 'سجل الطلبات' : 'Order History'}</h1>
              <p>{locale === 'ar' ? `مراقبة ${orders.length} معاملة عبر الشبكة` : `Monitoring ${orders.length} transactions across the network`}</p>
            </div>
          </div>

          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
              <div className="filter-tabs" style={{ minWidth: 'max-content', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                {[['all', locale === 'ar' ? 'جميع الطلبات' : 'All Orders'], ['pending', tCommon('pending')], ['approved', tCommon('approved')], ['rejected', tCommon('rejected')]].map(([val, label]) => (
                  <button key={val} className={`filter-tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
                    {label}
                    <span style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 6, fontSize: 11, opacity: 0.7 }}>({val === 'all' ? orders.length : orders.filter(o => o.status === val).length})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="search-bar" style={{ width: '100%', maxWidth: '100%', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <Search size={16}/>
              <input placeholder={locale === 'ar' ? 'ابحث برقم الطلب أو العلامة أو الشركة...' : 'Search Order ID, Brand, or Company…'} value={search} onChange={e => setSearch(e.target.value)} style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}/>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={28}/></div>
                <h3>{locale === 'ar' ? 'لا توجد طلبات' : 'No Orders Found'}</h3>
                <p>{locale === 'ar' ? 'جرّب تعديل معايير البحث.' : 'Try adjusting your search criteria.'}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card List */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(order => (
                  <div key={order.id} className="card fade-up" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div title={order.id} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4, minWidth: 120 }}>
                          {formatOrderId(order.id)}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{formatAdminPrice(order.total_amount)}</div>
                      </div>
                      <StatusBadge status={order.status}/>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 0', borderTop: '1px solid var(--bg-page)', borderBottom: '1px solid var(--bg-page)', marginBottom: 14 }}>
                      <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>{locale === 'ar' ? 'العلامة' : 'Brand'}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{order.brand?.brand_name}</div>
                      </div>
                      <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>{locale === 'ar' ? 'المشتري' : 'Buyer'}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{order.buyer?.company_name}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                       <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(order.created_at, locale as any)} · {order.items?.length} {locale === 'ar' ? 'عناصر' : 'items'}</span>
                       <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', height: 28, fontSize: 11 }}>{locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="desktop-only" style={{ overflowX: 'auto', borderRadius: 8 }}>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left', minWidth: 130, whiteSpace: 'nowrap' }}>{locale === 'ar' ? 'رقم المرجع' : 'Ref ID'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'العلامة' : 'Merchant'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'المشتري' : 'Buyer Client'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'العناصر' : 'Scale'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'الحالة' : 'State'}</th>
                      <th className="text-right">{locale === 'ar' ? 'تاريخ المعاملة' : 'Transaction Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order.id}>
                        <td title={order.id} style={{ minWidth: 130, whiteSpace: 'nowrap' }}>
                          <code style={{ fontSize: 13, background: 'var(--bg-subtle)', padding: '3px 7px', borderRadius: 6, fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>
                            {formatOrderId(order.id)}
                          </code>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)', textAlign: locale === 'ar' ? 'right' : 'left' }}>{order.brand?.brand_name}</td>
                        <td style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 600 }}>{order.buyer?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.buyer?.company_name}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500, textAlign: locale === 'ar' ? 'right' : 'left' }}>{order.items?.length} {locale === 'ar' ? 'عناصر' : 'items'}</td>
                        <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>{formatAdminPrice(order.total_amount)}</td>
                        <td><StatusBadge status={order.status}/></td>
                        <td className="text-right" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(order.created_at, locale as any)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
