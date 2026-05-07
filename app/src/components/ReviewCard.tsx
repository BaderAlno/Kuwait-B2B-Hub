'use client';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import { StarDisplay } from './StarRating';
import { Flag, MessageSquare, ShieldCheck, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/i18n';

interface Review {
  id: string;
  rating: number;
  content: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_company?: string;
  anonymous: boolean;
  flagged: boolean;
  brand_reply: string | null;
  created_at: string;
  status?: 'active' | 'removed';
}

interface Props {
  review: Review;
  isOwner?: boolean;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function ReviewCard({ review, isOwner = false, isAdmin = false, onRefresh }: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const locale = useLocale() as 'en' | 'ar';

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    await fetch(`/api/reviews/${review.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText }),
    });
    setLoading(false);
    setReplyOpen(false);
    onRefresh?.();
  };

  const handleModerate = async (action: 'keep' | 'remove') => {
    setLoading(true);
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    onRefresh?.();
  };

  if (review.status === 'removed') {
    return (
      <div style={{ padding: '16px 20px', border: '1px solid #F3F4F6', borderRadius: 12, background: '#F9FAFB', fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
        <XCircle size={14} /> This review was removed for violating community guidelines.
      </div>
    );
  }

  const initials = review.anonymous ? 'A' : (review.buyer_name?.charAt(0) || 'U');

  return (
    <div style={{ padding: '24px 28px', border: '1px solid #E5E7EB', borderRadius: 16, background: 'white', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Review Header */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: review.anonymous ? '#F3F4F6' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: review.anonymous ? '#9CA3AF' : '#2563EB', flexShrink: 0, border: '1px solid #E5E7EB' }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{review.anonymous ? 'Anonymous' : (review.buyer_name || 'Verified Buyer')}</span>
                {!review.anonymous && review.buyer_company && (
                   <span style={{ fontSize: 13, color: '#6B7280' }}>· {review.buyer_company}</span>
                )}
              </div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                <StarDisplay rating={review.rating} size={14} />
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(review.created_at, locale)}</span>
              </div>
            </div>
            {(isAdmin || isOwner) && !review.flagged && (
              <button 
                 onClick={() => handleModerate('keep')} // Placeholder for flagging
                 style={{ border: 'none', background: 'none', padding: 4, color: '#9CA3AF', cursor: 'pointer' }}
                 title="Flag review"
              >
                <Flag size={14} />
              </button>
            )}
            {isAdmin && review.flagged && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleModerate('keep')} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: '#059669', fontSize: 11 }}><CheckCircle size={13} /> Keep</button>
                <button onClick={() => handleModerate('remove')} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: '#DC4444', fontSize: 11 }}><Trash2 size={13} /> Remove</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
        {review.content}
      </p>

      {/* Brand Reply */}
      {review.brand_reply && (
        <div style={{ marginLeft: 12, padding: '16px 20px', background: '#F8F7F4', borderLeft: '3px solid #1A1A2E', borderRadius: '4px 12px 12px 4px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.025em' }}>Response from Brand:</span>
          </div>
          <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>{review.brand_reply}</p>
        </div>
      )}

      {/* Action: Reply */}
      {isOwner && !review.brand_reply && (
        <button 
          onClick={() => setReplyOpen(!replyOpen)} 
          style={{ width: 'fit-content', border: 'none', background: 'none', color: '#2563EB', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          <MessageSquare size={14} /> {replyOpen ? 'Cancel' : 'Reply to this review'}
        </button>
      )}

      {replyOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <textarea 
            placeholder="Share your response..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 300))}
            style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, fontSize: 13, minHeight: 80, fontFamily: 'inherit' }}
          />
          <button 
            className="btn btn-primary btn-sm" 
            style={{ width: 'fit-content', alignSelf: 'flex-end', padding: '10px 24px' }}
            disabled={loading}
            onClick={handleReply}
          >
            {loading ? <span className="spinner" /> : 'Post Reply'}
          </button>
        </div>
      )}
    </div>
  );
}
