import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'ar'] as const;
const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4: requestLocale is a Promise<string | undefined>
  let locale = await requestLocale;

  // Fall back to default if locale is missing or not supported
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
