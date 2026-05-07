'use client';
import { useEffect, useState, useRef } from 'react';
import { use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import BuyerTrustCard from '@/components/BuyerTrustCard';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslations, useLocale } from 'next-intl';
import { LayoutDashboard, ShoppingBag, Package, Tags, ArrowLeft, Check, X, Send } from 'lucide-react';

interface Message {
  id: string; content: string; created_at: string;
  sender_id: string; sender?: { name: string; role: string };
}
interface OrderDetail {
  id: string; status: string; total_amount: number; created_at: string;
  buyer?: { id: string; name: string; company_name: string };
  brand?: { brand_name: string; owner_id: string };
  items: { product?: { name: string; image_url: string }; quantity: number; unit_price: number }[];
}
interface BuyerTrust {
  buyer_id: string;
  total_orders: number; completion_rate: number; cancellation_rate: number;
  badges: string[]; member_since: string;
}

export default function BrandOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('brandSidebar');
  const tOrders = useTranslations('brandOrders');
  const locale = useLocale();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [buyerTrust, setBuyerTrust] = useState<BuyerTrust | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const [meRes, orderRes] = await Promise.all([fetch('/api/auth/me'), fetch(`/api/orders/${id}`)]);
    const [meData, orderData] = await Promise.all([meRes.json(), orderRes.json()]);
    setCurrentUser(meData.user);
    setOrder(orderData.order);
    setMessages(orderData.messages || []);
    if (orderData.order?.buyer?.id) {
      try {
        const trustRes = await fetch(`/api/trust/${orderData.order.buyer.id}`);
        const trustData = await trustRes.json();
        if (trustData.type === 'buyer') setBuyerTrust(trustData);
      } catch {}
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    setActionLoading(status);
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchData();
    setActionLoading(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: id, content: newMessage }) });
    setNewMessage('');
    await fetchData();
    setSending(false);
  };

  const { formatPrice } = useCurrency();

  if (loading) return (
    <div className="page-root"><Navbar />
      <div className="dash-layout">
        <main className="dash-main"><div className="skeleton" style={{ height: 400 }}/></main>
      </div>
    </div>
  );

  return (
    <div className="page-root">
      <Navbar />
      <div className="dash-layout">
        <aside className="dash-sidebar desktop-only">
          <span className="dash-sidebar-label">{t('label')}</span>
          <Link href="/brand/dashboard" className="sidebar-link"><LayoutDashboard size={16}/> {t('dashboard')}</Link>
          <Link href="/brand/products"  className="sidebar-link"><ShoppingBag size={16}/> {t('products')}</Link>
          <Link href="/brand/orders"    className="sidebar-link active"><Package size={16}/> {t('orders')}</Link>
          <Link href="/brand/profile"   className="sidebar-link"><Tags size={16}/> {t('profile')}</Link>
        </aside>

        <main className="dash-main fade-up">
          <div className="page-header" style={{ marginBottom: 20, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <Link href="/brand/orders" className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                  <ArrowLeft size={16} style={{ transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} />
                </Link>
                <h1 style={{ fontSize: 20, margin: 0 }}>{locale === 'ar' ? 'طلب شراء' : 'Order Request'}</h1>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {locale === 'ar' ? `من ${order?.buyer?.company_name} · رقم: #${id.slice(-8)}` : `From ${order?.buyer?.company_name} · ID: #${id.slice(-8)}`}
              </p>
            </div>
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
              <StatusBadge status={order?.status || 'pending'}/>
              {order?.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                  <button className="btn btn-success" disabled={actionLoading === 'approved'} onClick={() => handleAction('approved')}>
                    {actionLoading === 'approved' ? <span className="spinner"/> : <><Check size={14}/> {tOrders('actions.approve')}</>}
                  </button>
                  <button className="btn btn-ghost" style={{ borderColor: 'var(--rejected-border)', color: 'var(--danger)' }}
                    disabled={actionLoading === 'rejected'} onClick={() => handleAction('rejected')}>
                    {actionLoading === 'rejected' ? <span className="spinner"/> : <><X size={14}/> {tOrders('actions.reject')}</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions Header */}
          <div className="mobile-only" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-white)', padding: 12, borderRadius: 12, border: '1px solid var(--border)', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
            <StatusBadge status={order?.status || 'pending'}/>
            {order?.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <button className="btn btn-success btn-sm" disabled={actionLoading === 'approved'} onClick={() => handleAction('approved')}>
                  {actionLoading === 'approved' ? <span className="spinner"/> : tOrders('actions.approve')}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                  disabled={actionLoading === 'rejected'} onClick={() => handleAction('rejected')}>
                  {actionLoading === 'rejected' ? <span className="spinner"/> : tOrders('actions.reject')}
                </button>
              </div>
            )}
          </div>

          <div className="grid-2-desktop" style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Buyer Trust Card */}
              {buyerTrust && (
                <BuyerTrustCard
                  data={buyerTrust}
                  buyerName={order?.buyer?.name || 'Buyer'}
                  buyerCompany={order?.buyer?.company_name || 'Company'}
                />
              )}

              {/* Items Card */}
              <div className="card">
                <div className="card-header" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  <h2>{locale === 'ar' ? 'العناصر المطلوبة' : 'Ordered Items'}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {order?.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-subtle)', flexShrink: 0, border: '1px solid var(--border)' }}>
                        {item.product?.image_url ? <img src={item.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.quantity} {locale === 'ar' ? 'وحدة' : 'units'} × {formatPrice(item.unit_price)}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{formatPrice(item.quantity * item.unit_price)}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, paddingTop: 16, borderTop: '2px solid var(--bg-page)', marginTop: 4, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                    <span>{locale === 'ar' ? 'إجمالي الإيراد' : 'Total Revenue'}</span>
                    <span style={{ color: 'var(--success)' }}>{formatPrice(order?.total_amount ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            <div className="chat-container fade-up" style={{ minHeight: 450, borderRadius: 16 }}>
              <div className="chat-header" style={{ padding: '12px 16px', flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 32, height: 32, background: 'var(--bg-navy-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--navy)', fontSize: 14, border: '1px solid var(--border)' }}>
                  {order?.buyer?.company_name?.charAt(0) || order?.buyer?.name?.charAt(0)}
                </div>
                <div style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  <div style={{ fontWeight: 750, fontSize: 14 }}>{order?.buyer?.company_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{locale === 'ar' ? `محادثة مع ${order?.buyer?.name} (مشتري)` : `Chat with ${order?.buyer?.name} (Buyer)`}</div>
                </div>
              </div>

              <div className="chat-messages" style={{ flex: 1, padding: 16 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    <Send size={24} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>{locale === 'ar' ? 'لا توجد رسائل بعد. أرسل رسالة لبدء التفاوض!' : 'No messages yet. Send a message to start negotiating!'}</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`message-wrap ${msg.sender_id === currentUser?.id ? 'mine' : 'theirs'}`}>
                    <div className="message-sender" style={{ fontSize: 11, fontWeight: 700 }}>{msg.sender?.name}</div>
                    <div className={`message-bubble ${msg.sender_id === currentUser?.id ? 'mine' : 'theirs'}`} style={{ fontSize: 14, padding: '10px 14px', borderRadius: 14, textAlign: locale === 'ar' ? 'right' : 'left' }}>{msg.content}</div>
                    <div className="message-time" style={{ fontSize: 10 }}>{new Date(msg.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-KW' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                <div ref={messagesEndRef}/>
              </div>

              <div className="chat-input-bar" style={{ padding: 12, flexDirection: locale === 'ar' ? 'row-reverse' : 'row' }}>
                <textarea className="form-input" style={{ flex: 1, minHeight: 44, maxHeight: 100, fontSize: 14, borderRadius: 12, padding: '10px 14px', textAlign: locale === 'ar' ? 'right' : 'left' }}
                  placeholder={locale === 'ar' ? 'اكتب رسالة...' : 'Type a message…'} value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                <button className="btn btn-primary" style={{ width: 44, height: 44, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? <span className="spinner"/> : <Send size={18}/>}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
