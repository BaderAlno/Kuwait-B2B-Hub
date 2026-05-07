'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Store, BarChart2, Settings } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Props {
  pendingCount?: number;
  productCount?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: { count: number; bg: string; color: string } | null;
  muted?: boolean;
  exact?: boolean;
}

export default function BrandSidebar({ pendingCount = 0, productCount }: Props) {
  const t = useTranslations('brandSidebar');
  const locale = useLocale();
  const pathname = usePathname();

  const iconSize = 16;

  // Active detection — exact match for dashboard to avoid it matching everything
  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href || pathname === `/en${href}` || pathname === `/ar${href}`;
    return pathname.includes(href);
  };

  const navItems: NavItem[] = [
    {
      href: '/brand/dashboard',
      label: t('dashboard'),
      icon: <LayoutDashboard size={iconSize} />,
      exact: true,
    },
    {
      href: '/brand/products',
      label: t('products'),
      icon: <ShoppingBag size={iconSize} />,
      badge: productCount != null && productCount > 0
        ? { count: productCount, bg: '#F3F4F6', color: '#6B7280' }
        : null,
    },
    {
      href: '/brand/orders',
      label: t('orders'),
      icon: <Package size={iconSize} />,
      badge: pendingCount > 0
        ? { count: pendingCount, bg: '#FEF3C7', color: '#92400E' }
        : null,
    },
    {
      href: '/brand/profile',
      label: t('profile'),
      icon: <Store size={iconSize} />,
    },
    {
      href: '/brand/dashboard',
      label: t('analytics'),
      icon: <BarChart2 size={iconSize} />,
      muted: true,
    },
  ];

  const linkStyle = (href: string, exact = false, muted = false): React.CSSProperties => ({
    textAlign: locale === 'ar' ? 'right' : 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    opacity: muted ? 0.45 : 1,
    pointerEvents: muted ? 'none' : 'auto',
    cursor: muted ? 'default' : 'pointer',
  });

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
  };

  return (
    <aside className="dash-sidebar desktop-only" style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
      <span className="dash-sidebar-label">{t('label')}</span>

      {navItems.map(item => (
        <Link
          key={item.href + item.label}
          href={item.href}
          className={`sidebar-link ${isActive(item.href, item.exact) && !item.muted ? 'active' : ''}`}
          style={linkStyle(item.href, item.exact, item.muted)}
        >
          <span style={innerStyle}>
            {item.icon}
            {item.label}
          </span>
          {item.badge && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: 20,
              minWidth: 20,
              textAlign: 'center',
              background: item.badge.bg,
              color: item.badge.color,
            }}>
              {item.badge.count}
            </span>
          )}
        </Link>
      ))}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0', opacity: 0.5 }} />

      <Link
        href="/brand/profile"
        className={`sidebar-link ${isActive('/brand/profile') ? 'active' : ''}`}
        style={{ textAlign: locale === 'ar' ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}
      >
        <Settings size={iconSize} />
        {t('settings')}
      </Link>
    </aside>
  );
}
