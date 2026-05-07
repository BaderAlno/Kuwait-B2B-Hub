'use client';
import { useEffect, useRef, useState } from 'react';

type ImageStatus = 'empty' | 'loading' | 'valid' | 'error';

interface ImageUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onStatusChange?: (status: ImageStatus) => void;
  label: string;
  hint?: string;
  previewWidth?: number;
  previewHeight?: number;
  locale?: 'en' | 'ar';
}

export default function ImageUrlInput({
  value,
  onChange,
  onStatusChange,
  label,
  hint,
  previewWidth = 64,
  previewHeight = 64,
  locale = 'en',
}: ImageUrlInputProps) {
  const [status, setStatus] = useState<ImageStatus>(value ? 'loading' : 'empty');
  const [previewUrl, setPreviewUrl] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateStatus = (s: ImageStatus) => {
    setStatus(s);
    onStatusChange?.(s);
  };

  useEffect(() => {
    if (!value.trim()) {
      updateStatus('empty');
      setPreviewUrl('');
      return;
    }
    updateStatus('loading');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewUrl(value);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const borderColor =
    status === 'valid' ? '#86EFAC' :
    status === 'error' ? '#FCA5A5' :
    'var(--border)';

  const isRTL = locale === 'ar';

  return (
    <div>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 600,
        color: 'var(--text-primary)', marginBottom: 8,
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {label}
      </label>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}>
        {/* Preview box */}
        <div style={{
          width: previewWidth, height: previewHeight,
          borderRadius: previewWidth === previewHeight ? 10 : 6,
          border: `1px solid ${borderColor}`,
          background: 'var(--bg-subtle)',
          flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
          position: 'relative',
        }}>
          {status === 'empty' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                {isRTL ? 'معاينة' : 'Preview'}
              </span>
            </div>
          )}

          {status === 'loading' && (
            <div style={{
              width: 20, height: 20,
              border: '2px solid var(--border)',
              borderTopColor: '#2563EB',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}

          {(status === 'loading' || status === 'valid') && previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              onLoad={() => updateStatus('valid')}
              onError={() => updateStatus('error')}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: status === 'valid' ? 'block' : 'none',
                position: 'absolute', inset: 0,
              }}
            />
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="13"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 9, color: '#DC2626', textAlign: 'center', lineHeight: 1.2 }}>
                {isRTL ? 'خطأ' : 'Invalid'}
              </span>
            </div>
          )}

          {status === 'valid' && (
            <div style={{
              position: 'absolute', bottom: 3, right: 3,
              width: 16, height: 16, borderRadius: '50%',
              background: '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6l3 3 5-5"/>
              </svg>
            </div>
          )}
        </div>

        {/* Input + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="url"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="https://example.com/image.png"
              dir="ltr"
              style={{
                width: '100%', height: 40, borderRadius: 8,
                border: `1px solid ${borderColor}`,
                padding: '0 36px 0 12px',
                fontSize: 13,
                background: 'var(--bg-white)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
                textOverflow: 'ellipsis',
                boxSizing: 'border-box',
              }}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 2,
                }}
              >
                ×
              </button>
            )}
          </div>

          <p style={{
            fontSize: 11, margin: '5px 0 0',
            textAlign: isRTL ? 'right' : 'left',
            color: status === 'valid' ? '#16A34A' : status === 'error' ? '#DC2626' : 'var(--text-muted)',
          }}>
            {status === 'empty' && (hint || (isRTL ? 'أدخل رابط صورة — PNG أو JPG · 400×400px' : 'Enter image URL — PNG or JPG · 400×400px recommended'))}
            {status === 'loading' && (isRTL ? 'جاري التحقق من الرابط...' : 'Checking URL…')}
            {status === 'valid' && (isRTL ? '✓ الصورة صالحة وجاهزة للحفظ' : '✓ Image loaded successfully')}
            {status === 'error' && (isRTL ? '✗ تعذّر تحميل الصورة — تحقق من الرابط' : '✗ Could not load image — check the URL')}
          </p>
        </div>
      </div>
    </div>
  );
}
