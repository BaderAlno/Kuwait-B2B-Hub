'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';
import {
  Bell, Check, X, AlertTriangle, Star, Store,
  User, Package, TrendingUp, Info, CheckCheck,
  Settings, ChevronRight, ArrowLeft,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Notification {
  id: string; type: string; title: string; body: string;
  read: boolean; action_url: string; icon_type: string; created_at: string;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, { bg: string; color: string; el: React.ReactNode }> = {
  success:   { bg: '#DCFCE7', color: '#16A34A', el: <Check        size={16}/> },
  error:     { bg: '#FEE2E2', color: '#DC2626', el: <X            size={16}/> },
  info:      { bg: '#DBEAFE', color: '#2563EB', el: <Info         size={16}/> },
  warning:   { bg: '#FEF3C7', color: '#D97706', el: <AlertTriangle size={16}/> },
  star:      { bg: '#FEF3C7', color: '#D97706', el: <Star         size={16}/> },
  store:     { bg: '#EDE9FE', color: '#7C3AED', el: <Store        size={16}/> },
  user:      { bg: '#DCFCE7', color: '#16A34A', el: <User         size={16}/> },
  package:   { bg: '#FEF3C7', color: '#D97706', el: <Package      size={16}/> },
  milestone: { bg: '#EDE9FE', color: '#7C3AED', el: <TrendingUp   size={16}/> },
};
function getIcon(t: string) { return ICON_MAP[t] ?? ICON_MAP.info; }

function timeAgo(d: string, locale: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (locale === 'ar') {
    if (m < 1)  return 'الآن';
    if (m < 60) return `منذ ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} ساعة`;
    const days = Math.floor(h / 24);
    if (days < 30) return `منذ ${days} يوم`;
    return formatDate(d, 'ar');
  }
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d, 'en');
}

// ─── Preference groups per role ───────────────────────────────────────────────
const PREFS_BY_ROLE: Record<string, { key: string; label: string; desc: string }[]> = {
  buyer: [
    { key: 'order_approved',    label: 'Order Approved',      desc: 'When a brand approves your order request' },
    { key: 'order_rejected',    label: 'Order Declined',      desc: 'When a brand declines your order request' },
    { key: 'order_completed',   label: 'Order Fulfilled',     desc: 'When your order is marked as completed' },
    { key: 'new_brand',         label: 'New Brand Alert',     desc: 'When a new brand joins the marketplace' },
    { key: 'review_reminder',   label: 'Review Reminders',    desc: 'Reminders to review completed orders' },
  ],
  brand_owner: [
    { key: 'new_order',         label: 'New Order Request',   desc: 'When a buyer submits an order request' },
    { key: 'new_review',        label: 'New Review',          desc: 'When a buyer leaves a review on your brand' },
    { key: 'account_approved',  label: 'Account Status',      desc: 'When your brand verification status changes' },
    { key: 'low_stock',         label: 'Low Stock Alerts',    desc: 'When a product stock falls below 10 units' },
  ],
  admin: [
    { key: 'new_brand_registration', label: 'New Brand Registration', desc: 'When a brand owner submits for approval' },
    { key: 'new_user',               label: 'New User Sign-Up',        desc: 'When a new user registers on the platform' },
    { key: 'platform_milestone',     label: 'Platform Milestones',     desc: 'When the platform reaches activity milestones' },
  ],
};

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        background: on ? 'var(--blue)' : 'var(--border-strong)',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        position: 'relative', flexShrink: 0,
      }}
      aria-label={on ? 'Disable' : 'Enable'}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transform: on ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s',
      }}/>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [notifications, setNotifs]   = useState<Notification[]>([]);
  const [userRole,      setUserRole] = useState('buyer');
  const [loading,       setLoading]  = useState(true);
  const [tab,           setTab]      = useState<'all' | 'unread' | 'prefs'>('all');
  const [prefs, setPrefs]            = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notif_prefs');
      if (saved) setPrefs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const savePref = (key: string, value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem('notif_prefs', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [nRes, uRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/auth/me'),
      ]);
      const [nData, uData] = await Promise.all([nRes.json(), uRes.json()]);
      setNotifs(nData.notifications ?? []);
      setUserRole(uData.user?.role ?? 'buyer');
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (n: Notification) => {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    router.push(n.action_url);
  };

  const displayed = tab === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;
  const prefList = PREFS_BY_ROLE[userRole] ?? [];

  return (
    <div className="page-root">
      <Navbar />
      <div className="main-content">
        <div className="container" style={{ padding: '32px 24px 64px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} style={{ transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }}/>
            </button>
            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{t('title')}</h1>
              {unreadCount > 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{locale === 'ar' ? `${unreadCount} غير مقروء` : `${unreadCount} unread`}</p>}
            </div>
          </div>

          {/* Tabs */}
          <div className="filter-tabs" style={{ marginBottom: 20, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            {(['all', 'unread', 'prefs'] as const).map(tabKey => (
              <button key={tabKey} className={`filter-tab ${tab === tabKey ? 'active' : ''}`} onClick={() => setTab(tabKey)}>
                {tabKey === 'all' ? tCommon('all') : tabKey === 'unread' ? `${locale === 'ar' ? 'غير مقروء' : 'Unread'}${unreadCount > 0 ? ` (${unreadCount})` : ''}` : (locale === 'ar' ? 'التفضيلات' : 'Preferences')}
              </button>
            ))}
          </div>

          {/* ── Preferences tab ── */}
          {tab === 'prefs' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <Settings size={16} style={{ color: 'var(--text-muted)' }}/>
                  <h2>{locale === 'ar' ? 'إعدادات الإشعارات' : 'In-App Notification Settings'}</h2>
                </div>
              </div>

              {prefList.map((pref, i) => {
                const isOn = prefs[pref.key] !== false; // default ON
                return (
                  <div key={pref.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < prefList.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{pref.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pref.desc}</div>
                    </div>
                    <Toggle on={isOn} onChange={v => savePref(pref.key, v)}/>
                  </div>
                );
              })}

              {/* Email section — coming soon */}
              <div style={{ margin: '0 20px 20px', padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 10, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <CheckCheck size={14} style={{ color: 'var(--text-muted)' }}/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--border)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4 }}>{tCommon('comingSoon')}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'تنبيهات البريد الإلكتروني للأحداث المهمة ستكون متاحة في تحديث مستقبلي.' : 'Email alerts for critical events will be available in a future update.'}</p>
              </div>
            </div>
          )}

          {/* ── Notifications list ── */}
          {tab !== 'prefs' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* List header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {locale === 'ar' ? `${displayed.length} إشعار` : `${displayed.length} notification${displayed.length !== 1 ? 's' : ''}`}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {t('markAllRead')}
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ padding: 16 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8, borderRadius: 8 }}/>)}
                </div>
              ) : displayed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Bell size={28} style={{ color: 'var(--text-muted)' }}/>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                    {tab === 'unread' ? (locale === 'ar' ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications') : t('empty')}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('emptyHint')}</p>
                </div>
              ) : (
                displayed.map(n => {
                  const icon = getIcon(n.icon_type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => markRead(n)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: n.read ? 'var(--bg-white)' : '#F0F7FF',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = n.read ? 'var(--bg-hover)' : '#E8F3FF')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'var(--bg-white)' : '#F0F7FF')}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: icon.bg, color: icon.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {icon.el}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{n.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.body}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{timeAgo(n.created_at, locale)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB' }}/>}
                        <ChevronRight size={15} style={{ color: 'var(--text-muted)' }}/>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
