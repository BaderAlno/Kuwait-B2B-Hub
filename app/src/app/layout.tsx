import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import MobileTopBar from "@/components/MobileTopBar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://kuwaitb2bhub.com'),
  title: {
    default: 'Kuwait B2B Hub — Wholesale Marketplace for Kuwaiti Brands',
    template: '%s | Kuwait B2B Hub'
  },
  description: "Connect with verified Kuwaiti brands. Browse wholesale product catalogs, negotiate terms, and place bulk orders on Kuwait's first B2B digital marketplace.",
  keywords: [
    'Kuwait B2B', 'Kuwait wholesale', 'Kuwaiti brands',
    'wholesale marketplace Kuwait', 'B2B platform Kuwait',
    'Kuwait business marketplace', 'جملة الكويت', 'سوق الجملة',
    'منصة B2B الكويت', 'موردون الكويت', 'GCC wholesale',
    'موردون الكويت بالجملة', 'B2B Kuwait', 'wholesale Kuwait'
  ],
  authors: [{ name: 'Kuwait B2B Hub' }],
  creator: 'Kuwait B2B Hub',
  publisher: 'Kuwait B2B Hub',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_KW',
    url: 'https://kuwaitb2bhub.com',
    siteName: 'Kuwait B2B Hub',
    title: 'Kuwait B2B Hub — Wholesale Marketplace',
    description: "Kuwait's first professional B2B wholesale marketplace. Connect brands with buyers.",
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Kuwait B2B Hub — Wholesale Marketplace'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuwait B2B Hub — Wholesale Marketplace',
    description: "Kuwait's first B2B wholesale platform",
    images: ['/og-image.png'],
    creator: '@kuwaitb2bhub'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: 'add-your-google-verification-code-here'
  },
  alternates: {
    canonical: 'https://kuwaitb2bhub.com',
    languages: {
      'en': 'https://kuwaitb2bhub.com',
      'ar': 'https://kuwaitb2bhub.com?lang=ar',
    }
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale() as 'en' | 'ar';
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#1A1A2E" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏪</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* hreflang for bilingual SEO */}
        <link rel="alternate" hrefLang="en" href="https://kuwaitb2bhub.com" />
        <link rel="alternate" hrefLang="ar" href="https://kuwaitb2bhub.com?lang=ar" />
        <link rel="alternate" hrefLang="x-default" href="https://kuwaitb2bhub.com" />
      </head>
      <body className="page-wrapper">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <MobileTopBar />
            {children}
            <BottomNav />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
