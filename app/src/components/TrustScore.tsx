'use client';
import { Shield, Clock, CheckCircle2, ShoppingBag, Calendar } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';

interface TrustData {
  response_rate: number;
  completion_rate: number;
  avg_response_hours: number;
  total_fulfilled: number;
  member_since?: string;
  avg_rating?: number;
}

interface Props {
  data: TrustData;
  compact?: boolean;
}

export default function TrustScore({ data, compact = false }: Props) {
  const t = useTranslations('trust');
  const locale = useLocale() as 'en' | 'ar';

  const getAvgResponseLabel = () => {
    if (data.avg_response_hours <= 1) return t('within1h');
    if (data.avg_response_hours <= 4) return t('within4h');
    return t('within24h');
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: '#F59E0B' }}>
          ⭐ {data.avg_rating?.toFixed(1) || '4.5'}
        </span>
        <span>·</span>
        <span>{data.total_fulfilled} {t('completedOrders').toLowerCase()}</span>
        <span>·</span>
        <span>{data.response_rate}% {t('responseRate').toLowerCase()}</span>
      </div>
    );
  }

  const getResponseColor = (rate: number) => {
    if (rate >= 90) return '#10B981';
    if (rate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const memberSinceFormatted = data.member_since
    ? formatDate(data.member_since, locale)
    : '—';

  const stats = [
    { label: t('responseRate'),     value: `${data.response_rate}%`,  icon: Clock,        color: getResponseColor(data.response_rate), bar: true },
    { label: t('completionRate'),   value: `${data.completion_rate}%`, icon: CheckCircle2, color: '#2563EB' },
    { label: t('avgResponseTime'),  value: getAvgResponseLabel(),      icon: Clock,        color: '#4B5563' },
    { label: t('completedOrders'), value: data.total_fulfilled,        icon: ShoppingBag,  color: '#4B5563' },
    { label: t('memberSinceLabel'), value: memberSinceFormatted,       icon: Calendar,     color: '#4B5563' },
    { label: t('platformStatus'),   value: t('active'),                icon: Shield,       color: '#10B981' },
  ];

  return (
    <div className="card" style={{ padding: '24px 28px', border: '1px solid #E5E7EB', borderRadius: 16 }}>
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px 40px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
              <stat.icon size={14} style={{ color: stat.color }} />
              {stat.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{stat.value}</div>
            </div>
            {stat.bar && (
              <div style={{ height: 4, width: '100%', background: '#F3F4F6', borderRadius: 10, overflow: 'hidden', marginTop: 2 }}>
                <div style={{ height: '100%', width: `${data.response_rate}%`, background: stat.color, borderRadius: 10 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: repeat(2, 1fr) !important; gap: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}
