'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Clock, Mail, LogOut, CheckCircle, Store } from 'lucide-react';

export default function PendingPage() {
  const [user, setUser] = useState<{ name: string; email: string; company_name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      if (d.user.verification_status !== 'pending') { router.push('/brand/dashboard'); return; }
      setUser(d.user);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="page-root">
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
        <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '0 24px' }}>
          {/* Central card */}
          <div className="card fade-up" style={{ textAlign: 'center', padding: '48px 40px' }}>
            {/* Animated icon */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'var(--pending-bg)',
              border: '2px solid var(--pending-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Clock size={32} style={{ color: 'var(--warning)' }}/>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Application Under Review
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px' }}>
              Thank you for registering <strong>{user?.company_name}</strong>. Our team is reviewing your brand application. This typically takes 1–2 business days.
            </p>

            {/* Steps */}
            <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 14 }}>What happens next</div>
              {[
                { icon: CheckCircle, color: 'var(--success)', bg: 'var(--approved-bg)', label: 'Application submitted', done: true },
                { icon: Clock, color: 'var(--warning)', bg: 'var(--pending-bg)', label: 'Admin reviews your brand profile', done: false },
                { icon: Mail, color: 'var(--blue)', bg: 'var(--blue-light)', label: 'You receive an approval email', done: false },
                { icon: Store, color: 'var(--navy)', bg: 'var(--bg-navy-soft)', label: 'Your brand goes live on the marketplace', done: false },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <step.icon size={15} style={{ color: step.color }}/>
                  </div>
                  <span style={{ fontSize: 13, color: step.done ? 'var(--success)' : 'var(--text-secondary)', fontWeight: step.done ? 600 : 400 }}>
                    {step.label}
                    {step.done && ' ✓'}
                  </span>
                </div>
              ))}
            </div>

            {/* Contact info */}
            {user?.email && (
              <div style={{ background: 'var(--blue-light)', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Mail size={13}/>
                  Confirmation sent to <strong>{user.email}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={handleLogout}>
                <LogOut size={14}/> Sign Out
              </button>
              <button className="btn btn-ghost" onClick={() => window.location.reload()}>
                Check Status
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@b2bhub.kw" style={{ color: 'var(--blue)' }}>support@b2bhub.kw</a>
          </p>
        </div>
      </div>
    </div>
  );
}
