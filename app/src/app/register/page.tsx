'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Building2, ShoppingBag, ArrowRight, AlertCircle, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useTranslations, useLocale } from 'next-intl';

import { createClient } from '@/utils/supabase/client';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'brand_owner' | 'buyer' | ''>('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', company_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); 
    setError('');
    
    const supabase = createClient();
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            company_name: role === 'brand_owner' ? form.company_name : null,
            role: role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.push(role === 'brand_owner' ? '/pending' : '/marketplace');
    } catch { 
      setError('Network error. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container" style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 88, paddingBottom: 40 }}>
        <div className="auth-card fade-up" style={{ maxWidth: 520, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>B2BHub Kuwait</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('title')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {t('alreadyAccount')} <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>{t('loginLink')}</Link>
          </p>

          {/* Step Bar */}
          <div className="step-bar" style={{ marginBottom: 28 }}>
            <div className="step-item">
              <div className={`step-circle ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                {step > 1 ? <Check size={12} /> : '1'}
              </div>
              <span className={`step-label ${step >= 1 ? 'active' : ''}`}>{t('steps.role')}</span>
            </div>
            <div className={`step-connector ${step > 1 ? 'done' : ''}`} />
            <div className="step-item">
              <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              <span className={`step-label ${step >= 2 ? 'active' : ''}`}>{t('steps.details')}</span>
            </div>
          </div>

          {error && <div className="alert alert-danger"><AlertCircle size={15}/> {error}</div>}

          {step === 1 && (
            <>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {t('usagePrompt')}
              </p>
              <div className="role-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className={`role-card ${role === 'brand_owner' ? 'selected' : ''}`}
                  id="role-brand-owner" onClick={() => setRole('brand_owner')}
                  style={{ height: '100%', minHeight: 140 }}>
                  <div className="role-card-icon"><Building2 size={18}/></div>
                  <div className="role-card-title">{t('roles.brand.title')}</div>
                  <div className="role-card-desc">{t('roles.brand.desc')}</div>
                </div>
                <div className={`role-card ${role === 'buyer' ? 'selected' : ''}`}
                  id="role-buyer" onClick={() => setRole('buyer')}
                  style={{ height: '100%', minHeight: 140 }}>
                  <div className="role-card-icon"><ShoppingBag size={18}/></div>
                  <div className="role-card-title">{t('roles.buyer.title')}</div>
                  <div className="role-card-desc">{t('roles.buyer.desc')}</div>
                </div>
              </div>
              {role === 'brand_owner' && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  <AlertCircle size={15}/> {t('roles.brand.warning')}
                </div>
              )}
              <button id="step1-next" className="btn btn-primary btn-full btn-lg"
                disabled={!role} onClick={() => setStep(2)}>
                {tCommon('next')} {locale === 'ar' ? <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> : <ArrowRight size={15} />}
              </button>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
               <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="register-name">{t('fullName')}</label>
                  <input id="register-name" className="form-input" placeholder={t('fullNamePlaceholder')} value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                 {role === 'brand_owner' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="register-company">{t('companyName')}</label>
                    <input id="register-company" className="form-input" placeholder={t('companyPlaceholder')} value={form.company_name}
                      onChange={e => setForm({...form, company_name: e.target.value})} required />
                  </div>
                )}
              </div>
               <div className="form-group">
                <label className="form-label" htmlFor="register-email">{t('workEmail')}</label>
                <input id="register-email" type="email" className="form-input" placeholder={t('emailPlaceholder')} value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} required inputMode="email" />
              </div>
               <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="register-password">{t('password')}</label>
                  <input id="register-password" type="password" className="form-input" placeholder={t('passwordPlaceholder')} value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
                 <div className="form-group">
                  <label className="form-label" htmlFor="register-confirm">{t('confirmPassword')}</label>
                  <input id="register-confirm" type="password" className="form-input" placeholder={t('confirmPlaceholder')} value={form.confirm_password}
                    onChange={e => setForm({...form, confirm_password: e.target.value})} required />
                </div>
              </div>
               <div style={{ display: 'flex', gap: 12, marginTop: 24, flexDirection: 'column' }}>
                <button id="register-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner"/> {t('loadingAccount')}…</> : <>{t('button')} {locale === 'ar' ? <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> : <ArrowRight size={15} />}</>}
                </button>
                <button type="button" className="btn btn-ghost btn-full" onClick={() => setStep(1)}>{tCommon('back')}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
