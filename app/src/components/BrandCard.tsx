'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import BrandAvatar from '@/components/BrandAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import TrustScore from '@/components/TrustScore';
import { StarDisplay } from '@/components/StarRating';

interface BrandCardProps {
  brand: {
    id: string;
    brand_name: string;
    description: string;
    logo_url: string;
    owner_name?: string;
    product_count?: number;
    verification_tier?: string;
    avg_rating?: number;
    total_reviews?: number;
    trust?: {
      response_rate?: number;
      total_fulfilled?: number;
      badges?: string[];
      member_since?: string;
    };
  };
  variant?: 'desktop' | 'mobile';
}

export default function BrandCard({ brand, variant = 'desktop' }: BrandCardProps) {
  const t = useTranslations('marketplace');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  function productCountLabel(count: number): string {
    if (count === 0) return isRTL ? 'جاري إعداد الكتالوج' : 'Catalog coming soon';
    if (isRTL) return `${count} منتج`;
    return `${count} product${count !== 1 ? 's' : ''}`;
  }

  if (variant === 'mobile') {
    return (
      <Link
        href={`/brands/${brand.id}`}
        className="brand-card-mobile"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div className="brand-card-mobile-logo">
          <BrandAvatar
            name={brand.brand_name}
            logoUrl={brand.logo_url}
            size={44}
            radius={10}
          />
        </div>
        <div className="brand-card-mobile-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="brand-card-mobile-name">{brand.brand_name}</span>
            {brand.verification_tier && brand.verification_tier !== 'new' && (
              <VerifiedBadge tier={brand.verification_tier as 'premium' | 'verified' | 'new'} size="sm" showModal={false} />
            )}
          </div>
          <div className="brand-card-mobile-sub">
            {productCountLabel(brand.product_count ?? 0)}
            {brand.avg_rating && brand.avg_rating > 0 && (
              <> · ⭐ {brand.avg_rating.toFixed(1)}</>
            )}
            {brand.trust?.total_fulfilled && (
              <> · {t('brandCard.fulfilled', { count: brand.trust.total_fulfilled })}</>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="brand-card-mobile-arrow" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
      </Link>
    );
  }

  return (
    <Link href={`/brands/${brand.id}`} style={{ textDecoration: 'none' }}>
      <div className="brand-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-logo-wrap">
            <BrandAvatar
              name={brand.brand_name}
              logoUrl={brand.logo_url}
              size={52}
              radius={10}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-name">{brand.brand_name}</div>
            {brand.owner_name && <div className="brand-owner-name">{brand.owner_name}</div>}
          </div>
        </div>
        {brand.verification_tier && (
          <div onClick={e => e.preventDefault()}>
            <VerifiedBadge tier={brand.verification_tier as 'premium' | 'verified' | 'new'} size="sm" />
          </div>
        )}
        {brand.avg_rating && brand.avg_rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <StarDisplay rating={brand.avg_rating} size={12} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{brand.avg_rating.toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)' }}>({brand.total_reviews})</span>
          </div>
        )}
        <div className="brand-description">{brand.description}</div>
        {brand.trust && (
          <TrustScore 
            data={{ 
              response_rate: brand.trust.response_rate ?? 0, 
              completion_rate: 100, 
              avg_response_hours: 0, 
              total_fulfilled: brand.trust.total_fulfilled ?? 0, 
              member_since: brand.trust.member_since, 
              avg_rating: brand.avg_rating 
            }} 
            compact 
          />
        )}
        <div className="brand-footer">
          <span className="brand-tag">
            🛍️ {productCountLabel(brand.product_count ?? 0)}
          </span>
          <span className="brand-cta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {t('brandCard.viewCatalog')}
            {isRTL ? <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> : <ChevronRight size={13} />}
          </span>
        </div>
      </div>
    </Link>
  );
}
