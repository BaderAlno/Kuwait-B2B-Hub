'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  ShoppingBag, Package,
  Check, X, ArrowRight, TrendingUp, TrendingDown,
  DollarSign, Clock, Plus, Zap,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';
import BrandSidebar from '@/components/BrandSidebar';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Order {
  id: string; status: string; total_amount: number; created_at: string;
  buyer?: { name: string; company_name: string };
  items: { product?: { name: string }; quantity: number; unit_price: number }[];
}
interface Product {
  id: string; name: string; price: number; moq: number; stock: number;
}

// ─── Chart.js CDN loader ──────────────────────────────────────────────────────
async function ensureChartJS(): Promise<void> {
  if (typeof window === 'undefined') return;
  if ((window as any).Chart) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
  });
}

function getTrend(cur: number, prev: number) {
  if (prev === 0 && cur === 0) return { pct: 0, up: true, neutral: true };
  if (prev === 0) return { pct: 100, up: true, neutral: false };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0, neutral: false };
}

const SAMPLE_REVENUE = [1200, 2100, 1800, 3400, 2800, 4200];

function buildRevenueData(orders: Order[], months: ReturnType<typeof getLast6Months>) {
  const approved = orders.filter(o => o.status === 'approved' || o.status === 'completed');
  const amounts = months.map(m =>
    approved.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).reduce((s, o) => s + o.total_amount, 0)
  );
  const empty = amounts.every(a => a === 0);
  return {
    labels: months.map(m => m.label),
    amounts: empty ? SAMPLE_REVENUE : amounts,
    isSample: empty,
  };
}

function buildProductMetrics(products: Product[], orders: Order[]) {
  return products.slice(0, 5).map(p => {
    const prodOrders = orders.filter(o =>
      o.items?.some(i => i.product?.name === p.name)
    );
    const revenue = prodOrders
      .filter(o => o.status === 'approved' || o.status === 'completed')
      .reduce((s, o) => {
        const matched = o.items?.find(i => i.product?.name === p.name);
        return s + (matched ? matched.quantity * matched.unit_price : 0);
      }, 0);
    const status = p.stock === 0 ? 'out' : p.stock < 20 ? 'low' : 'active';
    return { ...p, orderCount: prodOrders.length, revenue, status };
  });
}


// ─── Component ────────────────────────────────────────────────────────────────
export default function BrandDashboard() {
  const t = useTranslations('brandDashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [orders, setOrders]   = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { formatPrice, currency } = useCurrency();
  const revenueRef  = useRef<HTMLCanvasElement>(null);
  const revenueInst = useRef<any>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    const [oRes, pRes] = await Promise.all([fetch('/api/orders'), fetch('/api/products')]);
    const [oData, pData] = await Promise.all([oRes.json(), pRes.json()]);
    setOrders(oData.orders || []);
    setProducts(pData.products || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── Chart ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const init = async () => {
      await ensureChartJS();
      const Chart = (window as any).Chart;

      if (revenueInst.current) { revenueInst.current.destroy(); revenueInst.current = null; }

      const months = getLast6Months();
      const revData = buildRevenueData(orders, months);

      if (revenueRef.current) {
        revenueInst.current = new Chart(revenueRef.current, {
          type: 'line',
          data: {
            labels: revData.labels,
            datasets: [{
              data: revData.amounts,
              borderColor: '#16A34A',
              backgroundColor: 'rgba(22,163,74,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: '#16A34A',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#fff',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                titleColor: '#111827',
                bodyColor: '#6B7280',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  title: (items: any[]) => revData.labels[items[0].dataIndex],
                  label: (item: any) => ` ${formatPrice(item.raw)}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9CA3AF' }, border: { display: false } },
              y: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: {
                  font: { size: 11 },
                  color: '#9CA3AF',
                  callback: (v: any) => formatPrice(Number(v)),
                },
                border: { display: false },
                beginAtZero: true,
              },
            },
          },
        });
      }
    };

    init().catch(console.error);
    return () => { if (revenueInst.current) { revenueInst.current.destroy(); revenueInst.current = null; } };
  }, [loading, orders, currency]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleOrderAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status);
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchData();
    setActionLoading(null);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const pending      = orders.filter(o => o.status === 'pending');
  const approved     = orders.filter(o => o.status === 'approved' || o.status === 'completed');
  const revenue      = approved.reduce((s, o) => s + o.total_amount, 0);
  const activeProds  = products.filter(p => p.stock > 0);
  const now          = new Date();
  const weekAgo      = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek  = orders.filter(o => new Date(o.created_at) >= weekAgo).length;

  const months    = getLast6Months();
  const curM      = months[5];
  const prevM     = months[4];
  const curRev    = approved.filter(o => {
    const d = new Date(o.created_at);
    return d.getFullYear() === curM.year && d.getMonth() === curM.month;
  }).reduce((s, o) => s + o.total_amount, 0);
  const prevRev   = approved.filter(o => {
    const d = new Date(o.created_at);
    return d.getFullYear() === prevM.year && d.getMonth() === prevM.month;
  }).reduce((s, o) => s + o.total_amount, 0);
  const revTrend  = getTrend(curRev, prevRev);

  const productMetrics = buildProductMetrics(products, orders);

  // ── Trend Badge ────────────────────────────────────────────────────────────
  const TrendBadge = ({ trend }: { trend: ReturnType<typeof getTrend> }) => {
    if (trend.neutral) return null;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: trend.up ? '#16A34A' : '#DC2626', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
        {trend.up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
        {trend.pct}%
        <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>&nbsp;{t('trend.vsLastMonth')}</span>
      </span>
    );
  };

  // ── Section header ─────────────────────────────────────────────────────────
  const SectionLabel = ({ label, title }: { label: string; title: string }) => (
    <div style={{ marginBottom: 14, textAlign: locale === 'ar' ? 'right' : 'left' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9CA3AF', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', fontFamily: 'var(--font-display)' }}>{title}</div>
    </div>
  );

  const statusBadge = (status: 'active' | 'low' | 'out') => {
    const map = {
      active: { bg: 'var(--approved-bg)',  color: 'var(--success)',  label: t('products.status.active')      },
      low:    { bg: 'var(--pending-bg)',   color: 'var(--warning)',  label: t('products.status.lowStock')    },
      out:    { bg: 'var(--rejected-bg)',  color: 'var(--danger)',   label: t('products.status.outOfStock')  },
    };
    const s = map[status];
    return (
      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <BrandSidebar pendingCount={pending.length} productCount={products.length} />
        <main className="dash-main fade-up">

          {/* ── Page Header ── */}
          <div className="page-header" style={{ direction: locale === 'ar' ? 'rtl' : 'ltr', textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div>
            <Link href="/brand/products/new" className="btn btn-primary" style={{ gap: 8 }}><ShoppingBag size={15}/> {t('products.addFirst')}</Link>
          </div>

          {/* ── Metric Cards ── */}
          <div className="grid-4 mb-24">
            {loading ? [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 96 }}/>) : (
              <>
                {/* Total Revenue */}
                <div className="stat-card" style={{ textAlign: locale === 'ar' ? 'right' : 'left', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className={`stat-icon-wrap icon-green ${locale === 'ar' ? 'ml-12' : ''}`}><DollarSign size={20}/></div>
                  <div style={{ flex: 1 }}>
                    <div className="stat-value" style={{ fontSize: 18 }}>
                      {formatPrice(revenue)}
                    </div>
                    <div className="stat-label">{t('metrics.totalRevenue')}</div>
                    <TrendBadge trend={revTrend}/>
                  </div>
                </div>
                {/* Incoming Orders */}
                <div className="stat-card" style={{ textAlign: locale === 'ar' ? 'right' : 'left', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className={`stat-icon-wrap icon-amber ${locale === 'ar' ? 'ml-12' : ''}`}><Clock size={20}/></div>
                  <div style={{ flex: 1 }}>
                    <div className="stat-value" style={{ fontSize: 20 }}>{pending.length}</div>
                    <div className="stat-label">{t('metrics.incomingOrders')}</div>
                    {newThisWeek > 0 && (
                      <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700, display: 'block' }}>{t('metrics.newThisWeek', { count: newThisWeek })}</span>
                    )}
                  </div>
                </div>
                {/* Products Listed */}
                <div className="stat-card" style={{ textAlign: locale === 'ar' ? 'right' : 'left', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className={`stat-icon-wrap icon-navy ${locale === 'ar' ? 'ml-12' : ''}`}><ShoppingBag size={20}/></div>
                  <div style={{ flex: 1 }}>
                    <div className="stat-value" style={{ fontSize: 20 }}>{products.length}</div>
                    <div className="stat-label">{t('metrics.productsListed')}</div>
                    <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, display: 'block' }}>{activeProds.length} {t('metrics.active')}</span>
                  </div>
                </div>
                {/* Avg Response Time */}
                <div className="stat-card" style={{ textAlign: locale === 'ar' ? 'right' : 'left', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className={`stat-icon-wrap icon-blue ${locale === 'ar' ? 'ml-12' : ''}`}><Zap size={20}/></div>
                  <div style={{ flex: 1 }}>
                    <div className="stat-value" style={{ fontSize: 20 }}>4 hrs</div>
                    <div className="stat-label">{t('metrics.avgResponseTime')}</div>
                    <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, display: 'block' }}>{t('metrics.fastResponder')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Mobile Quick Actions ── */}
          <div className="mobile-only grid-2 mb-24" style={{ gap: 10, direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
            <Link href="/brand/products/new" className="btn btn-primary" style={{ height: 52, fontSize: 14, gap: 6 }}>
              <Plus size={16}/> {t('products.empty.addFirst')}
            </Link>
            <Link href="/brand/orders" className="btn btn-ghost" style={{ height: 52, fontSize: 14, gap: 6 }}>
              <Package size={16}/> {t('orders.title')}
            </Link>
          </div>

          {/* ── Revenue Chart ── */}
          <div className="card mb-24" style={{ padding: 20 }}>
            <SectionLabel label={t('analytics.title')} title={t('analytics.orderActivity')}/>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textAlign: locale === 'ar' ? 'right' : 'left' }}>
              {t('analytics.ordersPerMonth')}
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 220 }}/>
            ) : (
              <div style={{ position: 'relative', height: 220 }}>
                <canvas ref={revenueRef}/>
              </div>
            )}
          </div>

          {/* ── Orders + Products ── */}
          <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
            {/* Pending Orders */}
            <div className="card">
              <div className="card-header" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <h2 style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('orders.title')}</h2>
                <Link href="/brand/orders" className="btn btn-ghost btn-sm desktop-only" style={{ gap: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  {t('orders.viewAll')} {locale === 'ar' ? <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }}/> : <ArrowRight size={14}/>}
                </Link>
              </div>
              {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, margin: 16 }}/>) :
               pending.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 0' }}>
                  <div className="empty-state-icon"><Package size={24}/></div>
                  <h3>{t('orders.empty.title')}</h3>
                  <p>{t('orders.empty.subtitle')}</p>
                </div>
              ) : (
                <div style={{ padding: '0 20px' }}>
                  {pending.slice(0, 3).map(order => (
                    <div key={order.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-12" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{order.buyer?.company_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{order.buyer?.name} · {formatDate(order.created_at, locale as any)}</div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{formatPrice(order.total_amount)}</div>
                      </div>
                      <div className="flex gap-8" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <button className="btn btn-success btn-sm" style={{ flex: 1, height: 40 }}
                          disabled={actionLoading === order.id+'approved'}
                          onClick={() => handleOrderAction(order.id, 'approved')}>
                          {actionLoading === order.id+'approved' ? <span className="spinner"/> : <><Check size={14}/> {tCommon('confirm')}</>}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, height: 40 }}
                          disabled={actionLoading === order.id+'rejected'}
                          onClick={() => handleOrderAction(order.id, 'rejected')}>
                          {actionLoading === order.id+'rejected' ? <span className="spinner"/> : <><X size={14}/> {tCommon('cancel')}</>}
                        </button>
                        <Link href={`/brand/orders/${order.id}`} className="btn btn-ghost btn-sm" style={{ padding: '0 12px' }}>
                          {locale === 'ar' ? <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }}/> : <ArrowRight size={14}/>}
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Link href="/brand/orders" className="mobile-only btn btn-ghost btn-full mt-12" style={{ height: 44 }}>
                    {t('orders.viewAll')}
                  </Link>
                </div>
              )}
            </div>

            {/* Products Performance Table */}
            <div className="card" style={{ padding: 0 }}>
              <div className="card-header" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <h2 style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('products.title')}</h2>
                <Link href="/brand/products" className="btn btn-ghost btn-sm desktop-only" style={{ gap: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  {t('products.viewAll')} {locale === 'ar' ? <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }}/> : <ArrowRight size={14}/>}
                </Link>
              </div>
              {loading ? <div className="skeleton" style={{ height: 200, margin: 16 }}/> :
               products.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 0' }}>
                  <div className="empty-state-icon"><ShoppingBag size={24}/></div>
                  <h3>{t('products.empty.title')}</h3>
                  <Link href="/brand/products/new" className="btn btn-primary btn-sm">{t('products.empty.addFirst')}</Link>
                </div>
              ) : (
                <>
                  <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('products.table.product')}</th>
                          <th className="desktop-only" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('products.table.orders')}</th>
                          <th className="desktop-only" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('products.table.revenue')}</th>
                          <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('products.table.stock')}</th>
                          <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('products.table.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productMetrics.map(p => (
                          <tr key={p.id}>
                            <td style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                              <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatPrice(p.price)}</div>
                            </td>
                            <td className="desktop-only" style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 13, textAlign: locale === 'ar' ? 'right' : 'left' }}>{p.orderCount}</td>
                            <td className="desktop-only" style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                              {p.revenue > 0 ? formatPrice(p.revenue) : '—'}
                            </td>
                            <td style={{ fontSize: 12, fontWeight: 600, textAlign: locale === 'ar' ? 'right' : 'left' }}>{p.stock}</td>
                            <td style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{statusBadge(p.status as any)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <Link href="/brand/products" style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      {t('products.viewAll')} {locale === 'ar' ? <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }}/> : <ArrowRight size={13}/>}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
