'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { formatAdminPrice } from '@/lib/currencies';
import { Store, Package, Users, Tags, LayoutDashboard, Check, X, Clock, ArrowRight, TrendingUp, DollarSign, Building2, MessageSquare, ShieldAlert, Star, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Stats {
  total_users: number; total_brands: number; approved_brands: number;
  pending_brands: number; total_orders: number; pending_orders: number; total_revenue: number;
}
interface Brand {
  id: string; brand_name: string; status: string;
  owner?: { name: string; email: string; company_name: string }; created_at: string;
}
interface Review {
  id: string; brand_name?: string; buyer_name?: string; rating: number; content: string;
  flagged: boolean; status?: string; created_at: string;
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  const locale = useLocale();
  return (
    <Link href={href} className={`sidebar-link ${active ? 'active' : ''}`} style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
      {icon} {label}
    </Link>
  );
}

function AdminSidebar({ active }: { active: string }) {
  const t = useTranslations('admin.sidebar');
  return (
    <aside className="dash-sidebar desktop-only">
      <span className="dash-sidebar-label">{t('panel')}</span>
      <SidebarLink href="/admin/dashboard" icon={<LayoutDashboard size={16}/>} label={t('dashboard')} active={active==='dashboard'}/>
      <SidebarLink href="/admin/brands"    icon={<Tags size={16}/>}            label={t('brands')}    active={active==='brands'}/>
      <SidebarLink href="/admin/users"     icon={<Users size={16}/>}           label={t('users')}     active={active==='users'}/>
      <SidebarLink href="/admin/orders"    icon={<Package size={16}/>}         label={t('orders')}    active={active==='orders'}/>
    </aside>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingBrands, setPendingBrands] = useState<Brand[]>([]);
  const [moderationQueue, setModerationQueue] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const fetchData = async () => {
    const [sRes, bRes, rRes] = await Promise.all([
      fetch('/api/admin/orders'), 
      fetch('/api/admin/brands'),
      fetch('/api/reviews?sort=recent') // Fetch all recent for admin
    ]);
    const [sData, bData, rData] = await Promise.all([sRes.json(), bRes.json(), rRes.json()]);
    setStats(sData.stats);
    setPendingBrands((bData.brands || []).filter((b: Brand) => b.status === 'pending'));
    
    const reviews = rData.reviews || [];
    setModerationQueue(reviews.filter((r: Review) => r.flagged || r.status === 'pending').slice(0, 5));
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status);
    await fetch(`/api/admin/brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchData();
    setActionLoading(null);
  };

  const handleModeration = async (id: string, action: 'keep' | 'remove') => {
    setActionLoading(id + action);
    await fetch(`/api/admin/reviews/${id}`, { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action }) 
    });
    await fetchData();
    setActionLoading(null);
  };

  const statCards = [
    { label: t('stats.activeBrands'),     value: stats?.approved_brands, icon: <Tags size={20}/>,       cls: 'icon-blue' },
    { label: t('stats.pendingBrands'),    value: stats?.pending_brands,  icon: <Clock size={20}/>,      cls: 'icon-amber' },
    { label: t('stats.totalRevenue'),     value: formatAdminPrice(stats?.total_revenue || 0), icon: <DollarSign size={20}/>, cls: 'icon-green' },
    { label: t('stats.totalOrders'),      value: stats?.total_orders,    icon: <Package size={20}/>,    cls: 'icon-navy' },
  ];

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <AdminSidebar active="dashboard" />
        <main className="dash-main fade-up">
          <div className="page-header" style={{ marginBottom: 20, textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <div>
              <h1>{t('overview.title')}</h1>
              <p>{t('overview.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid-4" style={{ marginBottom: 24 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
            </div>
          ) : (
            <div className="grid-stats-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              {statCards.map(s => (
                <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  <div className={`stat-icon-wrap ${s.cls}`} style={{ width: 40, height: 40, [locale === 'ar' ? 'marginRight' : 'marginLeft']: 0, [locale === 'ar' ? 'marginLeft' : 'marginRight']: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{s.value ?? '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
             {/* Pending Approvals */}
             <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} style={{ color: 'var(--blue)' }} />
                    <h2 style={{ fontSize: 16 }}>{t('pending.title')}</h2>
                  </div>
                  <Link href="/admin/brands" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                    {t('pending.manage')} {locale === 'ar' ? <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }}/> : <ArrowRight size={14}/>}
                  </Link>
                </div>
                {loading ? <div className="skeleton" style={{ height: 200 }} /> :
                 pendingBrands.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon" style={{ background: 'var(--approved-bg)', color: 'var(--success)' }}><Check size={24}/></div>
                    <h3>{t('pending.allClear')}</h3>
                  </div>
                ) : (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {pendingBrands.map(brand => (
                      <div key={brand.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{brand.brand_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{brand.owner?.company_name}</div>
                         </div>
                         <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-success btn-sm" style={{ width: 32, height: 32, padding: 0 }}
                               onClick={() => handleAction(brand.id, 'approved')} disabled={actionLoading === brand.id+'approved'}>
                               {actionLoading === brand.id+'approved' ? <span className="spinner-xs"/> : <Check size={14}/>}
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0, color: 'var(--danger)' }}
                               onClick={() => handleAction(brand.id, 'rejected')} disabled={actionLoading === brand.id+'rejected'}>
                               {actionLoading === brand.id+'rejected' ? <span className="spinner-xs"/> : <X size={14}/>}
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Content Moderation Queue */}
             <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={16} style={{ color: 'var(--danger)' }} />
                    <h2 style={{ fontSize: 16 }}>{t('moderation.title')}</h2>
                  </div>
                  <div style={{ fontSize: 11, background: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                     {t('moderation.flagged', { count: moderationQueue.length })}
                  </div>
                </div>
                {loading ? <div className="skeleton" style={{ height: 200 }} /> :
                 moderationQueue.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon" style={{ background: 'var(--approved-bg)', color: 'var(--success)' }}><Check size={24}/></div>
                    <h3>{t('moderation.healthyContent')}</h3>
                  </div>
                ) : (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {moderationQueue.map(review => (
                      <div key={review.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <div style={{ display: 'flex', gap: 1 }}>{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "#F59E0B" : "none"} stroke="#F59E0B"/>)}</div>
                               <span style={{ fontSize: 11, fontWeight: 700, color: '#4B5563' }}>{t('moderation.from', { name: review.buyer_name || t('moderation.anonymous') })}</span>
                            </div>
                            {review.flagged && <span style={{ fontSize: 10, background: '#FEE2E2', color: '#B91C1C', padding: '1px 6px', borderRadius: 10 }}>{t('moderation.flaggedLabel')}</span>}
                         </div>
                         <p style={{ fontSize: 13, color: '#111827', margin: '0 0 10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: locale === 'ar' ? 'right' : 'left' }}>{review.content || t('moderation.noComment')}</p>
                         <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11, height: 28 }}
                               onClick={() => handleModeration(review.id, 'keep')} disabled={actionLoading === review.id+'keep'}>
                               {actionLoading === review.id+'keep' ? '...' : t('moderation.keepContent')}
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11, height: 28, color: 'var(--danger)', borderColor: '#FCA5A5' }}
                               onClick={() => handleModeration(review.id, 'remove')} disabled={actionLoading === review.id+'remove'}>
                               {actionLoading === review.id+'remove' ? '...' : t('moderation.remove')}
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>

          <div className="grid-2-desktop" style={{ display: 'grid', gap: 20, marginTop: 24 }}>
             <div className="card" style={{ background: 'var(--bg-navy-soft)', border: 'none', textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Users size={20} style={{ color: 'var(--navy)' }} />
                <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{t('stats.networkGrowth')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('stats.networkGrowthDesc', { count: stats?.total_users || 0 })}</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: 'var(--bg-navy-soft)', border: 'none', textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Building2 size={20} style={{ color: 'var(--navy)' }} />
                <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{t('stats.marketplaceSize')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('stats.marketplaceSizeDesc', { count: stats?.total_brands || 0 })}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
