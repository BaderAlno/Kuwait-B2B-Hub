'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VerifiedBadge from '@/components/VerifiedBadge';
import TrustScore from '@/components/TrustScore';
import { StarDisplay } from '@/components/StarRating';
import RatingBreakdown from '@/components/RatingBreakdown';
import ReviewCard from '@/components/ReviewCard';
import ReviewModal from '@/components/ReviewModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ArrowLeft, Package, Shield, Minus, Plus, X, ShoppingCart, Send, Star, CheckCircle2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatTierRange, calcSavingsPct, sortTiers } from '@/lib/pricingUtils';
import BrandAvatar from '@/components/BrandAvatar';

interface BulkTier { min_qty: number; max_qty: number | null; price: number; }
interface Product {
  id: string; name: string; description: string;
  price: number; moq: number; stock: number; image_url: string;
  bulk_pricing_tiers: BulkTier[];
}
interface Brand {
  id: string; brand_name: string; description: string;
  logo_url: string; owner_name: string; verification_tier: string;
  whatsapp_number?: string; business_hours?: string; auto_reply_message?: string;
}
interface TrustData {
  response_rate?: number; completion_rate?: number; avg_response_hours?: number;
  total_fulfilled?: number; orders_this_month?: number; avg_fulfillment_days?: number;
  badges?: string[]; member_since?: string;
}
interface Review {
  id: string; rating: number; content: string; buyer_name: string;
  buyer_company?: string; anonymous: boolean; flagged: boolean;
  brand_reply: string | null; created_at: string;
  buyer_id: string;
  status?: 'active' | 'removed';
}
interface CartItem { product_id: string; quantity: number; name: string; price: number; }

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [trust, setTrust] = useState<TrustData | null>(null);
  const [reviewData, setReviewData] = useState<{ reviews: Review[]; avg_rating: number; total_reviews: number; breakdown: Record<number, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const t = useTranslations('brandCatalogView');
  const tCommon = useTranslations('common');
  const tMarketplace = useTranslations('marketplace');
  const tTrust = useTranslations('trust');
  const locale = useLocale();
  const router = useRouter();

  const fetchAll = async () => {
    const [brandRes, trustRes, reviewRes, meRes] = await Promise.all([
      fetch(`/api/brands/${id}`),
      fetch(`/api/trust/${id}`),
      fetch(`/api/reviews?brand_id=${id}`),
      fetch('/api/auth/me'),
    ]);
    const [brandData, trustData, reviewsData, meData] = await Promise.all([
      brandRes.json(), trustRes.json(), reviewRes.json(), meRes.json(),
    ]);
    setBrand(brandData.brand);
    setProducts(brandData.products || []);
    setTrust(trustData);
    setReviewData({ ...reviewsData, avg_rating: reviewsData.avg_rating || 0, total_reviews: reviewsData.total_reviews || 0 });
    setCurrentUser(meData.user || null);
    const initQty: Record<string, number> = {};
    brandData.products?.forEach((p: Product) => { initQty[p.id] = p.moq; });
    setQuantities(initQty);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const getPriceForQty = (product: Product, qty: number) => {
    if (!product.bulk_pricing_tiers?.length) return product.price;
    for (const tier of product.bulk_pricing_tiers)
      if (qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty)) return tier.price;
    return product.price;
  };

  const updateQty = (pid: string, delta: number, moq: number) =>
    setQuantities(q => ({ ...q, [pid]: Math.max(moq, (q[pid] || moq) + delta) }));

  const addToCart = (product: Product) => {
    const qty = quantities[product.id] || product.moq;
    const price = getPriceForQty(product, qty);
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantity: qty, price } : i);
      return [...prev, { product_id: product.id, quantity: qty, name: product.name, price }];
    });
  };

  const removeFromCart = (pid: string) => setCart(prev => prev.filter(i => i.product_id !== pid));

  const handleOrder = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    const res = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: id, items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })) }),
    });
    if (res.status === 401) { router.push('/login'); return; }
    setSuccess(true); setCart([]);
    setTimeout(() => router.push('/orders'), 2500);
  };

  const { formatPrice } = useCurrency();
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const isBuyer = currentUser?.role === 'buyer';
  const isBrandOwner = currentUser?.role === 'brand_owner';

  const trackWhatsApp = () => {
    fetch('/api/brands/whatsapp-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand_id: id }) });
  };

  const waMessage = brand ? `Hi ${brand.brand_name}! I found you on Kuwait B2B Hub and I'm interested in your wholesale products. Can we discuss pricing and MOQ?` : '';

  if (loading) return (
    <div className="page-root"><Navbar />
      <div className="main-content container-lg" style={{ paddingTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 140 }} />
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
          </div>
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-root">
      <Navbar />
      {showReviewModal && brand && (
        <ReviewModal
          brandId={id}
          brandName={brand.brand_name}
          onSuccess={() => { setShowReviewModal(false); fetchAll(); }}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      <div className="main-content">
        {/* Brand header */}
        <div style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
          <div className="container-lg">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <BrandAvatar name={brand?.brand_name || ''} logoUrl={brand?.logo_url} size={64} radius={12} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{brand?.brand_name}</h1>
                  {brand?.verification_tier && (
                    <VerifiedBadge tier={brand.verification_tier as 'premium' | 'verified' | 'new'} />
                  )}
                  {reviewData && reviewData.avg_rating > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600 }}>
                      <StarDisplay rating={reviewData.avg_rating} size={13} />
                      <span style={{ color: 'var(--text-secondary)' }}>{reviewData.avg_rating.toFixed(1)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({tTrust('reviews', { count: reviewData.total_reviews })})</span>
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 560, marginBottom: 8 }}>{brand?.description}</p>
                {brand?.auto_reply_message && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>💬 {t('typicallyReplies')}</span> {brand.auto_reply_message}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {products.length > 0 && <span>🛍️ {t('productsCount', { count: products.length })}</span>}
                  <span>📦 {t('wholesaleOnly')}</span>
                  {trust?.total_fulfilled && <span>✅ {t('ordersFulfilled', { count: trust.total_fulfilled })}</span>}
                  {trust?.orders_this_month && <span>📈 {t('ordersThisMonth', { count: trust.orders_this_month })}</span>}
                </div>
              </div>
              <div className="brand-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {brand?.whatsapp_number && (
                  <div onClick={trackWhatsApp}>
                    <WhatsAppButton phoneNumber={brand.whatsapp_number} message={waMessage} size="sm" label="WhatsApp" />
                  </div>
                )}
                {isBuyer && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReviewModal(true)}>
                    <Star size={13} /> <span className="desktop-only" style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 4 }}>{t('writeReview')}</span>
                  </button>
                )}
                <Link href="/marketplace" className="btn btn-ghost btn-sm">
                  {locale === 'ar' ? <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} /> : <ArrowLeft size={14} />}
                  <span className="desktop-only" style={{ [locale === 'ar' ? 'marginRight' : 'marginLeft']: 4 }}>{t('marketplaceLink')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container-lg" style={{ padding: '28px 32px 60px' }}>
          <div className="brand-catalog-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {trust && (
                <div id="trust-section">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
                    <Shield size={18} style={{ color: '#1A1A2E' }} /> {tTrust('title')}
                  </h2>
                  <TrustScore data={{
                    response_rate: trust.response_rate || 0,
                    completion_rate: trust.completion_rate || 0,
                    avg_response_hours: trust.avg_response_hours || 0,
                    total_fulfilled: trust.total_fulfilled || 0,
                    member_since: trust.member_since,
                    avg_rating: reviewData?.avg_rating
                  }} />
                </div>
              )}

              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#111827' }}>{t('catalogTitle')}</h2>
                {products.length === 0 ? (
                  isBrandOwner && currentUser?.id === brand?.id ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#F0F7FF', borderRadius: 12, border: '1px dashed #93C5FD' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                      <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px', color: '#1E40AF' }}>
                        {locale === 'ar' ? 'كتالوجك فارغ' : 'Your catalog is empty'}
                      </p>
                      <p style={{ fontSize: 14, color: '#3B82F6', margin: '0 0 20px' }}>
                        {locale === 'ar' ? 'أضف أول منتج بالجملة لبدء استقبال الطلبات' : 'Add your first wholesale product to start receiving orders'}
                      </p>
                      <a href="/brand/products/new" style={{ display: 'inline-block', padding: '10px 24px', background: '#1A1A2E', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                        {locale === 'ar' ? '+ إضافة أول منتج' : '+ Add Your First Product'}
                      </a>
                    </div>
                  ) : (
                  <div className="card"><div className="empty-state">
                    <div className="empty-state-icon"><Package size={28} /></div>
                    <h3>{t('noProducts')}</h3>
                    <p>{t('noProductsHint')}</p>
                    {brand?.whatsapp_number && (
                      <a href={`https://wa.me/${brand.whatsapp_number.replace(/\D/g, '')}?text=Hi ${brand.brand_name}! I found you on Kuwait B2B Hub and I'm interested in your products.`}
                        target="_blank" rel="noreferrer"
                        style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#25D366', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                        {locale === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                      </a>
                    )}
                  </div></div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {products.map(product => {
                      const qty = quantities[product.id] || product.moq;
                      const currentPrice = getPriceForQty(product, qty);
                      const inCart = cart.some(i => i.product_id === product.id);
                      return (
                        <div key={product.id} className="product-row" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <div style={{ background: '#F9FAFB', flexShrink: 0 }}>
                            {product.image_url ? <img src={product.image_url} alt={product.name} className="product-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                            )}
                          </div>
                          <div className="product-body" style={{ padding: 20, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                            <div className="product-name" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: '#111827' }}>{product.name}</div>
                            <div className="product-desc" style={{ fontSize: 14, color: '#4B5563', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>{product.description}</div>
                            <div className="product-meta-row" style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                              <span className="product-meta-item" style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}><Package size={14} /> {t('moq', { count: product.moq })}</span>
                              <span className="product-meta-item" style={{ fontSize: 13, color: product.stock < 20 ? '#DC4444' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> {t('stock', { count: product.stock })}</span>
                            </div>
                            {product.bulk_pricing_tiers?.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                                  {locale === 'ar' ? 'شرائح الجملة' : 'Wholesale Tiers'}
                                </div>
                                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                                  {sortTiers(product.bulk_pricing_tiers).map((tier, i) => {
                                    const isActive = qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty);
                                    const savings = calcSavingsPct(product.price, tier.price);
                                    return (
                                      <div key={i} dir="ltr" style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '7px 12px',
                                        background: isActive ? '#1A1A2E' : i % 2 === 0 ? '#FAFAFA' : 'white',
                                        borderTop: i === 0 ? 'none' : '1px solid #F3F4F6',
                                        justifyContent: 'space-between',
                                      }}>
                                        <span style={{ fontSize: 12, color: isActive ? '#9CA3AF' : '#6B7280', whiteSpace: 'nowrap' }}>
                                          {formatTierRange(tier, locale as 'en' | 'ar')}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'white' : '#111827', whiteSpace: 'nowrap' }}>
                                            {formatPrice(tier.price)}
                                          </span>
                                          {savings > 0 && (
                                            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: isActive ? '#166534' : '#DCFCE7', color: isActive ? '#DCFCE7' : '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                              -{savings}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="product-actions" style={{ padding: 20, background: '#F8F7F4', borderLeft: locale === 'ar' ? 'none' : '1px solid #E5E7EB', borderRight: locale === 'ar' ? '1px solid #E5E7EB' : 'none', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div className="product-price-big" style={{ fontSize: 24, fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.025em' }}>{formatPrice(currentPrice)}</div>
                              <div className="product-per-unit" style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{t('unitPriceFor', { count: qty })}</div>
                            </div>
                            <div className="qty-stepper" style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 10, background: 'white', overflow: 'hidden' }}>
                              <button onClick={() => updateQty(product.id, -1, product.moq)} style={{ width: 40, height: 44, border: 'none', background: 'none', cursor: 'pointer' }}><Minus size={14} /></button>
                              <input type="number" className="qty-input" min={product.moq} value={qty}
                                onChange={e => setQuantities(q => ({ ...q, [product.id]: Math.max(product.moq, parseInt(e.target.value) || product.moq) }))}
                                style={{ width: 50, border: 'none', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#111827' }} />
                              <button onClick={() => updateQty(product.id, 1, product.moq)} style={{ width: 40, height: 44, border: 'none', background: 'none', cursor: 'pointer' }}><Plus size={14} /></button>
                            </div>
                            {inCart ? (
                              <button className="btn btn-ghost" style={{ border: '1px solid #D1D5DB', width: '100%', borderRadius: 10, height: 44 }} onClick={() => removeFromCart(product.id)}>
                                <X size={15} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }} /> {t('removeFromOrder')}
                              </button>
                            ) : (
                              <button className="btn btn-primary" style={{ width: '100%', borderRadius: 10, height: 44, background: '#1A1A2E' }} onClick={() => addToCart(product)}>
                                <Plus size={15} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6 }} /> {t('addToOrder')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div id="reviews-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
                    <Star size={18} style={{ color: '#F59E0B' }} /> {tTrust('title')}
                  </h2>
                </div>

                {reviewData && reviewData.total_reviews > 0 ? (
                  <>
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32, marginBottom: 32 }}>
                      <RatingBreakdown
                        avgRating={reviewData.avg_rating}
                        totalReviews={reviewData.total_reviews}
                        breakdown={reviewData.breakdown || {}}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                         <select 
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#4B5563', background: 'white' }}
                            onChange={(e) => {
                               fetch(`/api/reviews?brand_id=${id}&sort=${e.target.value}`)
                               .then(r => r.json())
                               .then(data => setReviewData(d => d ? { ...d, reviews: data.reviews } : null));
                            }}
                         >
                            <option value="recent">{tTrust('sortRecent')}</option>
                            <option value="high">{tTrust('sortHigh')}</option>
                            <option value="low">{tTrust('sortLow')}</option>
                         </select>
                      </div>
                      {reviewData.reviews.map(review => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          isOwner={isBrandOwner}
                          isAdmin={currentUser?.role === 'admin'}
                          onRefresh={fetchAll}
                        />
                      ))}
                      {reviewData.total_reviews > reviewData.reviews.length && (
                        <button className="btn btn-ghost" style={{ alignSelf: 'center', marginTop: 12 }}>{tCommon('loadMore')}</button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="card">
                    <div className="empty-state" style={{ padding: '60px 40px' }}>
                      <div className="empty-state-icon" style={{ background: '#F9FAFB' }}><Star size={28} style={{ color: '#D1D5DB' }} /></div>
                      <h3>{tTrust('noReviews')}</h3>
                      <p>{tTrust('noReviewsHint')}</p>
                      {isBuyer && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowReviewModal(true)}>{tTrust('writeReview')}</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="order-summary" style={{ position: 'sticky', top: 24 }}>
              <div className="order-summary-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingCart size={16} style={{ color: 'var(--text-secondary)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>{t('orderSummary')}</h2>
                  {cart.length > 0 && (
                    <span style={{ background: 'var(--navy)', color: 'white', borderRadius: 20, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{cart.length}</span>
                  )}
                </div>
              </div>
              <div className="order-summary-body" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                {success ? (
                  <div className="alert alert-success">✅ {t('orderSubmitted')}</div>
                ) : cart.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                    {t('orderSummaryEmpty')}
                  </p>
                ) : (
                  cart.map(item => (
                    <div key={item.product_id} className="order-item-row" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.quantity} {tCommon('units')} × {formatPrice(item.price)}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && !success && (
                <div className="order-summary-footer">
                  <div className="order-total-row" style={{ marginBottom: 14 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('total')}</span>
                    <span style={{ color: 'var(--navy)', fontSize: 18 }}>{formatPrice(cartTotal)}</span>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={handleOrder} disabled={submitting}>
                    {submitting ? <><span className="spinner" /> {tCommon('loading')}…</> : <><Send size={15} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 6, transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} /> {t('submitOrder')}</>}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                    {t('submitOrderHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
