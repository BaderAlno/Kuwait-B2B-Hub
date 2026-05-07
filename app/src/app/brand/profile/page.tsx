'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { Save, ExternalLink, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import BrandSidebar from '@/components/BrandSidebar';
import ImageUrlInput from '@/components/ImageUrlInput';

interface Brand {
  id: string; brand_name: string; description: string; logo_url: string; status: string;
  whatsapp_number?: string; business_hours?: string; auto_reply_message?: string; whatsapp_clicks?: number;
}

const GCC_CODES = [
  { code: '+965', label: '🇰🇼 +965', country: 'Kuwait' },
  { code: '+966', label: '🇸🇦 +966', country: 'Saudi' },
  { code: '+971', label: '🇦🇪 +971', country: 'UAE' },
  { code: '+973', label: '🇧🇭 +973', country: 'Bahrain' },
];

export default function BrandProfilePage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    brand_name: '', description: '', logo_url: '',
    whatsapp_number: '', business_hours: '', auto_reply_message: '',
  });
  const [logoStatus, setLogoStatus] = useState<'empty' | 'loading' | 'valid' | 'error'>('empty');
  const [dialCode, setDialCode] = useState('+965');
  const t = useTranslations('brandProfileSettings');
  const locale = useLocale();

  useEffect(() => {
    fetch('/api/brands?mine=true').then(r => r.json()).then(async d => {
      const b = d.brands?.[0] || null;
      setBrand(b);
      if (b?.id) {
        const pRes = await fetch(`/api/products?brand_id=${b.id}`);
        const pData = await pRes.json();
        setProductCount((pData.products || []).length);
      }
      if (b) {
        // Separate dial code from stored number
        let num = b.whatsapp_number || '';
        let dc = '+965';
        for (const g of GCC_CODES) {
          const digits = g.code.replace('+', '');
          if (num.startsWith(digits)) { dc = g.code; num = num.slice(digits.length); break; }
        }
        setDialCode(dc);
        setForm({
          brand_name: b.brand_name, description: b.description, logo_url: b.logo_url,
          whatsapp_number: num, business_hours: b.business_hours || '', auto_reply_message: b.auto_reply_message || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault(); setSaving(true);
    const fullWa = form.whatsapp_number ? `${dialCode.replace('+', '')}${form.whatsapp_number.replace(/\D/g, '')}` : '';
    await fetch('/api/brands', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, whatsapp_number: fullWa }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000); setSaving(false);
  };

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <BrandSidebar productCount={productCount} />

        <main className="dash-main fade-up">
          <div className="page-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <div>
              <h1>{t('title')}</h1>
              <p>{t('subtitle')}</p>
            </div>
            {brand && <StatusBadge status={brand.status}/>}
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }}/>
          ) : (
            <div className="grid-2-desktop" style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {saved && (
                  <div className="alert alert-success fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <Save size={16} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/> {t('saved')}
                  </div>
                )}

                {brand?.status === 'pending' && (
                  <div className="alert alert-warning mb-20" style={{ display: 'flex', gap: 12, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2, [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/>
                    <div>
                      <strong>{t('awaitingVerification.title')}</strong>
                      <p style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>{t('awaitingVerification.subtitle')}</p>
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}><h2>{t('editInfo.title')}</h2></div>
                  <form onSubmit={handleSave}>
                    <div className="form-group" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <label className="form-label">{t('editInfo.brandName')}</label>
                      <input className="form-input form-input-lg" value={form.brand_name}
                        onChange={e => setForm({...form, brand_name: e.target.value})} required 
                        placeholder={t('editInfo.brandNamePlaceholder')} />
                    </div>
                    <div className="form-group" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <label className="form-label">{t('editInfo.description')}</label>
                      <textarea className="form-input" style={{ minHeight: 140, fontSize: 14, lineHeight: 1.6 }}
                        placeholder={t('editInfo.descriptionPlaceholder')}
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <ImageUrlInput
                        value={form.logo_url}
                        onChange={url => setForm({...form, logo_url: url})}
                        onStatusChange={setLogoStatus}
                        label={t('editInfo.logoUrl')}
                        hint={t('editInfo.logoHint')}
                        locale={locale as 'en' | 'ar'}
                        previewWidth={64}
                        previewHeight={64}
                      />
                    </div>

                    <div style={{ margin: '20px 0 8px', padding: '14px 16px', background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#15803D' }}>{t('whatsappSection.title')}</span>
                        {brand?.whatsapp_clicks !== undefined && brand.whatsapp_clicks > 0 && (
                          <span style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 'auto', fontSize: 12, color: '#15803D', fontWeight: 600 }}>
                            {t('whatsappSection.clicks', { count: brand.whatsapp_clicks })}
                          </span>
                        )}
                      </div>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>{t('whatsappSection.number')}</label>
                        <div style={{ display: 'flex', gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                          <select
                            value={dialCode}
                            onChange={e => setDialCode(e.target.value)}
                            className="form-input"
                            style={{ width: 130, flexShrink: 0, fontSize: 13 }}
                          >
                            {GCC_CODES.map(g => (
                              <option key={g.code} value={g.code}>{g.label} {g.country}</option>
                            ))}
                          </select>
                          <input className="form-input" placeholder={t('whatsappSection.numberPlaceholder')} value={form.whatsapp_number}
                            onChange={e => setForm({...form, whatsapp_number: e.target.value})}
                            style={{ flex: 1, textAlign: 'left' }} />
                        </div>
                        <span className="form-hint">{t('whatsappSection.numberHint')}</span>
                      </div>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>{t('whatsappSection.hours')}</label>
                        <input className="form-input" placeholder={t('whatsappSection.hoursPlaceholder')}
                          value={form.business_hours} onChange={e => setForm({...form, business_hours: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>{t('whatsappSection.autoReply')}</label>
                        <input className="form-input" placeholder={t('whatsappSection.autoReplyPlaceholder')}
                          value={form.auto_reply_message} onChange={e => setForm({...form, auto_reply_message: e.target.value})} />
                        <span className="form-hint">{t('whatsappSection.autoReplyHint')}</span>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 16, height: 50 }}
                      disabled={saving || logoStatus === 'loading' || (logoStatus === 'error' && !!form.logo_url)}>
                      {(saving || logoStatus === 'loading')
                        ? <><span className="spinner" style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 8 }}/> {logoStatus === 'loading' ? (locale === 'ar' ? 'جاري التحقق...' : 'Checking…') : t('editInfo.saving')}</>
                        : <><Save size={18} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 8 }}/> {t('editInfo.saveButton')}</>}
                    </button>
                  </form>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card" style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border)' }}>
                  <div className="card-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em',color: 'var(--text-muted)' }}>{t('preview.title')}</h2>
                  </div>
                  <div style={{ background: 'var(--bg-white)', borderRadius: 12, border: '1px solid var(--border)', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', background: 'var(--bg-page)', border: '1px solid var(--border)', flexShrink: 0 }}>
                          {form.logo_url ? <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 20 }}>
                              {form.brand_name.charAt(0) || 'B'}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>{form.brand_name || t('preview.brandName')}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600, marginTop: 2, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                            <div style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%' }}/> {t('preview.verified')}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: 100, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        {form.description || t('preview.placeholderDescription')}
                      </div>
                    </div>
                    <div style={{ padding: '12px 20px', background: 'var(--bg-page)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('preview.products', { count: productCount })}</span>
                      <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        {t('preview.viewCatalog')} <ExternalLink size={12}/>
                      </span>
                    </div>
                  </div>

                  {brand?.status === 'approved' && (
                    <Link href={`/brands/${brand?.id}`} className="btn btn-ghost btn-full" style={{ marginTop: 12, background: 'var(--bg-white)', gap: 8 }} target="_blank">
                      <ExternalLink size={15}/> {t('preview.viewLive')}
                    </Link>
                  )}
                </div>

                <div className="card" style={{ background: 'var(--bg-navy-soft)', border: '1px solid var(--navy-soft)' }}>
                  <div style={{ display: 'flex', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <div style={{ color: 'var(--navy)', flexShrink: 0 }}><AlertCircle size={20}/></div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t('rankingTip.title')}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {t('rankingTip.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
