'use client';
import { useState } from 'react';
import { StarPicker } from './StarRating';
import { X, Send } from 'lucide-react';

interface Props {
  brandId: string;
  brandName: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function ReviewModal({ brandId, brandName, onSuccess, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: brandId, rating, content, anonymous }),
    });
    setLoading(false);
    if (res.ok) {
      onSuccess?.();
    } else {
      setError('Failed to submit review. Please try again.');
    }
  };

  return (
    <div 
      className="modal-overlay fade-in"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div 
        className="modal-content slide-up"
        style={{ background: 'white', borderRadius: 20, padding: '40px 32px', maxWidth: 460, width: '100%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
        >
          <X size={22} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            How was your experience?
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            Rating for <strong>{brandName}</strong>
          </p>
        </div>

        {/* Rating Picker */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <StarPicker value={rating} onChange={(val) => { setRating(val); setError(''); }} size={36} />
        </div>

        {/* content Area */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Share your experience (optional)
          </label>
          <textarea 
            placeholder="What was the quality of products, shipping speed, and communication like?"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 300))}
            style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, fontSize: 14, minHeight: 120, fontFamily: 'inherit', resize: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: content.length >= 300 ? '#DC4444' : '#9CA3AF' }}>{content.length}/300 chars</span>
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: '#F9FAFB', borderRadius: 12, marginBottom: 32, cursor: 'pointer' }} onClick={() => setAnonymous(!anonymous)}>
          <input 
            type="checkbox" 
            checked={anonymous} 
            onChange={() => {}} // Controlled via parent div click
            style={{ width: 16, height: 16, cursor: 'pointer' }} 
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Post review anonymously</span>
        </div>

        {error && (
          <div style={{ color: '#DC4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
             className="btn btn-ghost" 
             style={{ flex: 1, padding: '12px 0' }} 
             onClick={onClose}
             disabled={loading}
          >
            Cancel
          </button>
          <button 
             className="btn btn-primary" 
             style={{ flex: 2, padding: '12px 0', background: '#1A1A2E' }} 
             onClick={handleSubmit}
             disabled={loading}
          >
            {loading ? <span className="spinner" /> : <><Send size={15} style={{ marginRight: 8 }} /> Submit Review</>}
          </button>
        </div>
      </div>
    </div>
  );
}
