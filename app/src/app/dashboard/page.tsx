'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import ReviewModal from '@/components/ReviewModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Package, Clock, CheckCircle, TrendingUp, TrendingDown,
  Store, ChevronRight, ArrowUpRight, BarChart2, PieChart,
  Star,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getGreeting, formatDate } from '@/lib/i18n';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Order {
  id: string; status: string; total_amount: number; created_at: string;
  brand_id: string;
  brand?: { brand_name: string; logo_url: string };
  items: { quantity: number }[];
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

function ordersInMonth(orders: Order[], year: number, month: number) {
  return orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function getTrend(cur: number, prev: number) {
  if (prev === 0 && cur === 0) return { pct: 0, up: true, neutral: true };
  if (prev === 0) return { pct: 100, up: true, neutral: false };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0, neutral: false };
}

const SAMPLE_COUNTS  = [3, 5, 4, 7, 5, 8];
const SAMPLE_AMOUNTS = [2800, 4200, 3600, 5900, 4500, 6800];
const PALETTE = ['#2563EB', '#16A34A', '#D97706', '#7C3AED', '#0EA5E9'];

function buildAreaData(orders: Order[], months: ReturnType<typeof getLast6Months>) {
  const counts  = months.map(m => ordersInMonth(orders, m.year, m.month).length);
  const amounts = months.map(m => ordersInMonth(orders, m.year, m.month).reduce((s, o) => s + o.total_amount, 0));
  const empty   = counts.every(c => c === 0);
  return {
    labels:  months.map(m => m.label),
    counts:  empty ? SAMPLE_COUNTS  : counts,
    amounts: empty ? SAMPLE_AMOUNTS : amounts,
    isSample: empty,
  };
}

function buildSpendingByBrand(orders: Order[]) {
  const approved = orders.filter(o => o.status === 'approved' || o.status === 'completed');
  const map: Record<string, number> = {};
  approved.forEach(o => {
    const name = o.brand?.brand_name || 'Unknown';
    map[name] = (map[name] || 0) + o.total_amount;
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) {
    return [
      { label: 'Kuwait Fashion House', value: 3200, color: PALETTE[0] },
      { label: 'Gulf Tech Solutions',  value: 2100, color: PALETTE[1] },
      { label: 'Desert Rose Beauty',   value: 1450, color: PALETTE[2] },
      { label: 'Al Watan Foods',        value: 980,  color: PALETTE[3] },
      { label: 'Other',                 value: 520,  color: PALETTE[4] },
    ];
  }
  return sorted.map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));
}

function buildStatusData(orders: Order[]) {
  const statuses  = ['approved', 'pending', 'completed', 'rejected'];
  const labels    = ['Approved', 'Pending', 'Completed', 'Rejected'];
  const bgColors  = ['#16A34A', '#D97706', '#2563EB', '#DC2626'];
  const counts    = statuses.map(s => orders.filter(o => o.status === s).length);
  // if all zero, show sample
  if (counts.every(c => c === 0)) return { labels, counts: [8, 3, 12, 1], colors: bgColors };
  return { labels, counts, colors: bgColors };
}

export default function BuyerDashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [user,   setUser]   = useState<{ name: string; company_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { formatPrice, currency } = useCurrency();

  // Chart refs
  const areaRef  = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const barRef   = useRef<HTMLCanvasElement>(null);
  const areaInst  = useRef<any>(null);
  const donutInst = useRef<any>(null);
  const barInst   = useRef<any>(null);

  // Legend state (computed alongside chart init)
  const [donutLegend, setDonutLegend] = useState<{ label: string; value: number; color: string }[]>([]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([meData, ordData]) => {
      setUser(meData.user);
      setOrders(ordData.orders || []);
      setLoading(false);
    });
  }, []);

  // ── Charts ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const init = async () => {
      await ensureChartJS();
      const Chart = (window as any).Chart;

      // Destroy stale instances
      [areaInst, donutInst, barInst].forEach(r => {
        if (r.current) { r.current.destroy(); r.current = null; }
      });

      const months    = getLast6Months();
      const areaData  = buildAreaData(orders, months);
      const donutData = buildSpendingByBrand(orders);
      const statusData = buildStatusData(orders);

      setDonutLegend(donutData);

      const gridColor = 'rgba(0,0,0,0.04)';
      const tickStyle = { font: { size: 11, family: 'Inter' }, color: '#9CA3AF' };

      // ── Area Chart ──────────────────────────────────────────────────────
      if (areaRef.current) {
        areaInst.current = new Chart(areaRef.current, {
          type: 'line',
          data: {
            labels: areaData.labels,
            datasets: [{
              data: areaData.counts,
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37,99,235,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: '#2563EB',
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
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                callbacks: {
                  title: (items: any[]) => areaData.labels[items[0].dataIndex],
                  label: (item: any) => [
                    ` ${item.raw} order${item.raw !== 1 ? 's' : ''}`,
                    ` ${formatPrice(areaData.amounts[item.dataIndex])}`,
                  ],
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: tickStyle, border: { display: false } },
              y: {
                grid: { color: gridColor },
                ticks: { ...tickStyle, stepSize: 1 },
                border: { display: false },
                beginAtZero: true,
              },
            },
          },
        });
      }

      // ── Doughnut Chart ──────────────────────────────────────────────────
      if (donutRef.current) {
        donutInst.current = new Chart(donutRef.current, {
          type: 'doughnut',
          data: {
            labels: donutData.map(d => d.label),
            datasets: [{
              data: donutData.map(d => d.value),
              backgroundColor: donutData.map(d => d.color),
              borderWidth: 0,
              hoverOffset: 4,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
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
                  label: (item: any) => ` ${formatPrice(item.raw)}`,
                },
              },
            },
          },
        });
      }

      // ── Horizontal Bar Chart ────────────────────────────────────────────
      if (barRef.current) {
        barInst.current = new Chart(barRef.current, {
          type: 'bar',
          data: {
            labels: statusData.labels,
            datasets: [{
              data: statusData.counts,
              backgroundColor: statusData.colors,
              borderRadius: 4,
              borderWidth: 0,
            }],
          },
          options: {
            indexAxis: 'y' as const,
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
                callbacks: { label: (item: any) => ` ${item.raw} orders` },
              },
            },
            scales: {
              x: { grid: { color: gridColor }, ticks: tickStyle, border: { display: false } },
              y: { grid: { display: false }, ticks: tickStyle, border: { display: false } },
            },
          },
        });
      }
    };

    init().catch(console.error);
    return () => {
      [areaInst, donutInst, barInst].forEach(r => {
        if (r.current) { r.current.destroy(); r.current = null; }
      });
    };
  }, [loading, orders, currency]);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const approved  = orders.filter(o => o.status === 'approved');
  const pending   = orders.filter(o => o.status === 'pending');
  const spent     = approved.reduce((s, o) => s + o.total_amount, 0);

  const months      = getLast6Months();
  const curM        = months[5];
  const prevM       = months[4];
  const curOrders   = ordersInMonth(orders, curM.year, curM.month).length;
  const prevOrders  = ordersInMonth(orders, prevM.year, prevM.month).length;
  const curSpent    = ordersInMonth(orders.filter(o => o.status === 'approved'), curM.year, curM.month).reduce((s, o) => s + o.total_amount, 0);
  const prevSpent   = ordersInMonth(orders.filter(o => o.status === 'approved'), prevM.year, prevM.month).reduce((s, o) => s + o.total_amount, 0);
  const orderTrend  = getTrend(curOrders, prevOrders);
  const spentTrend  = getTrend(curSpent, prevSpent);

  const greeting = getGreeting(locale as any, user?.name?.split(' ')[0]);

  // ── Trend Badge ────────────────────────────────────────────────────────────
  const TrendBadge = ({ trend }: { trend: ReturnType<typeof getTrend> }) => {
    if (trend.neutral) return null;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        fontSize: 11, fontWeight: 700,
        color: trend.up ? '#16A34A' : '#DC2626',
      }}>
        {trend.up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
        {trend.pct}%
      </span>
    );
  };

  // ── Section header helper ───────────────────────────────────────────────────
  const SectionLabel = ({ label, title }: { label: string; title: string }) => (
    <div style={{ marginBottom: 14, textAlign: locale === 'ar' ? 'right' : 'left' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9CA3AF', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', fontFamily: 'var(--font-display)' }}>{title}</div>
    </div>
  );

  return (
    <div className="page-root">
      <Navbar />
      <div className="main-content">
        <div className="container-lg" style={{ padding: '32px 32px 60px' }}>

          {/* ── Greeting ── */}
          <div className="dash-greeting" style={{ marginBottom: 28, textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {greeting} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {user?.company_name} · {t('subtitle', { company: '', role: 'Buyer Account' }).replace(' · ', '')}
            </p>
          </div>

          {/* ── Review Prompt Banner ── */}
          {!loading && orders.some(o => o.status === 'completed') && (
            <div style={{ background: '#F8F7F4', border: '1px solid #1A1A2E', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                   <Star size={22} fill="currentColor" />
                </div>
                <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                   <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{tCommon('trust.buildTitle')}</div>
                   <div style={{ fontSize: 13, color: '#4B5563' }}>
                      {tCommon('trust.buildSubtitle', { count: orders.filter(o => o.status === 'completed').length })}
                   </div>
                </div>
              </div>
              <button 
                 onClick={() => {
                    const latest = orders.find(o => o.status === 'completed');
                    if (latest) { setSelectedOrder(latest); setShowReviewModal(true); }
                 }}
                 className="btn btn-primary" 
                 style={{ whiteSpace: 'nowrap', padding: '10px 20px', background: '#1A1A2E', fontSize: 13 }}
              >
                {tCommon('submit')} {locale === 'ar' ? '←' : '→'}
              </button>
            </div>
          )}

          {showReviewModal && selectedOrder && (
            <ReviewModal 
              brandId={selectedOrder.brand_id}
              brandName={selectedOrder.brand?.brand_name || 'Supplier'}
              onClose={() => setShowReviewModal(false)}
              onSuccess={() => {
                setShowReviewModal(false);
                // Optionally refresh or remove the banner
              }}
            />
          )}

          {/* ── Metric Cards ── */}
          <div className="grid-4 mb-24">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 96 }}/>)
            ) : (
              <>
                {/* Total Orders */}
                <div className="stat-card" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className="stat-icon-wrap icon-navy"><Package size={20}/></div>
                  <div style={{ flex: 1, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <div className="stat-value">{orders.length}</div>
                    <div className="stat-label">{t('metrics.totalOrders')}</div>
                    <TrendBadge trend={orderTrend}/>
                    {!orderTrend.neutral && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{tCommon('trend.vsLastMonth')}</div>
                    )}
                  </div>
                </div>
                {/* Pending */}
                <div className="stat-card" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className="stat-icon-wrap icon-amber"><Clock size={20}/></div>
                  <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <div className="stat-value" style={{ color: '#D97706' }}>{pending.length}</div>
                    <div className="stat-label">{t('metrics.pending')}</div>
                    <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>{tCommon('status.awaitingReview')}</span>
                  </div>
                </div>
                {/* Approved */}
                <div className="stat-card" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className="stat-icon-wrap icon-green"><CheckCircle size={20}/></div>
                  <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <div className="stat-value" style={{ color: '#16A34A' }}>{approved.length}</div>
                    <div className="stat-label">{t('metrics.approved')}</div>
                    <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>{tCommon('status.fulfilledOrders')}</span>
                  </div>
                </div>
                {/* Total Spent */}
                <div className="stat-card" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div className="stat-icon-wrap icon-blue"><TrendingUp size={20}/></div>
                  <div style={{ flex: 1, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <div className="stat-value" style={{ fontSize: 18 }}>
                      {formatPrice(spent)}
                    </div>
                    <div className="stat-label">{t('metrics.totalSpent')}</div>
                    <TrendBadge trend={spentTrend}/>
                    {!spentTrend.neutral && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{tCommon('trend.vsLastMonth')}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Area Chart + Quick Actions ── */}
          <div className="dashboard-chart-grid mb-24" style={{ display: 'grid', gridTemplateColumns: locale === 'ar' ? '1fr 2fr' : '2fr 1fr', gap: 24 }}>
            {/* Area Chart */}
            <div className="card dashboard-chart-card" style={{ padding: 20 }}>
              <SectionLabel label={tCommon('analytics')} title={t('charts.orderActivity')}/>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('charts.ordersPerMonth')}</div>

              {loading ? (
                <div className="skeleton" style={{ height: 220 }}/>
              ) : (
                <>
                  <div style={{ position: 'relative', height: 220 }}>
                    <canvas ref={areaRef}/>
                  </div>
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <Link href="/orders" style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      {t('viewAll')} <ArrowUpRight size={13} style={{ transform: locale === 'ar' ? 'rotate(-90deg)' : 'none' }}/>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <div className="card-header" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}><h2>{t('quickActions.title')}</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/marketplace" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', background: 'var(--bg-white)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-white)')}>
                    <div style={{ width: 40, height: 40, background: 'var(--bg-navy-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Store size={18} style={{ color: 'var(--navy)' }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t('quickActions.browseMarketplace')}</div>
                      <div className="desktop-only" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tCommon('status.discoverVerified')}</div>
                    </div>
                    {locale === 'ar' ? <ArrowUpRight className="desktop-only" size={14} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)' }}/> : <ArrowUpRight className="desktop-only" size={14} style={{ color: 'var(--text-muted)' }}/>}
                  </div>
                </Link>

                <Link href="/orders" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', background: 'var(--bg-white)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-white)')}>
                    <div style={{ width: 40, height: 40, background: 'var(--bg-subtle)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={18} style={{ color: 'var(--text-secondary)' }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t('quickActions.viewAllOrders')}</div>
                      <div className="desktop-only" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tCommon('status.totalOrdersCount', { count: orders.length })}</div>
                    </div>
                    {locale === 'ar' ? <ArrowUpRight className="desktop-only" size={14} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)' }}/> : <ArrowUpRight className="desktop-only" size={14} style={{ color: 'var(--text-muted)' }}/>}
                  </div>
                </Link>

                <div className="desktop-only" style={{ padding: '14px 16px', background: 'var(--bg-featured)', border: '1px solid #BFDBFE', borderRadius: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', marginBottom: 8 }}>{tCommon('howItWorks.title')}</div>
                  <ol style={{ fontSize: 12, color: 'var(--text-secondary)', [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: 16, lineHeight: 2 }}>
                    <li>{tCommon('howItWorks.step1')}</li>
                    <li>{tCommon('howItWorks.step2')}</li>
                    <li>{tCommon('howItWorks.step3')}</li>
                    <li>{tCommon('howItWorks.step4')}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* ── Secondary Charts ── */}
          <div className="grid-2 mb-24" style={{ gap: 24 }}>
            {/* Spending by Brand — Doughnut */}
            <div className="card" style={{ padding: 20 }}>
              <SectionLabel label="Breakdown" title={t('charts.spendingByBrand')}/>
              {loading ? (
                <div className="skeleton" style={{ height: 200 }}/>
              ) : (
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <div style={{ position: 'relative', height: 160, width: 160, flexShrink: 0 }}>
                    <canvas ref={donutRef}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    {donutLegend.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }}/>
                        <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: locale === 'ar' ? 'right' : 'left' }}>{d.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                          {formatPrice(d.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Status — Horizontal Bar */}
            <div className="card" style={{ padding: 20 }}>
              <SectionLabel label="Overview" title={t('charts.orderStatus')}/>
              {loading ? (
                <div className="skeleton" style={{ height: 200 }}/>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <BarChart2 size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }}/>
                  <div style={{ fontSize: 13 }}>No data yet — orders will appear here</div>
                </div>
              ) : (
                <div style={{ position: 'relative', height: 180 }}>
                  <canvas ref={barRef}/>
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Orders ── */}
          <div className="card">
            <div className="card-header" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <h2>{t('recentOrders')}</h2>
              <Link href="/orders" className="btn btn-ghost btn-sm" style={{ gap: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                {tCommon('viewAll')} {locale === 'ar' ? <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> : <ChevronRight size={13} />}
              </Link>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 160 }}/>
            ) : orders.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon"><Package size={24}/></div>
                <h3>{t('empty.noOrders')}</h3>
                <Link href="/marketplace" className="btn btn-primary btn-sm">{t('empty.browse')}</Link>
              </div>
            ) : (
              orders.slice(0, 5).map(order => (
                <Link href={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.1s', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
                      {order.brand?.logo_url ? (
                        <img src={order.brand.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                          {order.brand?.brand_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{order.brand?.brand_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(order.created_at, locale as any)} · {tCommon('status.itemsCount', { count: order.items?.length })}</div>
                    </div>
                    <div style={{ textAlign: locale === 'ar' ? 'left' : 'right', display: 'flex', flexDirection: 'column', alignItems: locale === 'ar' ? 'flex-start' : 'flex-end', gap: 5 }}>
                      <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{formatPrice(order.total_amount)}</span>
                      <StatusBadge status={order.status}/>
                    </div>
                    {locale === 'ar' ? <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: 'rotate(180deg)' }}/> : <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }}/>}
                  </div>
                </Link>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
