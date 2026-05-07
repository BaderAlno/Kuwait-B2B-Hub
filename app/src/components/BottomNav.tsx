'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Package, LayoutDashboard, User, Tags, ShoppingBag, Users, BarChart2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface User {
  id: string; name: string; role: string;
}


// Pages where bottom nav should NOT appear
const HIDDEN_PATHS = ['/login', '/register', '/pending'];

export default function BottomNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUser(d.user || null);
        if (d.user) {
          // Fetch pending order count for badge
          fetch('/api/orders?status=pending')
            .then(r => r.json())
            .then(od => setPendingCount((od.orders || []).length))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Don't render on hidden paths or if not logged in
  if (!user || HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;

  const BUYER_TABS = [
    { href: '/marketplace', label: t('marketplace'), icon: Store },
    { href: '/orders',      label: t('orders'),      icon: Package,       badge: true },
    { href: '/dashboard',   label: t('dashboard'),   icon: LayoutDashboard },
    { href: '/profile',     label: t('profile'),     icon: User },
  ];

  const BRAND_TABS = [
    { href: '/brand/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/brand/products',  label: t('products'),  icon: ShoppingBag },
    { href: '/brand/orders',    label: t('orders'),    icon: Package, badge: true },
    { href: '/brand/profile',   label: t('profile'),   icon: Tags },
  ];

  const ADMIN_TABS = [
    { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/brands',    label: t('brands'),    icon: Tags },
    { href: '/admin/orders',    label: t('orders'),    icon: Package, badge: true },
    { href: '/admin/users',     label: t('users'),     icon: Users },
  ];

  let tabs = user.role === 'buyer' ? BUYER_TABS : user.role === 'brand_owner' ? BRAND_TABS : ADMIN_TABS;
  
  // Reverse order for Arabic RTL as requested
  if (locale === 'ar') {
    tabs = [...tabs].reverse();
  }

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-nav-tab${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.badge && pendingCount > 0 && (
                <span className="bottom-nav-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>
              )}
            </div>
            <span className="bottom-nav-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
