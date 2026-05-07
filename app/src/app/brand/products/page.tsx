'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCurrency } from '@/contexts/CurrencyContext';
import CatalogImportModal from '@/components/CatalogImportModal';
import { ShoppingBag, Pencil, Trash2, Plus, Upload } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import BrandSidebar from '@/components/BrandSidebar';
import { formatTierRange, calcSavingsPct, sortTiers } from '@/lib/pricingUtils';

interface Product {
  id: string; name: string; description: string;
  price: number; moq: number; stock: number; image_url: string;
  bulk_pricing_tiers: { min_qty: number; max_qty: number | null; price: number }[];
}

export default function BrandProductsPage() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const router = useRouter();
  const t = useTranslations('brandProducts');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeleteId(id);
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    await fetchProducts();
    setDeleteId(null);
  };

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <BrandSidebar productCount={products.length} />

        <main className="dash-main fade-up">
          {showImport && (
            <CatalogImportModal
              onClose={() => setShowImport(false)}
              onSuccess={() => { fetchProducts(); setShowImport(false); }}
            />
          )}

          <div className="page-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <div>
              <h1>{t('title')}</h1>
              <p>{t('totalProducts', { count: products.length })}</p>
            </div>
            <div className="desktop-only" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowImport(true)}>
                <Upload size={15} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }} /> {t('importCatalog')}
              </button>
              <Link href="/brand/products/new" className="btn btn-primary"><Plus size={15} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/> {t('addNewProduct')}</Link>
            </div>
          </div>

          {/* Quick Add - Mobile only */}
          <div className="mobile-only mb-16" style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowImport(true)}>
              <Upload size={16} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }} /> {t('import')}
            </button>
            <Link href="/brand/products/new" className="btn btn-primary" style={{ flex: 2 }}>
              <Plus size={18} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }} /> {t('addNewProduct')}
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }}/>)}
            </div>
          ) : products.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><ShoppingBag size={28}/></div>
                <h3>{t('empty.title')}</h3>
                <p>{t('empty.subtitle')}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>
                    <Upload size={14} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }} /> {t('importCatalog')}
                  </button>
                  <Link href="/brand/products/new" className="btn btn-primary">{t('empty.addFirst')}</Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── MOBILE: Compact product list ── */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {products.map(p => (
                  <div key={p.id} className="card fade-up" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
                      </div>
                       <div style={{ flex: 1, minWidth: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontWeight: 750, fontSize: 14, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{formatPrice(p.price)}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('card.moqLabel', { count: p.moq })}</span>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <span style={{ 
                            padding: '1px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                            background: p.stock < 20 ? 'var(--rejected-bg)' : 'var(--approved-bg)',
                            color: p.stock < 20 ? 'var(--danger)' : 'var(--success)'
                          }}>
                            {t('card.inStock', { count: p.stock })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, height: 40 }} onClick={() => router.push(`/brand/products/${p.id}/edit`)}>
                        <Pencil size={13} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/> {tCommon('edit')}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, height: 40, color: 'var(--danger)', borderColor: 'var(--rejected-border)' }}
                        disabled={deleteId === p.id} onClick={() => handleDelete(p.id)}>
                        {deleteId === p.id ? <span className="spinner"/> : <><Trash2 size={13} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }}/> {tCommon('delete')}</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── DESKTOP: Full table ── */}
              <div className="desktop-only" style={{ overflowX: 'auto', borderRadius: 8 }}>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ minWidth: 680 }}>
                  <thead>
                    <tr style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('table.product')}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('table.basePrice')}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('table.moq')}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('table.stock')}</th>
                      <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('table.pricingTiers')}</th>
                      <th className={locale === 'ar' ? 'text-left' : 'text-right'}>{t('table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                         <td>
                          <div className="flex items-center gap-12" style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                              {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--text-muted)' }}>📦</div>}
                            </div>
                            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }} className="truncate">{p.description}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}><span style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatPrice(p.price)}</span></td>
                        <td style={{ color: 'var(--text-secondary)', textAlign: locale === 'ar' ? 'right' : 'left' }}>{p.moq} {t('card.units')}</td>
                        <td style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                          <span style={{ fontWeight: 600, color: p.stock < 20 ? 'var(--danger)' : p.stock < 50 ? 'var(--warning)' : 'var(--success)' }}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ textAlign: locale === 'ar' ? 'right' : 'left', minWidth: 190 }}>
                          {(!p.bulk_pricing_tiers?.length) ? (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
                              {sortTiers(p.bulk_pricing_tiers).slice(0, 2).map((tier, i) => {
                                const savings = calcSavingsPct(p.price, tier.price);
                                return (
                                  <div key={i} dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                      {formatTierRange(tier, locale as 'en' | 'ar')}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>→</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{formatPrice(tier.price)}</span>
                                    {savings > 0 && (
                                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#DCFCE7', color: '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>-{savings}%</span>
                                    )}
                                  </div>
                                );
                              })}
                              {(p.bulk_pricing_tiers.length) > 2 && (
                                <span style={{ fontSize: 11, color: 'var(--blue)' }}>
                                  +{p.bulk_pricing_tiers.length - 2} {locale === 'ar' ? 'شرائح أخرى' : 'more tiers'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className={locale === 'ar' ? 'text-left' : 'text-right'}>
                          <div className={locale === 'ar' ? 'flex gap-8 justify-start' : 'flex gap-8 justify-end'}>
                            <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/brand/products/${p.id}/edit`)}>
                              <Pencil size={13} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 4 }}/> {tCommon('edit')}
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--rejected-border)', padding: '0 8px' }}
                              disabled={deleteId === p.id} onClick={() => handleDelete(p.id)}>
                              {deleteId === p.id ? <span className="spinner"/> : <Trash2 size={13}/>}
                            </button>
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
