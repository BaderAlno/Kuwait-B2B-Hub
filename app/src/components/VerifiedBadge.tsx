'use client';
import { useState } from 'react';
import { Star, Gem, Info, X } from 'lucide-react';

type VerificationTier = 'premium' | 'verified' | 'new';

interface Props {
  tier: VerificationTier;
  showModal?: boolean;
  size?: 'sm' | 'md';
}

const TIER_CONFIG = {
  premium: {
    label: 'Premium Verified',
    icon: Gem,
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#FCD34D',
    description: 'This status is for high-volume brands with 50+ completed orders on Kuwait B2B Hub and a manually verified track record of operational excellence.',
  },
  verified: {
    label: 'Verified Business',
    icon: ShieldCheck,
    bg: '#DBEAFE',
    color: '#1E40AF',
    border: '#93C5FD',
    description: 'The standard verification for businesses that have submitted all required documentation and have been approved by our audit team.',
  },
  new: {
    label: 'New Supplier',
    icon: Info,
    bg: '#F3F4F6',
    color: '#6B7280',
    border: '#D1D5DB',
    description: 'This supplier recently joined the platform and is in their initial probation period (under 10 orders). Basic documentation has been provided.',
  },
};

export default function VerifiedBadge({ tier, showModal = true, size = 'md' }: Props) {
  const [open, setOpen] = useState(false);
  const config = TIER_CONFIG[tier] || TIER_CONFIG.new;
  const Icon = config.icon;

  return (
    <>
      <button
        onClick={showModal ? (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); } : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: size === 'sm' ? 3 : 4,
          padding: size === 'sm' ? '2px 6px' : '3px 8px',
          background: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: 20,
          cursor: showModal ? 'pointer' : 'default',
          transition: 'transform 0.1s ease',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={(e) => showModal && (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseLeave={(e) => showModal && (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Icon size={size === 'sm' ? 8 : 10} style={{ color: config.color, flexShrink: 0 }} />
        <span style={{ fontSize: size === 'sm' ? 10 : 12, fontWeight: 600, color: config.color, whiteSpace: 'nowrap', lineHeight: 1 }}>
          {config.label}
        </span>
      </button>

      {/* Verification Explanation Modal */}
      {open && (
        <div 
          className="modal-overlay fade-in"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div 
            className="modal-content slide-up"
            style={{ background: 'white', borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '100%', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
            >
              <X size={20} />
            </button>

            <div style={{ width: 56, height: 56, borderRadius: 14, background: config.bg, border: `1px solid ${config.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Icon size={28} style={{ color: config.color }} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              What does Verified mean?
            </h3>
            
            <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, marginBottom: 24 }}>
              {config.description}
            </p>

            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: 12 }}>Our Verification Process Includes:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Commercial Registration (CR) check',
                  'Address & physical site validation',
                  'Owner identity (Civil ID) verification',
                  'Banking & payout validation'
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={14} style={{ color: '#059669' }} /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                Last verified: Jan 2025
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 24px', fontSize: 13 }}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShieldCheck({ size, style }: { size: number, style?: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
