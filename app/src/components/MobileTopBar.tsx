'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Store, X, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import NotificationBell from '@/components/NotificationBell';
import LanguageToggle from '@/components/LanguageToggle';

interface UserInfo {
  id: string; name: string; role: string; company_name: string;
}

const DASH_LINKS: Record<string, string> = {
  admin: '/admin/dashboard',
  brand_owner: '/brand/dashboard',
  buyer: '/marketplace',
};

export default function MobileTopBar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user || null))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getRoleLabel = (role: string) => {
    if (locale === 'ar') {
      if (role === 'admin')       return 'مسؤول النظام';
      if (role === 'brand_owner') return 'صاحب علامة';
      return 'مشترٍ';
    }
    if (role === 'admin')       return 'Administrator';
    if (role === 'brand_owner') return 'Brand Owner';
    return 'Buyer';
  };

  // Hide on landing page when logged out — landing page has its own nav
  if (!user && pathname === '/') return null;

  return (
    <>
      <header className="mobile-top-bar">
        <Link href={user ? (DASH_LINKS[user.role] || '/') : '/'} className="mobile-brand">
          <div className="mobile-brand-icon"><Store size={14} /></div>
          <span className="mobile-brand-text">B2BHub</span>
          <span className="mobile-brand-tag">Kuwait</span>
        </Link>

        <div className="mobile-top-actions">
          <NotificationBell />

          {user && (
            <button
              className="mobile-avatar-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="User menu"
            >
              <div className="mobile-avatar">{user.name.charAt(0).toUpperCase()}</div>
            </button>
          )}
        </div>
      </header>

      {/* Slide-up user menu */}
      {menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
          <div className="mobile-menu-sheet">
            <div className="mobile-menu-handle" />

            <div className="mobile-menu-user">
              <div className="mobile-menu-avatar">{user?.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="mobile-menu-name">{user?.name}</div>
                <div className="mobile-menu-role">{getRoleLabel(user?.role || '')}</div>
                <div className="mobile-menu-company">{user?.company_name}</div>
              </div>
            </div>

            <div className="mobile-menu-divider" />

            <Link href="/profile" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
              <UserIcon size={18} />
              <span>{t('profile')}</span>
              <ChevronRight size={16} style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 'auto', color: 'var(--text-muted)', transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} />
            </Link>

            <div className="mobile-menu-divider" />

            <div className="mobile-menu-item" style={{ justifyContent: 'space-between', paddingRight: locale === 'ar' ? '0' : '20px', paddingLeft: locale === 'ar' ? '20px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Store size={18} />
                <span>{tCommon('language')}</span>
              </div>
              <LanguageToggle />
            </div>

            <div className="mobile-menu-divider" />

            <button className="mobile-menu-item mobile-menu-logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>{t('signOut')}</span>
            </button>

            <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
