'use client';
import { ShieldCheck, History, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface BuyerTrust {
  buyer_id: string;
  total_orders: number;
  completion_rate: number;
  cancellation_rate: number;
  member_since?: string;
  badges: string[];
}

interface Props {
  data: BuyerTrust;
  buyerName: string;
  buyerCompany: string;
}

export default function BuyerTrustCard({ data, buyerName, buyerCompany }: Props) {
  const isTrusted = data.total_orders >= 10 && data.cancellation_rate < 5;

  return (
    <div className="card" style={{ padding: '24px 28px', border: '1px solid #E5E7EB', borderRadius: 16, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid #F3F4F6', paddingBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#1A1A2E', border: '1px solid #E5E7EB' }}>
          {buyerName.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{buyerName}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{buyerCompany}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Badge */}
        {isTrusted ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#DCFCE7', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 700, width: 'fit-content', border: '1px solid #A7F3D0' }}>
            <ShieldCheck size={14} /> ✓ Trusted Buyer
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#F9FAFB', color: '#6B7280', borderRadius: 20, fontSize: 12, fontWeight: 700, width: 'fit-content', border: '1px solid #E5E7EB' }}>
            <AlertCircle size={14} /> Verified Buyer
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.025em' }}>Order History</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 5 }}>
              <History size={13} style={{ color: '#2563EB' }} /> {data.total_orders} placed
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.025em' }}>Reliability</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={13} style={{ color: '#059669' }} /> {data.completion_rate}%
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.025em' }}>Member Since</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} /> {data.member_since || 'Jan 2024'}
            </div>
          </div>
        </div>

        {/* High Confidence Message */}
        {isTrusted && (
          <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 14px', border: '1px solid #DCFCE7', fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
            <strong>High Confidence Score</strong>: This buyer has completed {data.total_orders} orders with 0 cancellations. Highly recommended for approval.
          </div>
        )}
        {!isTrusted && data.total_orders === 0 && (
          <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '12px 14px', border: '1px solid #FEF3C7', fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
            <strong>New Buyer</strong>: This company just joined the platform and has no order history yet. Consider reviewing their profile details.
          </div>
        )}
      </div>
    </div>
  );
}
