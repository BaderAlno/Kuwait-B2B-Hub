'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useTranslations, useLocale } from 'next-intl';

import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Fetch profile to check role and status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setError('Could not fetch user profile.');
        return;
      }

      const { role, verification_status } = profile;
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'brand_owner') router.push(verification_status === 'pending' ? '/pending' : '/brand/dashboard');
      else router.push('/marketplace');
    } catch { 
      setError('Network error. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const demos = [
    { label: 'Admin',       email: 'admin@b2bhub.kw',          pass: 'Admin@123456', role: 'Administrator' },
    { label: 'Brand Owner', email: 'khalid@kuwaitfashion.com',  pass: 'Brand@123',    role: 'Kuwait Fashion House' },
    { label: 'Buyer',       email: 'mohammed@retailco.kw',      pass: 'Buyer@123',    role: 'RetailCo Kuwait' },
  ];

  return (
    <>
      <Navbar />
      <div className="auth-container" style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40 }}>
        <div className="auth-card" style={{ width: '100%', maxWidth: 1100, display: 'grid', gridTemplateColumns: '1fr 440px', gap: 0, boxShadow: 'var(--shadow-lg)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Left panel (Hidden on mobile) */}
          <div className="auth-left" style={{ background: 'var(--navy)', padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(37,99,235,0.25), transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} color="white" />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white' }}>B2BHub Kuwait</span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: -0.5 }}>
                {t('title')}
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
                {t('subtitle')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['✅', '200+ Verified Brand Suppliers'],
                  ['📦', 'Bulk Ordering with Tiered Pricing'],
                  ['🔒', 'Secure B2B Transactions'],
                  ['💬', 'Direct Brand Communication'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel (Full width on mobile) */}
          <div className="auth-right" style={{ background: 'var(--bg-white)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mobile-only" style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={16} color="white" />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>B2BHub</span>
              </div>
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t('title')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
              {t('noAccount')} <Link href="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>{t('registerLink')}</Link>
            </p>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t('workEmail')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', [locale === 'ar' ? 'right' : 'left']: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="email" type="email" className="form-input" style={{ [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: 40 }}
                    placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', [locale === 'ar' ? 'right' : 'left']: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="password" type="password" className="form-input" style={{ [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: 40 }}
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
              <button id="login-btn" type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }} disabled={loading}>
                {loading ? <><span className="spinner" /> {t('loading')}…</> : <>{t('button')} {locale === 'ar' ? <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> : <ArrowRight size={16} />}</>}
              </button>
            </form>

            <div className="divider-label" style={{ marginTop: 24 }}><span>{t('demoLabel')}</span></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {demos.map(d => (
                <button key={d.email} className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', gap: 12, height: 52 }}
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                    {d.label.charAt(0)}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</div>
                    <div className="desktop-only" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.role}</div>
                  </div>
                  <span className="desktop-only" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
