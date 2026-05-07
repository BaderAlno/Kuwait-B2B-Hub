'use client';
import { useTranslations } from 'next-intl';

export default function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('common');
  
  const statusLabels: Record<string, string> = {
    pending: t('pending'),
    approved: t('approved'),
    rejected: t('rejected'),
    completed: t('completed'),
    admin: 'Admin',
    brand_owner: 'Brand Owner',
    buyer: 'Buyer',
  };

  const cssMap: Record<string, string> = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    completed: 'badge-approved',
    admin: 'badge-admin',
    brand_owner: 'badge-brand_owner',
    buyer: 'badge-buyer',
  };

  const label = statusLabels[status] || status;
  const cls = `badge ${cssMap[status] || 'badge-pending'}`;

  return <span className={cls}>{label}</span>;
}
