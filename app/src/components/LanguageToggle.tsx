'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = (newLocale: 'en' | 'ar') => {
    if (newLocale === locale) return;
    
    // Save to localStorage as requested in previous instructions
    localStorage.setItem('b2b-hub-locale', newLocale);
    
    // Switch language using next-intl router
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center" style={{ 
      background: '#F3F4F6', 
      padding: '3px', 
      borderRadius: '20px',
      display: 'inline-flex',
      gap: '2px',
      border: '1px solid #E5E7EB'
    }}>
      <button
        onClick={() => toggleLanguage('en')}
        style={{
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: 700,
          transition: 'all 0.2s',
          background: locale === 'en' ? '#1A1A2E' : 'transparent',
          color: locale === 'en' ? 'white' : '#6B7280',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage('ar')}
        style={{
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: 700,
          transition: 'all 0.2s',
          background: locale === 'ar' ? '#1A1A2E' : 'transparent',
          color: locale === 'ar' ? 'white' : '#6B7280',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        AR
      </button>
    </div>
  );
}
