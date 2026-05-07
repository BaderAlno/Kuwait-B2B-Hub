'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Store, LayoutDashboard, ShoppingBag, Package, Tags, Users, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import NotificationBell from '@/components/NotificationBell';
import CurrencySelector from '@/components/CurrencySelector';
import LanguageToggle from '@/components/LanguageToggle';

interface User {
  id: string; name: string; email: string;
  role: string; company_name: string; verification_status: string;
}

const ROLE_NAV: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15}/> },
    { href: '/admin/brands',    label: 'Brands',    icon: <Tags size={15}/> },
    { href: '/admin/users',     label: 'Users',     icon: <Users size={15}/> },
    { href: '/admin/orders',    label: 'Orders',    icon: <Package size={15}/> },
  ],
  brand_owner: [
    { href: '/brand/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15}/> },
    { href: '/brand/products',  label: 'Products',  icon: <ShoppingBag size={15}/> },
    { href: '/brand/orders',    label: 'Orders',    icon: <Package size={15}/> },
    { href: '/brand/profile',   label: 'Brand Profile', icon: <Tags size={15}/> },
  ],
  buyer: [
    { href: '/marketplace',     label: 'Marketplace', icon: <Store size={15}/> },
    { href: '/orders',          label: 'My Orders',   icon: <Package size={15}/> },
    { href: '/dashboard',       label: 'Dashboard',   icon: <LayoutDashboard size={15}/> },
  ],
};

const DASH_LINKS: Record<string, string> = {
  admin: '/admin/dashboard',
  brand_owner: '/brand/dashboard',
  buyer: '/marketplace',
};

export default function Navbar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const getTranslatedLinks = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          { href: '/admin/dashboard', label: t('dashboard'), icon: <LayoutDashboard size={15}/> },
          { href: '/admin/brands',    label: t('brands'),    icon: <Tags size={15}/> },
          { style: {}, href: '/admin/users',     label: t('users'),     icon: <Users size={15}/> },
          { href: '/admin/orders',    label: t('orders'),    icon: <Package size={15}/> },
        ];
      case 'brand_owner':
        return [
          { href: '/brand/dashboard', label: t('dashboard'), icon: <LayoutDashboard size={15}/> },
          { href: '/brand/products',  label: t('products'),  icon: <ShoppingBag size={15}/> },
          { href: '/brand/orders',    label: t('orders'),    icon: <Package size={15}/> },
          { href: '/brand/profile',   label: t('profile'),   icon: <Tags size={15}/> },
        ];
      case 'buyer':
        return [
          { href: '/marketplace',     label: t('marketplace'), icon: <Store size={15}/> },
          { href: '/orders',          label: t('orders'),   icon: <Package size={15}/> },
          { href: '/dashboard',       label: t('dashboard'),   icon: <LayoutDashboard size={15}/> },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { setUser(d.user); setLoading(false); }).catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const links = user ? getTranslatedLinks(user.role) : [];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href={user ? DASH_LINKS[user.role] || '/' : '/'} className="navbar-brand">
          <div className="navbar-brand-icon"><Store size={16} /></div>
          B2BHub
          <span className="navbar-brand-tag">Kuwait</span>
        </Link>

        {/* Navigation links */}
        {user && (
          <div className="navbar-nav">
            {links.map(link => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}>
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right controls */}
        <div className="navbar-right">
          {/* Language toggle */}
          <LanguageToggle />

          {user?.role !== 'admin' && <CurrencySelector />}

          {!loading && user && (
            <>
              <NotificationBell />

              <button className="user-avatar-btn" onClick={handleLogout} title="Click to sign out">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="user-info-name">{user.name}</div>
                  <div className="user-info-role">{getRoleLabel(user.role, locale)}</div>
                </div>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
              </button>
            </>
          )}

          {!loading && !user && (
            <div className="flex gap-8">
              <Link href="/login"    className="btn btn-ghost btn-sm">{tAuth('signIn')}</Link>
              <Link href="/register" className="btn btn-primary btn-sm">{tAuth('signUp')}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function getRoleLabel(role: string, locale: string) {
  if (locale === 'ar') {
    if (role === 'admin')       return 'مسؤول النظام';
    if (role === 'brand_owner') return 'صاحب علامة';
    return 'مشترٍ';
  }
  if (role === 'admin')       return 'Administrator';
  if (role === 'brand_owner') return 'Brand Owner';
  return 'Buyer';
}
