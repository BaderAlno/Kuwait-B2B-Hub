'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BrandSidebar from '@/components/BrandSidebar';
import { Plus, Trash2, Info, ArrowLeft, ShoppingBag } from 'lucide-react';
import { calcSavingsPct } from '@/lib/pricingUtils';
import ImageUrlInput from '@/components/ImageUrlInput';

interface PricingTier { min_qty: string; max_qty: string; price: string; }

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', moq: '', stock: '', image_url: '' });
  const [tiers, setTiers] = useState<PricingTier[]>([{ min_qty: '', max_qty: '', price: '' }]);
  const [imageStatus, setImageStatus] = useState<'empty' | 'loading' | 'valid' | 'error'>('empty');

  const addTier = () => setTiers([...tiers, { min_qty: '', max_qty: '', price: '' }]);
  const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i: number, field: keyof PricingTier, val: string) => {
    setTiers(tiers.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    const bulk_pricing_tiers = tiers.filter(t => t.min_qty && t.price).map(t => ({
      min_qty: parseInt(t.min_qty), max_qty: t.max_qty ? parseInt(t.max_qty) : null, price: parseFloat(t.price),
    }));
    try {
      const res = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bulk_pricing_tiers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/brand/products');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const basePrice = parseFloat(form.price) || 0;

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <BrandSidebar />

        <main className="dash-main fade-up">
          <div className="page-header">
            <div>
              <h1>Add New Product</h1>
              <p>Create a wholesale listing with bulk pricing tiers</p>
            </div>
            <Link href="/brand/products" className="btn btn-ghost btn-sm"><ArrowLeft size={14}/> Back</Link>
          </div>

          {error && <div className="alert alert-danger"><Info size={15}/> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card">
                  <div className="card-header"><h2>Product Details</h2></div>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" placeholder="e.g. Classic Kandura Collection"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea className="form-input" style={{ minHeight: 100 }}
                      placeholder="Materials, sizes, colors, certifications…"
                      value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <ImageUrlInput
                      value={form.image_url}
                      onChange={url => setForm({...form, image_url: url})}
                      onStatusChange={setImageStatus}
                      label="Product Image URL"
                      previewWidth={72}
                      previewHeight={72}
                    />
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h2>Pricing & Stock</h2></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Base Price (KD) *</label>
                      <input type="number" step="0.001" min="0" className="form-input" placeholder="0.000"
                        value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Min Order (MOQ) *</label>
                      <input type="number" min="1" className="form-input" placeholder="10"
                        value={form.moq} onChange={e => setForm({...form, moq: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Stock Units *</label>
                      <input type="number" min="0" className="form-input" placeholder="500"
                        value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div>
                <div className="card">
                  <div className="card-header">
                    <h2>Bulk Pricing Tiers</h2>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addTier}>
                      <Plus size={14}/> Add Tier
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                    Set quantity-based discounts. Leave Max Qty empty for unlimited upper bound.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tiers.map((tier, i) => {
                      const tierPrice = parseFloat(tier.price) || 0;
                      const savings = basePrice > 0 && tierPrice > 0 ? calcSavingsPct(basePrice, tierPrice) : 0;
                      return (
                        <div key={i} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                          <div className="flex items-center justify-between mb-8">
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tier {i + 1}</span>
                            {tiers.length > 1 && (
                              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                                onClick={() => removeTier(i)}>
                                <Trash2 size={14}/>
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <div>
                              <label className="form-label" style={{ fontSize: 11 }}>Min Qty</label>
                              <input type="number" min="1" className="form-input" style={{ height: 36 }} placeholder="10"
                                value={tier.min_qty} onChange={e => updateTier(i, 'min_qty', e.target.value)} />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 11 }}>Max Qty</label>
                              <input type="number" className="form-input" style={{ height: 36 }} placeholder="∞"
                                value={tier.max_qty} onChange={e => updateTier(i, 'max_qty', e.target.value)} />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                                Price (KD)
                                {savings > 0 && (
                                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>-{savings}%</span>
                                )}
                                {savings < 0 && (
                                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>above base!</span>
                                )}
                              </label>
                              <input type="number" step="0.001" min="0" className="form-input"
                                style={{ height: 36, color: savings > 0 ? '#16A34A' : savings < 0 ? '#DC2626' : undefined }}
                                placeholder="0.000"
                                value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
                    <Info size={14}/>
                    <span>Example: 10–49 = KD 28.000, 50–99 = KD 24.000, 100+ = KD 20.000</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <Link href="/brand/products" className="btn btn-ghost">Cancel</Link>
                  <button id="create-product-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }}
                    disabled={loading || imageStatus === 'loading' || (imageStatus === 'error' && !!form.image_url)}>
                    {loading ? <><span className="spinner"/> Creating…</> : <><ShoppingBag size={15}/> Create Product</>}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
