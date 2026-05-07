import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { readDB } from '@/lib/db';
import LandingPage from '@/components/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kuwait B2B Hub — The Wholesale Marketplace Built for Kuwait',
  description: "Connect directly with verified Kuwaiti brands. Browse wholesale catalogs, negotiate terms, and place bulk orders — all in one place. Kuwait's first B2B digital marketplace.",
};

export interface FeaturedBrand {
  id: string;
  brand_name: string;
  logo_url: string;
  verification_tier: string;
  description: string;
  category?: string;
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === 'admin') redirect('/admin/dashboard');
    if (user.role === 'brand_owner') redirect('/brand/dashboard');
    redirect('/marketplace');
  }

  // Fetch featured brands for the social proof section
  const db = readDB();
  const featuredBrands: FeaturedBrand[] = db.brands
    .filter(b => b.status === 'approved')
    .slice(0, 3)
    .map(b => ({
      id: b.id,
      brand_name: b.brand_name,
      logo_url: b.logo_url,
      verification_tier: b.verification_tier || 'new',
      description: b.description,
    }));

  // Structured data for SEO
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kuwait B2B Hub',
    url: 'https://kuwaitb2bhub.com',
    description: "Kuwait's first B2B wholesale marketplace",
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://kuwaitb2bhub.com/marketplace?q={search_term}',
      'query-input': 'required name=search_term',
    },
  };

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kuwait B2B Hub',
    url: 'https://kuwaitb2bhub.com',
    logo: 'https://kuwaitb2bhub.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Arabic'],
    },
    areaServed: ['KW', 'SA', 'AE', 'BH'],
    foundingLocation: 'Kuwait City, Kuwait',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <LandingPage featuredBrands={featuredBrands} />
    </>
  );
}
