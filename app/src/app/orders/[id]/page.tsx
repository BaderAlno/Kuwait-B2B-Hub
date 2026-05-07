'use client';
import { useEffect, useState, useRef } from 'react';
import { use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import ReviewModal from '@/components/ReviewModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ArrowLeft, Shield, Package, Send, Star, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatOrderId } from '@/lib/formatters';
import { formatDate } from '@/lib/i18n';

interface Message {
  id: string; content: string; created_at: string;
  sender_id: string; sender?: { name: string; role: string };
}
interface OrderDetail {
  id: string; status: string; total_amount: number; created_at: string;
  buyer?: { id: string; name: string; company_name: string };
  brand?: { id: string; brand_name: string; logo_url: string; owner_id: string; whatsapp_number?: string };
  items: { product?: { name: string; image_url: string }; quantity: number; unit_price: number }[];
}

export default function BuyerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWaBanner, setShowWaBanner] = useState(false);
  const t = useTranslations('orderDetails');
  const locale = useLocale();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  const fetchData = async () => {
    const [meRes, orderRes] = await Promise.all([fetch('/api/auth/me'), fetch(`/api/orders/${id}`)]);
    const [meData, orderData] = await Promise.all([meRes.json(), orderRes.json()]);
    setCurrentUser(meData.user);
    setOrder(orderData.order);
    setMessages(orderData.messages || []);
    // Show WA banner for pending orders where brand has WhatsApp
    if (orderData.order?.status === 'pending' && orderData.order?.brand?.whatsapp_number) {
      setShowWaBanner(true);
    }

    // Check if user already reviewed this order
    if (orderData.order?.brand?.id) {
      const reviewRes = await fetch(`/api/reviews?brand_id=${orderData.order.brand.id}`);
      const reviewData = await reviewRes.json();
      const userReview = reviewData.reviews?.some((r: any) => r.order_id === id && r.buyer_id === meData.user?.id);
      setHasReviewed(userReview);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: id, content: newMessage }),
    });
    setNewMessage('');
    await fetchData();
    setSending(false);
  };

  if (loading) return (
    <div className="page-root"><Navbar />
      <div className="main-content container-lg" style={{ paddingTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 200 }} />
            <div className="skeleton" style={{ height: 200 }} />
          </div>
          <div className="skeleton" style={{ height: 440 }} />
        </div>
      </div>
    </div>
  );

  const isCompleted = order?.status === 'completed';

  return (
    <div className="page-root">
      <Navbar />
      {showReviewModal && order?.brand && (
        <ReviewModal
          brandId={order.brand.id}

          brandName={order.brand.brand_name}
          onSuccess={() => { setShowReviewModal(false); setHasReviewed(true); }}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      <div className="main-content">
        <div className="container-lg" style={{ padding: '24px 16px 80px' }}>
          <div className="page-header" style={{ marginBottom: 20, textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Link href="/orders" className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                  {locale === 'ar' ? <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} /> : <ArrowLeft size={16} />}
                </Link>
                <h1 style={{ fontSize: 20, margin: 0 }}>{t('title')}</h1>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('orderId', { id: String(formatOrderId(id).replace('#', '')), brand: String(order?.brand?.brand_name || '') })}</p>
            </div>
            <div className="desktop-only">
              <StatusBadge status={order?.status || 'pending'} />
            </div>
          </div>

          <div className="mobile-only" style={{ marginBottom: 16 }}>
            <StatusBadge status={order?.status || 'pending'} />
          </div>

          <div style={{ marginBottom: 20 }}>
            {order?.status === 'pending' && (
              <div className="alert alert-warning" style={{ margin: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                ⏳ {t('alerts.awaiting', { brand: String(order?.brand?.brand_name || '') })}
              </div>
            )}
            {order?.status === 'approved' && (
              <div className="alert alert-success" style={{ margin: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                ✅ {t('alerts.approved')}
              </div>
            )}
            {order?.status === 'rejected' && (
              <div className="alert alert-danger" style={{ margin: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                ❌ {t('alerts.rejected')}
              </div>
            )}
          </div>

          {showWaBanner && order?.brand?.whatsapp_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <div style={{ flex: 1, minWidth: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 2 }}>{t('whatsapp.sendDetails')}</div>
                <div style={{ fontSize: 12, color: '#166534' }}>{t('whatsapp.sendDetailsHint', { brand: order.brand.brand_name })}</div>
              </div>
              <WhatsAppButton
                phoneNumber={order.brand.whatsapp_number}
                message={`Hello ${order.brand.brand_name}! I've submitted Order ${formatOrderId(id)} on Kuwait B2B Hub for ${order.items.length} item(s) totaling ${formatPrice(order.total_amount)}. Please review it on the platform. Looking forward to working with you!`}
                label={t('whatsapp.sendButton')}
                size="sm"
              />
              <button onClick={() => setShowWaBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', padding: 2, flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
          )}

          {order?.status === 'approved' && order?.brand?.whatsapp_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, fontSize: 13, color: '#15803D', fontWeight: 600, textAlign: locale === 'ar' ? 'right' : 'left' }}>🎉 {t('whatsapp.approvedShare')}</div>
              <WhatsAppButton
                phoneNumber={order.brand.whatsapp_number}
                message={`Great news! My order #${formatOrderId(id).replace('#', '')} from ${order.brand.brand_name} was approved on Kuwait B2B Hub 🎉`}
                label={t('whatsapp.approvedShareButton')}
                size="sm"
              />
            </div>
          )}

          {isCompleted && !hasReviewed && (
            <div className="review-prompt-banner" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="review-prompt-icon">
                  <Star size={20} style={{ color: '#F59E0B' }} />
                </div>
                <div style={{ flex: 1, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {t('review.title')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {t('review.subtitle', { brand: String(order?.brand?.brand_name || '') })}
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-sm" style={{ background: '#F59E0B', borderColor: '#F59E0B' }}
                onClick={() => setShowReviewModal(true)}>
                <Star size={13} style={{ [locale === 'ar' ? 'marginLeft' : 'marginRight']: 4 }} /> {t('review.button')}
              </button>
            </div>
          )}

          <div className="grid-2-desktop" style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}><h2>{t('summary')}</h2></div>
                <div className="flex items-center gap-12 mb-16" style={{ padding: '12px', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-subtle)', flexShrink: 0 }}>
                    {order?.brand?.logo_url ? (
                      <img src={order.brand.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                        {order?.brand?.brand_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <div style={{ fontWeight: 750, fontSize: 14 }}>{order?.brand?.brand_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--approved-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Shield size={10} /> {t('verifiedBrand')}
                    </div>
                  </div>
                  <Link href={`/brands/${order?.brand?.id}`} className="btn btn-ghost btn-sm" style={{ padding: '0 8px', height: 32 }}>{t('visitBrand')}</Link>
                </div>
                {[
                  [t('orderDate'), order?.created_at ? formatDate(order.created_at, locale as 'en' | 'ar') : '—'],
                  [t('totalAmount'), formatPrice(order?.total_amount ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: label === t('totalAmount') ? 800 : 600, color: label === t('totalAmount') ? 'var(--navy)' : 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}><h2>{t('itemsCount', { count: order?.items.length || 0 })}</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {order?.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-subtle)', flexShrink: 0, border: '1px solid var(--border)' }}>
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                      </div>
                       <div style={{ flex: 1, minWidth: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('units', { count: item.quantity })} × {formatPrice(item.unit_price)}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 14 }}>{formatPrice(item.quantity * item.unit_price)}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, paddingTop: 12, borderTop: '2px solid var(--bg-page)', marginTop: 4 }}>
                    <span>{t('total')}</span>
                    <span style={{ color: 'var(--navy)' }}>{formatPrice(order?.total_amount ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-container fade-up" style={{ minHeight: 450, borderRadius: 16 }}>
              <div className="chat-header" style={{ padding: '12px 16px', textAlign: locale === 'ar' ? 'right' : 'left', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 32, height: 32, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                  {order?.brand?.brand_name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 750, fontSize: 14 }}>{order?.brand?.brand_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('chat.title', { id: formatOrderId(id).replace('#', '') })}</div>
                </div>
              </div>
              <div className="chat-messages" style={{ flex: 1, padding: 16 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    <Send size={24} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>{t('chat.noMessages')}</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`message-wrap ${msg.sender_id === currentUser?.id ? 'mine' : 'theirs'}`} style={{ textAlign: locale === 'ar' ? (msg.sender_id === currentUser?.id ? 'left' : 'right') : (msg.sender_id === currentUser?.id ? 'right' : 'left') }}>
                    <div className="message-sender" style={{ fontSize: 11, fontWeight: 700 }}>{msg.sender?.name}</div>
                    <div className={`message-bubble ${msg.sender_id === currentUser?.id ? 'mine' : 'theirs'}`} style={{ fontSize: 14, padding: '10px 14px', borderRadius: 14, textAlign: locale === 'ar' ? 'right' : 'left' }}>{msg.content}</div>
                    <div className="message-time" style={{ fontSize: 10 }}>{new Date(msg.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-KW' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-bar" style={{ padding: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <textarea className="form-input" style={{ flex: 1, minHeight: 44, maxHeight: 100, fontSize: 14, borderRadius: 12, padding: '10px 14px', textAlign: locale === 'ar' ? 'right' : 'left' }}
                  placeholder={t('chat.placeholder')}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                <button className="btn btn-primary" style={{ width: 44, height: 44, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? <span className="spinner" /> : <Send size={18} style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
