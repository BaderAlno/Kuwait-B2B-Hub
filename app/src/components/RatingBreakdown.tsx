'use client';
import { StarDisplay } from './StarRating';

interface Props {
  avgRating: number;
  totalReviews: number;
  breakdown: Record<number, number>; // { 5: 12, 4: 8, ... }
}

export default function RatingBreakdown({ avgRating, totalReviews, breakdown }: Props) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap', padding: '16px 0' }}>
      {/* Overall Score */}
      <div style={{ textAlign: 'center', minWidth: 120 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
        <div style={{ marginTop: 8, marginBottom: 4 }}>
          <StarDisplay rating={avgRating} size={20} />
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>based on {totalReviews} reviews</div>
      </div>

      {/* Distribution Bars */}
      <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stars.map((star) => {
          const count = breakdown[star] || 0;
          const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          return (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, fontSize: 13, fontWeight: 700, color: '#4B5563', textAlign: 'right' }}>{star}★</div>
              <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div 
                  style={{ height: '100%', width: `${percentage}%`, background: '#F59E0B', borderRadius: 4, transition: 'width 0.4s ease' }} 
                />
              </div>
              <div style={{ width: 40, fontSize: 13, color: '#9CA3AF', textAlign: 'left' }}>{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
