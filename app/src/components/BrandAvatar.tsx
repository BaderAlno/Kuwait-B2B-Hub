'use client';
import { useState } from 'react';

const PALETTE = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#DCFCE7', text: '#166534' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FFEDD5', text: '#9A3412' },
  { bg: '#F0FDF4', text: '#14532D' },
  { bg: '#FFF7ED', text: '#7C2D12' },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function initials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface BrandAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
  radius?: number;
}

export default function BrandAvatar({ name, logoUrl, size = 48, radius = 10 }: BrandAvatarProps) {
  const [err, setErr]     = useState(false);
  const [loaded, setLoaded] = useState(false);
  const color = hashColor(name);
  const showImg = !!logoUrl && !err;
  const fs = size <= 36 ? 11 : size <= 48 ? 14 : size <= 64 ? 16 : 20;

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: color.bg,
      border: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden', position: 'relative',
    }}>
      {/* Initials — always rendered, hidden when image loads */}
      <span style={{
        fontSize: fs, fontWeight: 700, color: color.text,
        letterSpacing: '0.03em', userSelect: 'none',
        position: 'absolute',
        opacity: showImg && loaded ? 0 : 1,
        transition: 'opacity 0.2s',
      }}>
        {initials(name)}
      </span>

      {showImg && (
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            position: 'absolute', inset: 0,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.25s',
          }}
        />
      )}
    </div>
  );
}
