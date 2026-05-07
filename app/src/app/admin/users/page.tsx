'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/i18n';
import { LayoutDashboard, Tags, Users, Package, Search, Mail, Building2, Calendar } from 'lucide-react';

interface User {
  id: string; name: string; email: string; role: string;
  company_name: string; verification_status: string; created_at: string;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    (filter === 'all' || u.role === filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.company_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <aside className="dash-sidebar desktop-only">
          <span className="dash-sidebar-label">{t('sidebar.panel')}</span>
          <Link href="/admin/dashboard" className="sidebar-link"><LayoutDashboard size={16}/> {t('sidebar.dashboard')}</Link>
          <Link href="/admin/brands"    className="sidebar-link"><Tags size={16}/> {t('sidebar.brands')}</Link>
          <Link href="/admin/users"     className="sidebar-link active"><Users size={16}/> {t('sidebar.users')}</Link>
          <Link href="/admin/orders"    className="sidebar-link"><Package size={16}/> {t('sidebar.orders')}</Link>
        </aside>

        <main className="dash-main fade-up">
          <div className="page-header" style={{ marginBottom: 20, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <h1>{locale === 'ar' ? 'إدارة الهويات' : 'Identity Management'}</h1>
              <p>{locale === 'ar' ? `التحكم في الوصول والتحقق من ${users.length} مستخدم` : `Control access and verification across ${users.length} users`}</p>
            </div>
          </div>

          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
              <div className="filter-tabs" style={{ minWidth: 'max-content', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                {[['all', locale === 'ar' ? 'جميع المستخدمين' : 'All Users'], ['admin', locale === 'ar' ? 'المسؤولون' : 'Admins'], ['brand_owner', locale === 'ar' ? 'العلامات' : 'Brands'], ['buyer', locale === 'ar' ? 'المشترون' : 'Buyers']].map(([val, label]) => (
                  <button key={val} className={`filter-tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
                    {label}
                    <span style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 6, fontSize: 11, opacity: 0.7 }}>({val === 'all' ? users.length : users.filter(u => u.role === val).length})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="search-bar" style={{ width: '100%', maxWidth: '100%', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <Search size={16}/>
              <input placeholder={locale === 'ar' ? 'ابحث بالاسم أو البريد أو الشركة...' : 'Search name, email, or company…'} value={search} onChange={e => setSearch(e.target.value)} style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}/>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={28}/></div>
                <h3>{locale === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}</h3>
                <p>{locale === 'ar' ? 'عدّل البحث أو الفلتر لرؤية المزيد.' : 'Adjust your search/filter to see more users.'}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card List */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(user => (
                  <div key={user.id} className="card fade-up" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <div style={{ display: 'flex', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--navy)', border: '2px solid var(--bg-white)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                             <Building2 size={11}/> {user.company_name}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={user.role}/>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid var(--bg-page)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)' }}/> {user.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }}/>
                        {locale === 'ar' ? 'انضم في' : 'Joined'} {formatDate(user.created_at, locale as any)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="desktop-only" style={{ overflowX: 'auto', borderRadius: 8 }}>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'الهوية' : 'Identity'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'المؤسسة' : 'Organization'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'الدور' : 'Role'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'التحقق' : 'Verification'}</th>
                      <th className="text-right">{locale === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--navy)', flexShrink: 0 }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: locale === 'ar' ? 'right' : 'left' }}>{user.company_name}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: locale === 'ar' ? 'right' : 'left' }}>{user.email}</td>
                        <td><StatusBadge status={user.role}/></td>
                        <td><StatusBadge status={user.verification_status}/></td>
                        <td className="text-right" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(user.created_at, locale as any)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
