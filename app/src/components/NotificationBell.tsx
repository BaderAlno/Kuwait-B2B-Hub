'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';
import {
  Bell, Check, X, AlertTriangle, Star, Store,
  User, Package, TrendingUp, Info, ChevronRight,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  action_url: string;
  icon_type: string;
  created_at: string;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, { bg: string; color: string; el: React.ReactNode }> = {
  success:   { bg: '#DCFCE7', color: '#16A34A', el: <Check   size={15}/> },
  error:     { bg: '#FEE2E2', color: '#DC2626', el: <X       size={15}/> },
  info:      { bg: '#DBEAFE', color: '#2563EB', el: <Info    size={15}/> },
  warning:   { bg: '#FEF3C7', color: '#D97706', el: <AlertTriangle size={15}/> },
  star:      { bg: '#FEF3C7', color: '#D97706', el: <Star    size={15}/> },
  store:     { bg: '#EDE9FE', color: '#7C3AED', el: <Store   size={15}/> },
  user:      { bg: '#DCFCE7', color: '#16A34A', el: <User    size={15}/> },
  package:   { bg: '#FEF3C7', color: '#D97706', el: <Package size={15}/> },
  milestone: { bg: '#EDE9FE', color: '#7C3AED', el: <TrendingUp size={15}/> },
};

function getIcon(type: string) {
  return ICON_MAP[type] ?? ICON_MAP.info;
}

// ─── Arabic title translations ────────────────────────────────────────────────
const TITLE_AR: Record<string, string> = {
  new_order:          'طلب شراء جديد!',
  order_approved:     'تم قبول الطلب!',
  order_rejected:     'تم رفض الطلب',
  order_completed:    'تم إتمام الطلب!',
  low_stock_warning:  'تحذير: مخزون منخفض',
  new_review:         'تقييم جديد',
  account_approved:   'علامتك التجارية نشطة الآن!',
  account_rejected:   'تحديث التحقق من العلامة التجارية',
  new_brand_available:'علامة تجارية جديدة في المنصة',
  platform_milestone: 'إنجاز جديد للمنصة!',
  review_reminder:    'كيف كانت تجربتك؟',
};

function getTitle(n: Notification, locale: string): string {
  if (locale === 'ar' && TITLE_AR[n.type]) return TITLE_AR[n.type];
  return n.title;
}

// ─── Locale-aware relative time ───────────────────────────────────────────────
function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (locale === 'ar') {
    if (mins < 1)   return 'الآن';
    if (mins < 60)  return `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `منذ ${hrs} س`;
    const days = Math.floor(hrs / 24);
    if (days < 7)   return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    if (days < 30)  return `منذ ${Math.floor(days / 7)} أسبوع`;
    return formatDate(dateStr, 'ar');
  }

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateStr, 'en');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const locale = useLocale();
  const isRTL  = locale === 'ar';

  const [open,          setOpen]     = useState(false);
  const [notifications, setNotifs]  = useState<Notification[]>([]);
  const [unreadCount,   setUnread]  = useState(0);
  const [loading,       setLoading] = useState(false);
  const [isMobile,      setMobile]  = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router     = useRouter();

  // ── Mobile detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Poll unread count every 60s ─────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unread_count ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // ── Fetch full list when opened ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unread_count ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handleOpen = () => {
    if (!open) fetchAll();
    setOpen(v => !v);
  };

  // ── Click outside to close (desktop) ────────────────────────────────────────
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile]);

  // ── Escape key to close ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Mark single as read + navigate ──────────────────────────────────────────
  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(c => Math.max(0, c - 1));
    }
    setOpen(false);
    router.push(n.action_url);
  };

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  // ── Panel content (shared between dropdown + sheet) ──────────────────────────
  const PanelContent = () => (
    <>
      {/* Header */}
      <div
        className="notif-panel-header"
        style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          {isRTL ? 'الإشعارات' : 'Notifications'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <X size={18}/>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="notif-list">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, margin: '8px 12px', borderRadius: 8 }}/>
          ))
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Bell size={24} style={{ color: 'var(--text-muted)' }}/>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
              {isRTL ? 'لا توجد إشعارات جديدة' : "You're all caught up!"}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {isRTL ? 'ستظهر إشعاراتك هنا' : 'No new notifications'}
            </div>
          </div>
        ) : (
          notifications.map(n => {
            const icon = getIcon(n.icon_type);
            return (
              <div
                key={n.id}
                className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
                style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                onClick={() => handleClick(n)}
              >
                {/* Icon circle */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: icon.bg, color: icon.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon.el}
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                    lineHeight: 1.3, marginBottom: 2,
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                    {getTitle(n, locale)}
                  </div>
                  <div
                    dir="ltr"
                    style={{
                      fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      textAlign: isRTL ? 'right' : 'left',
                      unicodeBidi: 'plaintext',
                    }}
                  >
                    {n.body}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                    {timeAgo(n.created_at, locale)}
                  </div>
                </div>
                {/* Unread dot */}
                {!n.read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }}/>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="notif-panel-footer">
          <button
            onClick={() => { setOpen(false); router.push('/notifications'); }}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {isRTL ? (
              <>
                <ChevronRight size={13} style={{ transform: 'scaleX(-1)' }}/>
                عرض جميع الإشعارات
              </>
            ) : (
              <>
                View all notifications <ChevronRight size={13}/>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );

  const badgeCount = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        className="icon-btn"
        onClick={handleOpen}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        style={{ position: 'relative' }}
      >
        <Bell size={16}/>
        {unreadCount > 0 && (
          <span className="notif-badge">{badgeCount}</span>
        )}
      </button>

      {/* Desktop dropdown */}
      {open && !isMobile && (
        <div
          className="notif-dropdown"
          dir={isRTL ? 'rtl' : 'ltr'}
          style={isRTL ? { right: 'auto', left: 0 } : undefined}
        >
          <PanelContent/>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && isMobile && (
        <>
          <div className="notif-overlay" onClick={() => setOpen(false)}/>
          <div className="notif-sheet" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="notif-sheet-handle"/>
            <PanelContent/>
          </div>
        </>
      )}
    </div>
  );
}
