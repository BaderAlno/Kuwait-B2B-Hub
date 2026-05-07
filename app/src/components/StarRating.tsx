'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarDisplayProps {
  rating: number;
  max?: number;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function StarDisplay({ rating, max = 5, size = 16, activeColor = '#F59E0B', inactiveColor = '#E5E7EB' }: StarDisplayProps) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.floor(rating) ? activeColor : 'none'}
          color={i < Math.floor(rating) ? activeColor : inactiveColor}
        />
      ))}
    </div>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (val: number) => void;
  size?: number;
}

export function StarPicker({ value, onChange, size = 32 }: StarPickerProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: 'inline-flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.1s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Star
            size={size}
            fill={star <= (hovered || value) ? '#F59E0B' : 'white'}
            color={star <= (hovered || value) ? '#F59E0B' : '#D1D5DB'}
            style={{ transition: 'color 0.2s, fill 0.2s' }}
          />
        </button>
      ))}
    </div>
  );
}
