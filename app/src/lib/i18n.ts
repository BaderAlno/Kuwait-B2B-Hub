export type Locale = 'en' | 'ar';

export const locales = ['en', 'ar'] as const;
export const defaultLocale: Locale = 'en';

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US').format(value);
}

export function formatDate(date: string | Date, locale: Locale) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (locale === 'ar') {
    return new Intl.DateTimeFormat('ar-KW', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    }).format(d);
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

export function getGreeting(locale: Locale, name?: string) {
  const hour = new Date().getHours();
  let greeting = '';

  if (locale === 'ar') {
    if (hour >= 5 && hour < 12) greeting = 'صباح الخير';
    else if (hour >= 12 && hour < 17) greeting = 'مساء الخير';
    else if (hour >= 17 && hour < 21) greeting = 'مساء النور';
    else greeting = 'تصبح على خير';
  } else {
    if (hour >= 5 && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';
  }

  return name ? `${greeting}, ${name}` : greeting;
}
