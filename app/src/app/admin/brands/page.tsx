'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useTranslations, useLocale } from 'next-intl';
import { LayoutDashboard, Tags, Users, Package, Check, X, Search } from 'lucide-react';
import BrandAvatar from '@/components/BrandAvatar';

interface Brand {
  id: string; brand_name: string; description: string; logo_url: string;
  status: string; verification_tier?: string;
  owner?: { name: string; email: string; company_name: string }; created_at: string;
}

export default function AdminBrandsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBrands = async () => {
    const res = await fetch('/api/admin/brands');
    const data = await res.json();
    setBrands(data.brands || []);
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status);
    await fetch(`/api/admin/brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchBrands();
    setActionLoading(null);
  };

  const handleTierAction = async (id: string, tier: string) => {
    setActionLoading(id + tier);
    await fetch(`/api/admin/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_tier: tier })
    });
    await fetchBrands();
    setActionLoading(null);
  };

  const filtered = brands.filter(b =>
    (filter === 'all' || b.status === filter) &&
    (b.brand_name.toLowerCase().includes(search.toLowerCase()) || b.owner?.name.toLowerCase().includes(search.toLowerCase()) || b.owner?.company_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <aside className="dash-sidebar desktop-only">
          <span className="dash-sidebar-label">{t('sidebar.panel')}</span>
          <Link href="/admin/dashboard" className="sidebar-link"><LayoutDashboard size={16}/> {t('sidebar.dashboard')}</Link>
          <Link href="/admin/brands"    className="sidebar-link active"><Tags size={16}/> {t('sidebar.brands')}</Link>
          <Link href="/admin/users"     className="sidebar-link"><Users size={16}/> {t('sidebar.users')}</Link>
          <Link href="/admin/orders"    className="sidebar-link"><Package size={16}/> {t('sidebar.orders')}</Link>
        </aside>

        <main className="dash-main fade-up">
          <div className="page-header" style={{ marginBottom: 20, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <h1>{locale === 'ar' ? 'شبكة العلامات التجارية' : 'Brand Network'}</h1>
              <p>{locale === 'ar' ? 'إدارة والتحقق من شركاء الجملة' : 'Manage and verify wholesale partners'}</p>
            </div>
          </div>

          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
              <div className="filter-tabs" style={{ minWidth: 'max-content', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                {[['all', tCommon('all')], ['pending', tCommon('pending')], ['approved', tCommon('approved')], ['rejected', tCommon('rejected')]].map(([val, label]) => (
                  <button key={val} className={`filter-tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
                    {label}
                    <span style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 6, fontSize: 11, opacity: 0.7 }}>({val === 'all' ? brands.length : brands.filter(b => b.status === val).length})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="search-bar" style={{ width: '100%', maxWidth: '100%', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <Search size={16}/>
              <input placeholder={locale === 'ar' ? 'ابحث باسم العلامة، المالك، أو الشركة...' : 'Search brand names, owners, or companies…'} value={search} onChange={e => setSearch(e.target.value)} style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}/>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Tags size={28}/></div>
                <h3>{locale === 'ar' ? 'لا توجد علامات تجارية' : 'No Brands Found'}</h3>
                <p>{locale === 'ar' ? 'جرّب تعديل البحث أو الفلتر.' : 'Try adjusting your search or filters.'}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card List */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(brand => (
                  <div key={brand.id} className="card fade-up" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <div style={{ display: 'flex', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                        <BrandAvatar name={brand.brand_name} logoUrl={brand.logo_url} size={44} radius={12} />
                        <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{brand.brand_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{brand.owner?.name} · {brand.owner?.company_name}</div>
                        </div>
                      </div>
                      <StatusBadge status={brand.status}/>
                    </div>

                    <div style={{ background: 'var(--bg-page)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      {brand.description || (locale === 'ar' ? 'لا يوجد وصف للعلامة التجارية.' : 'No brand description available.')}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <button className="btn btn-success btn-sm" style={{ flex: 1, height: 40 }}
                        disabled={actionLoading === brand.id+'approved' || brand.status === 'approved'}
                        onClick={() => handleAction(brand.id, 'approved')}>
                        {actionLoading === brand.id+'approved' ? <span className="spinner"/> : tCommon('approved')}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, height: 40, color: 'var(--danger)' }}
                        disabled={actionLoading === brand.id+'rejected' || brand.status === 'rejected'}
                        onClick={() => handleAction(brand.id, 'rejected')}>
                        {actionLoading === brand.id+'rejected' ? <span className="spinner"/> : tCommon('rejected')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="desktop-only" style={{ overflowX: 'auto', borderRadius: 8 }}>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'العلامة / الشركة' : 'Brand / Company'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'المستوى' : 'Level'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'المالك' : 'Owner'}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="text-right">{locale === 'ar' ? 'الإدارة' : 'Manage'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(brand => (
                      <tr key={brand.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                            <BrandAvatar name={brand.brand_name} logoUrl={brand.logo_url} size={36} radius={8} />
                            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                               <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                                  {brand.brand_name}
                                  <VerifiedBadge tier={(brand.verification_tier || 'new') as any} size="sm" showModal={false} />
                               </div>
                               <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{brand.owner?.company_name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                           <select
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: 12, width: 110, height: 32 }}
                              value={brand.verification_tier || 'new'}
                              onChange={(e) => handleTierAction(brand.id, e.target.value)}
                              disabled={brand.status !== 'approved'}
                           >
                              <option value="new">{locale === 'ar' ? 'جديد' : 'New'}</option>
                              <option value="verified">{locale === 'ar' ? 'موثق' : 'Verified'}</option>
                              <option value="premium">{locale === 'ar' ? 'بريميوم' : 'Premium'}</option>
                           </select>
                        </td>
                        <td style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                           <div style={{ fontWeight: 600, fontSize: 13 }}>{brand.owner?.name}</div>
                           <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{brand.owner?.email}</div>
                        </td>
                        <td><StatusBadge status={brand.status}/></td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                            {brand.status === 'pending' ? (
                               <>
                                 <button className="btn btn-success btn-sm"
                                   disabled={actionLoading === brand.id+'approved'}
                                   onClick={() => handleAction(brand.id, 'approved')}>
                                   {actionLoading === brand.id+'approved' ? <span className="spinner-xs"/> : <Check size={14}/>}
                                 </button>
                                 <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                                   disabled={actionLoading === brand.id+'rejected'}
                                   onClick={() => handleAction(brand.id, 'rejected')}>
                                   {actionLoading === brand.id+'rejected' ? <span className="spinner-xs"/> : <X size={14}/>}
                                 </button>
                               </>
                            ) : (
                               <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} disabled>{locale === 'ar' ? 'مقفل' : 'Locked'}</button>
                            )}
                          </div>
                        </td>
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
