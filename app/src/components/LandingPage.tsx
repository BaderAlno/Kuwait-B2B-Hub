'use client';
import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Store, Check, ChevronDown, ChevronUp,
  ShoppingBag, Shield,
  Mail, Globe, Menu, X,
} from 'lucide-react';
import type { FeaturedBrand } from '@/app/page';

// ─── FADE-IN ON SCROLL ────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : 'translateY(24px)',
    transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
  };
  return { ref, style };
}

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────
const FAQ_EN = [
  { q: 'Is Kuwait B2B Hub free to use?', a: 'Business buyers can browse and place orders completely free. Brand owners can list their first brand for KD 29/month with a 14-day free trial.' },
  { q: 'How does brand verification work?', a: 'We verify every brand manually — checking their Commercial Registration (CR) number, business address, and owner ID. Verified brands get a badge that builds instant buyer trust.' },
  { q: 'Can I use the platform in Arabic?', a: 'Yes! Kuwait B2B Hub is fully bilingual — Arabic and English with complete RTL support. Switch languages anytime.' },
  { q: 'Which currencies are supported?', a: 'We support KWD, SAR, AED, and BHD. Prices automatically convert based on your selected market.' },
  { q: 'How are wholesale orders processed?', a: 'Buyers submit order requests through the platform. Brand owners review and approve or decline. All communication and order tracking happens in one place.' },
  { q: 'Is my business data secure?', a: 'Yes. All data is encrypted and stored securely. We never share your business information with third parties.' },
  { q: 'Can I import my existing product catalog?', a: 'Brand owners can import products in bulk using our Excel/CSV import tool. Download our template to get started.' },
  { q: 'Do you support shipping across GCC?', a: 'Brands can specify which GCC markets they ship to (Kuwait, Saudi Arabia, UAE, Bahrain). Buyers see only brands that ship to their market.' },
];

const FAQ_AR = [
  { q: 'هل منصة Kuwait B2B Hub مجانية؟', a: 'يمكن للمشترين تصفّح المنصة وتقديم الطلبات مجاناً تماماً. أصحاب العلامات التجارية يمكنهم إدراج علامتهم الأولى مقابل ٢٩ دينار كويتي / شهرياً مع تجربة مجانية ١٤ يوماً.' },
  { q: 'كيف يعمل نظام التحقق من العلامات التجارية؟', a: 'نتحقق من كل علامة تجارية يدوياً — بالتحقق من رقم السجل التجاري وعنوان العمل وهوية المالك. العلامات المُوثَّقة تحصل على شارة تبني ثقة فورية مع المشترين.' },
  { q: 'هل يمكنني استخدام المنصة بالعربية؟', a: 'نعم! المنصة ثنائية اللغة بالكامل — عربي وإنجليزي مع دعم كامل للكتابة من اليمين إلى اليسار. يمكنك تغيير اللغة في أي وقت.' },
  { q: 'ما هي العملات المدعومة؟', a: 'ندعم الدينار الكويتي والريال السعودي والدرهم الإماراتي والدينار البحريني. تتحوّل الأسعار تلقائياً بناءً على السوق الذي اخترته.' },
  { q: 'كيف تتم معالجة طلبات الجملة؟', a: 'يقدّم المشترون طلبات الشراء عبر المنصة. يراجع أصحاب العلامات الطلبات ويوافقون عليها أو يرفضونها. تتم جميع المراسلات وتتبع الطلبات في مكان واحد.' },
  { q: 'هل بيانات أعمالي آمنة؟', a: 'نعم. جميع البيانات مشفّرة ومحفوظة بأمان. لا نشارك معلوماتك التجارية مع أي طرف ثالث.' },
  { q: 'هل يمكنني استيراد كتالوج منتجاتي الحالي؟', a: 'يمكن لأصحاب العلامات استيراد المنتجات دفعةً واحدة باستخدام أداة استيراد Excel/CSV. حمّل القالب للبدء.' },
  { q: 'هل تدعمون الشحن عبر دول الخليج؟', a: 'يمكن للعلامات تحديد أسواق الخليج التي يشحنون إليها (الكويت، السعودية، الإمارات، البحرين). يرى المشترون فقط العلامات التي تشحن إلى سوقهم.' },
];

// ─── PROBLEM SECTION ──────────────────────────────────────────────────────────
function ProblemSection({ ar }: { ar: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const BEFORE = ar ? [
    'تتبّع الطلبات عبر مجموعات واتساب الفوضوية',
    'أسعار جملة غير واضحة — لا تعرف من يدفع ماذا',
    'لا توجد سجلات رسمية لشروط الاتفاق',
    'المشترون يختفون بعد التفاوض',
    'تضيع ساعات في الردود المتكررة',
  ] : [
    'Tracking orders across chaotic WhatsApp groups',
    'Unclear wholesale pricing — no one knows who pays what',
    'No formal record of agreed terms',
    'Buyers ghost you after negotiating',
    'Hours wasted on repetitive back-and-forth',
  ];

  const AFTER = ar ? [
    'كل الطلبات في لوحة تحكم واحدة منظّمة',
    'شرائح أسعار جملة شفافة لكل منتج',
    'عقد رقمي واضح لكل طلبية',
    'ملف موثّق يبني ثقة فورية مع المشترين',
    'إشعارات تلقائية — لا متابعات يدوية',
  ] : [
    'Every order in one structured dashboard',
    'Transparent bulk pricing tiers per product',
    'Clear digital record for every order',
    'Verified profile builds instant buyer trust',
    'Automatic notifications — no manual follow-ups',
  ];

  const row = ar ? 'row-reverse' : 'row';

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="lp-section lp-section-alt"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-problem-badge">{ar ? '😓 المشكلة' : '😓 The Problem'}</div>
          <h2 className="lp-section-title">
            {ar ? 'هل تعبت من فوضى واتساب؟' : 'Done with WhatsApp chaos?'}
          </h2>
          <p className="lp-section-sub">
            {ar
              ? 'أصحاب العلامات الكويتيون يفقدون صفقات ووقتاً كل يوم بسبب أدوات غير مصممة للجملة'
              : 'Kuwaiti brand owners lose deals and hours daily using tools not built for wholesale'}
          </p>
        </div>

        <div className="lp-problem-grid" style={{ flexDirection: row }}>
          {/* Before */}
          <div className="lp-problem-col lp-problem-before" style={{ textAlign: ar ? 'right' : 'left' }}>
            <div className="lp-problem-col-head" style={{ flexDirection: row }}>
              <span className="lp-problem-icon">😩</span>
              <span>{ar ? 'قبل Kuwait B2B Hub' : 'Before Kuwait B2B Hub'}</span>
            </div>
            <ul className="lp-problem-list">
              {BEFORE.map((item, i) => (
                <li key={i} style={{ flexDirection: row }}>
                  <span className="lp-problem-x">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Divider arrow */}
          <div className="lp-problem-arrow desktop-only">{ar ? '←' : '→'}</div>

          {/* After */}
          <div className="lp-problem-col lp-problem-after" style={{ textAlign: ar ? 'right' : 'left' }}>
            <div className="lp-problem-col-head" style={{ flexDirection: row }}>
              <span className="lp-problem-icon">✨</span>
              <span>{ar ? 'مع Kuwait B2B Hub' : 'With Kuwait B2B Hub'}</span>
            </div>
            <ul className="lp-problem-list">
              {AFTER.map((item, i) => (
                <li key={i} style={{ flexDirection: row }}>
                  <span className="lp-problem-check">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── HERO BROWSER MOCKUP ──────────────────────────────────────────────────────
function BrowserMockup() {
  const mockBrands = [
    { name: 'Kuwait Fashion House', cat: 'Fashion & Apparel', badge: '✦ Premium', color: '#E8F3FF' },
    { name: 'Gulf Tech Solutions', cat: 'Electronics & Tech', badge: '✓ Verified', color: '#F0FDF4' },
    { name: 'Desert Rose Beauty', cat: 'Beauty & Cosmetics', badge: '✦ Premium', color: '#FFF7ED' },
  ];
  return (
    <div className="lp-browser">
      {/* Chrome bar */}
      <div className="lp-browser-chrome">
        <div className="lp-browser-dots">
          <span style={{ background: '#FF5F57' }} />
          <span style={{ background: '#FEBC2E' }} />
          <span style={{ background: '#28C840' }} />
        </div>
        <div className="lp-browser-url">
          <Shield size={10} style={{ color: '#6B7280' }} />
          kuwaitb2bhub.com/marketplace
        </div>
        <span className="lp-live-badge">● LIVE</span>
      </div>
      {/* Page content */}
      <div className="lp-browser-content">
        {/* Mini search bar */}
        <div className="lp-mock-search">
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#D1D5DB' }} />
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#E5E7EB' }} />
          <div style={{ width: 40, height: 20, borderRadius: 4, background: '#1A1A2E', opacity: 0.8 }} />
        </div>
        {/* Brand cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {mockBrands.map(b => (
            <div key={b.name} style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ height: 48, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(26,26,46,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1A1A2E' }}>
                  {b.name.charAt(0)}
                </div>
              </div>
              <div style={{ padding: '8px 8px 6px' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#111827', marginBottom: 2, lineHeight: 1.2 }}>{b.name}</div>
                <div style={{ fontSize: 7, color: '#9CA3AF', marginBottom: 4 }}>{b.cat}</div>
                <div style={{ display: 'inline-block', fontSize: 6, fontWeight: 700, background: b.color, color: '#1A1A2E', padding: '2px 5px', borderRadius: 3 }}>{b.badge}</div>
                <div style={{ marginTop: 6, height: 16, borderRadius: 3, background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 6, color: 'white', fontWeight: 600 }}>View Catalog →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LandingPage({ featuredBrands }: { featuredBrands: FeaturedBrand[] }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const faq = ar ? FAQ_AR : FAQ_EN;

  // Scroll fade-in refs
  const howItWorks = useFadeIn(0);
  const forBothSides = useFadeIn(0);
  const featuredSection = useFadeIn(0);
  const testimonialsSection = useFadeIn(0);
  const pricingSection = useFadeIn(0);
  const faqSection = useFadeIn(0);
  const ctaSection = useFadeIn(0);
  const footerSection = useFadeIn(0);

  const STEPS = ar ? [
    { num: '١', icon: '🏪', color: '#1A1A2E', title: 'تصفّح العلامات الموثّقة', body: 'اكتشف كتالوجات جملة مُنتقاة من أبرز العلامات الكويتية، جميعها مُتحقَّق منها من قِبَل فريقنا.' },
    { num: '٢', icon: '🤝', color: '#0D9488', title: 'اطلب عرض سعر بالجملة', body: 'قدّم طلبات الشراء الكبيرة مباشرةً عبر المنصة. لا مزيد من التفاوض على واتساب.' },
    { num: '٣', icon: '📊', color: '#2563EB', title: 'راجع الشروط والأسعار', body: 'ناقش الحد الأدنى للطلب وشرائح الأسعار وشروط التوصيل عبر نظام الطلبات المنظّم.' },
    { num: '٤', icon: '✅', color: '#16A34A', title: 'أبرم الصفقة وتابعها', body: 'أكّد طلب جملتك وتابع حالته في الوقت الفعلي من لوحة التحكم.' },
  ] : [
    { num: '1', icon: '🏪', color: '#1A1A2E', title: 'Browse Verified Brands', body: 'Explore curated wholesale catalogs from Kuwait\'s top brands, all verified by our team.' },
    { num: '2', icon: '🤝', color: '#0D9488', title: 'Request a Wholesale Quote', body: 'Submit bulk order requests directly through the platform. No more WhatsApp back-and-forth.' },
    { num: '3', icon: '📊', color: '#2563EB', title: 'Review Terms & Pricing', body: 'Discuss MOQ, pricing tiers, and delivery terms through our structured order system.' },
    { num: '4', icon: '✅', color: '#16A34A', title: 'Place & Track Your Order', body: 'Confirm your wholesale order and track its status in real-time from your dashboard.' },
  ];

  const BUYER_BULLETS = ar
    ? ['الوصول إلى ٢٤+ مورد جملة موثّق', 'مقارنة الأسعار عبر علامات متعددة', 'نظام إدارة طلبات منظّم', 'تتبّع جميع طلباتك في لوحة واحدة', 'معاملات آمنة وشفافة', 'خيارات شحن في دول الخليج']
    : ['Access 24+ verified wholesale suppliers', 'Compare pricing across multiple brands', 'Structured order management system', 'Track every order in one dashboard', 'Secure and transparent transactions', 'GCC-wide shipping options'];

  const BRAND_BULLETS = ar
    ? ['إنشاء واجهة علامتك التجارية الاحترافية', 'إدارة طلبات الجملة بكفاءة', 'تحديد الحد الأدنى للطلب وشرائح الأسعار', 'احصل على الشارة الموثّقة — ابنِ ثقة فورية', 'وصّل منتجاتك لمشترين في الكويت والخليج', 'تحليلات وتتبّع الإيرادات']
    : ['Create a professional brand storefront', 'Manage wholesale orders efficiently', 'Set MOQ and bulk pricing tiers', 'Get verified status — build instant trust', 'Reach buyers across Kuwait and GCC', 'Analytics and revenue tracking'];

  const TESTIMONIALS = ar ? [
    { quote: 'وفّرت لنا المنصة ساعات كل أسبوع. لا مزيد من إدارة الطلبات على واتساب.', name: 'أحمد الراشدي', role: 'مدير المشتريات، ريتيل كو الكويت' },
    { quote: 'إيرادات علامتنا من الجملة ارتفعت ٤٠٪ في الأشهر الثلاثة الأولى.', name: 'سارة المطيري', role: 'المؤسسة، غلف تك سوليوشنز' },
    { quote: 'أخيراً منصة احترافية للبيع بالجملة في الكويت. متأخرة كثيراً لكنها جاءت!', name: 'خالد الراشد', role: 'صاحب، كويت فاشون هاوس' },
  ] : [
    { quote: 'Kuwait B2B Hub saved us hours every week. No more managing orders on WhatsApp.', name: 'Ahmed Al-Rashidi', role: 'Procurement Manager, RetailCo Kuwait' },
    { quote: 'Our brand revenue from wholesale increased 40% in the first 3 months.', name: 'Sara Al-Mutairi', role: 'Founder, Gulf Tech Solutions' },
    { quote: 'Finally a professional platform for B2B in Kuwait. Long overdue.', name: 'Khalid Al-Rashid', role: 'Owner, Kuwait Fashion House' },
  ];

  const PRICING = ar ? [
    { badge: 'للمشترين', price: 'مجاني', sub: 'مجاناً دائماً للمشترين التجاريين', features: ['تصفّح جميع العلامات', 'تقديم طلبات الشراء', 'تتبّع الطلبات', 'لوحة تحكم أساسية'], cta: 'ابدأ التصفّح', ctaStyle: 'secondary', featured: false },
    { badge: 'الأكثر شعبية', price: 'KD 29', priceSub: '/ شهر', sub: 'للعلامات النامية', features: ['ملف علامة تجارية واحد', 'حتى ٥٠ منتجاً', 'إدارة الطلبات', 'تحليلات أساسية', 'دعم بالبريد الإلكتروني', 'شارة الموثّق'], cta: 'أدرج علامتك', ctaStyle: 'primary', featured: true },
    { badge: 'للتوسّع', price: 'KD 79', priceSub: '/ شهر', sub: 'للعلامات الراسخة', features: ['كل ما في الخطة الأساسية', 'منتجات غير محدودة', 'تحليلات متقدمة', 'توثيق ذو أولوية', 'تسعير متعدد العملات', 'وصول API', 'مدير حساب مخصص'], cta: 'تواصل معنا', ctaStyle: 'secondary', featured: false },
  ] : [
    { badge: 'For Buyers', price: 'Free', sub: 'Always free for business buyers', features: ['Browse all brands', 'Submit order requests', 'Track orders', 'Basic dashboard'], cta: 'Start Browsing', ctaStyle: 'secondary', featured: false },
    { badge: 'Most Popular', price: 'KD 29', priceSub: '/ month', sub: 'For growing brands', features: ['1 brand profile', 'Up to 50 products', 'Order management', 'Basic analytics', 'Email support', 'Verified badge'], cta: 'List Your Brand', ctaStyle: 'primary', featured: true },
    { badge: 'For Scale', price: 'KD 79', priceSub: '/ month', sub: 'For established brands', features: ['Everything in Starter', 'Unlimited products', 'Advanced analytics', 'Priority verification', 'Multi-currency pricing', 'API access', 'Dedicated account manager'], cta: 'Contact Sales', ctaStyle: 'secondary', featured: false },
  ];

  const dir = ar ? 'rtl' : 'ltr';
  const row = ar ? 'row-reverse' : 'row';

  return (
    <div className="lp-root" dir={dir}>

      {/* ── LANDING NAV ──────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-logo">
            <div className="lp-nav-logo-icon"><Store size={15} color="white" /></div>
            <span>B2BHub</span>
            <span className="lp-nav-tag">Kuwait</span>
          </Link>

          {/* Desktop nav links */}
          <div className="lp-nav-links desktop-only">
            <a href="#how-it-works">{ar ? 'كيف تعمل' : 'How it Works'}</a>
            <a href="#pricing">{ar ? 'الأسعار' : 'Pricing'}</a>
            <Link href="/marketplace">{ar ? 'السوق' : 'Marketplace'}</Link>
          </div>

          <div className="lp-nav-actions">
            <Link href="/login" className="lp-nav-signin desktop-only">{ar ? 'تسجيل الدخول' : 'Sign In'}</Link>
            <Link href="/register" className="lp-btn-primary lp-btn-sm">{ar ? 'ابدأ مجاناً' : 'Get Started'}</Link>
            <button className="lp-nav-hamburger mobile-only" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="lp-mobile-menu">
          <button className="lp-mobile-menu-close" onClick={() => setMobileMenu(false)}><X size={22} /></button>
          <Link href="/marketplace" onClick={() => setMobileMenu(false)}>{ar ? 'السوق' : 'Marketplace'}</Link>
          <a href="#how-it-works" onClick={() => setMobileMenu(false)}>{ar ? 'كيف تعمل' : 'How it Works'}</a>
          <a href="#pricing" onClick={() => setMobileMenu(false)}>{ar ? 'الأسعار' : 'Pricing'}</a>
          <Link href="/login" onClick={() => setMobileMenu(false)}>{ar ? 'تسجيل الدخول' : 'Sign In'}</Link>
          <Link href="/register" className="lp-btn-primary" onClick={() => setMobileMenu(false)}>{ar ? 'إنشاء حساب' : 'Get Started Free'}</Link>
        </div>
      )}

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          {/* Badge */}
          <div className="lp-hero-badge">
            <span>🇰🇼</span>
            {ar ? 'أول منصة B2B للجملة في الكويت' : "Kuwait's First B2B Wholesale Platform"}
          </div>

          {/* H1 */}
          <h1 className="lp-hero-h1">
            {ar ? 'منصة الجملة المصمّمة للكويت' : 'The Wholesale Marketplace Built for Kuwait'}
          </h1>

          {/* Subheadline */}
          <p className="lp-hero-sub">
            {ar
              ? 'تواصل مباشرة مع العلامات الكويتية الموثّقة. تصفّح كتالوجات الجملة وتفاوض على الشروط وأبرم الصفقات الكبيرة — في مكان واحد.'
              : 'Connect directly with verified Kuwaiti brands. Browse wholesale catalogs, negotiate terms, and place bulk orders — all in one place.'}
          </p>

          {/* CTA Buttons */}
          <div className="lp-hero-ctas" style={{ flexDirection: row }}>
            <Link href="/register?role=buyer" className="lp-btn-primary lp-btn-lg">
              {ar ? 'ابدأ كمشترٍ' : 'Start as a Buyer'}
            </Link>
            <Link href="/register?role=brand" className="lp-btn-secondary lp-btn-lg">
              {ar ? 'أدرج علامتك' : 'List Your Brand'}
            </Link>
          </div>
          <p className="lp-hero-note">
            {ar ? 'مجاني تماماً · لا بطاقة ائتمانية' : 'Free to join · No credit card required'}
          </p>

          {/* Browser Mockup */}
          <div className="lp-browser-wrap">
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: STATS BAR ─────────────────────────────────────────────── */}
      <section className="lp-stats-bar">
        <div className="lp-stats-inner" style={{ flexDirection: row }}>
          {[
            { num: ar ? '٢٤+' : '24+', label: ar ? 'علامة نشطة' : 'Active Brands' },
            { num: ar ? '٥٠٠+' : '500+', label: ar ? 'منتج مدرج' : 'Products Listed' },
            { num: ar ? '١٠٠٪' : '100%', label: ar ? 'موردون موثّقون' : 'Verified Suppliers' },
            { num: ar ? '+KD 50,000' : 'KD 50,000+', label: ar ? 'إجمالي المعاملات' : 'in Transactions' },
          ].map((s, i) => (
            <div key={i} className="lp-stat-item" style={{ flexDirection: ar ? 'row-reverse' : 'row' }}>
              <div className="lp-stat-inner">
                <span className="lp-stat-num">{s.num}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
              {i < 3 && <div className="lp-stat-divider" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2.5: PROBLEM ─────────────────────────────────────────────── */}
      <ProblemSection ar={ar} />

      {/* ── SECTION 5: HOW IT WORKS ──────────────────────────────────────────── */}
      <section ref={howItWorks.ref as React.RefObject<HTMLElement>} className="lp-section lp-hiw" id="how-it-works" style={howItWorks.style}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">{ar ? 'كيف تعمل' : 'How It Works'}</div>
            <h2 className="lp-section-title">{ar ? 'من الاكتشاف إلى الصفقة في ٤ خطوات' : 'From Discovery to Deal in 4 Steps'}</h2>
            <p className="lp-section-sub">{ar ? 'منصة B2B مصمَّمة خصيصاً لكيفية سير تجارة الجملة في الكويت' : 'A B2B platform designed around how wholesale trade actually works in Kuwait'}</p>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="lp-hiw-track desktop-only">
            <div className="lp-hiw-line" />
            {STEPS.map((step, i) => (
              <div key={i} className="lp-hiw-step">
                <div className="lp-hiw-node" style={{ borderColor: step.color }}>
                  <div className="lp-hiw-node-fill" style={{ background: step.color }}>
                    <span style={{ fontSize: 20 }}>{step.icon}</span>
                  </div>
                  <div className="lp-hiw-node-num" style={{ background: step.color }}>{step.num}</div>
                </div>
                <div className="lp-hiw-step-content" style={{ textAlign: ar ? 'right' : 'left' }}>
                  <h3 className="lp-hiw-title">{step.title}</h3>
                  <p className="lp-hiw-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: vertical list */}
          <div className="lp-hiw-mobile mobile-only">
            {STEPS.map((step, i) => (
              <div key={i} className="lp-hiw-mobile-step" style={{ flexDirection: row }}>
                <div className="lp-hiw-mobile-left" style={{ alignItems: ar ? 'flex-end' : 'flex-start' }}>
                  <div className="lp-hiw-mobile-circle" style={{ background: step.color }}>
                    <span style={{ fontSize: 18 }}>{step.icon}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="lp-hiw-mobile-vline" />}
                </div>
                <div className="lp-hiw-mobile-content" style={{ textAlign: ar ? 'right' : 'left' }}>
                  <div className="lp-hiw-mobile-num" style={{ color: step.color }}>{ar ? `الخطوة ${step.num}` : `Step ${step.num}`}</div>
                  <h3 className="lp-hiw-title">{step.title}</h3>
                  <p className="lp-hiw-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FOR BUYERS vs BRANDS ─────────────────────────────────── */}
      <section ref={forBothSides.ref as React.RefObject<HTMLElement>} className="lp-section lp-section-alt" style={forBothSides.style}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">{ar ? 'لمن هذه المنصة؟' : 'Who Is It For?'}</div>
            <h2 className="lp-section-title">{ar ? 'مصمَّم لكلا طرفَي الصفقة' : 'Built for Both Sides of the Deal'}</h2>
          </div>

          <div className="lp-two-col" style={{ flexDirection: row }}>
            {/* Buyers */}
            <div className="lp-value-card lp-value-buyer" style={{ textAlign: ar ? 'right' : 'left' }}>
              <div className="lp-value-tag lp-value-tag-blue" style={{ alignSelf: ar ? 'flex-end' : 'flex-start' }}>
                {ar ? 'للمشترين' : 'For Buyers'}
              </div>
              <div className="lp-value-icon-wrap" style={{ background: '#DBEAFE', alignSelf: ar ? 'flex-end' : 'flex-start' }}>
                <ShoppingBag size={26} color="#2563EB" />
              </div>
              <h3 className="lp-value-title">{ar ? 'للمشترين التجاريين' : 'For Business Buyers'}</h3>
              <p className="lp-value-desc">{ar ? 'اكتشف موردي الجملة الموثّقين وقدّم طلباتك في مكان واحد.' : 'Discover verified wholesale suppliers and manage all orders in one place.'}</p>
              <ul className="lp-bullet-list">
                {BUYER_BULLETS.map((b, i) => (
                  <li key={i} style={{ flexDirection: row }}>
                    <span className="lp-check lp-check-blue"><Check size={11} /></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?role=buyer" className="lp-value-cta lp-value-cta-blue">
                {ar ? 'ابدأ الشراء بالجملة' : 'Start Buying Wholesale'}
              </Link>
            </div>

            {/* Brands */}
            <div className="lp-value-card lp-value-brand" style={{ textAlign: ar ? 'right' : 'left' }}>
              <div className="lp-value-tag lp-value-tag-green" style={{ alignSelf: ar ? 'flex-end' : 'flex-start' }}>
                {ar ? 'للعلامات' : 'For Brands'}
              </div>
              <div className="lp-value-icon-wrap" style={{ background: '#DCFCE7', alignSelf: ar ? 'flex-end' : 'flex-start' }}>
                <Store size={26} color="#16A34A" />
              </div>
              <h3 className="lp-value-title">{ar ? 'لأصحاب العلامات التجارية' : 'For Brand Owners'}</h3>
              <p className="lp-value-desc">{ar ? 'احصل على واجهة متجر احترافية وأدر طلبات الجملة بكفاءة.' : 'Get a professional storefront and manage wholesale orders with ease.'}</p>
              <ul className="lp-bullet-list">
                {BRAND_BULLETS.map((b, i) => (
                  <li key={i} style={{ flexDirection: row }}>
                    <span className="lp-check lp-check-green"><Check size={11} /></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?role=brand" className="lp-value-cta lp-value-cta-green">
                {ar ? 'أدرج علامتك مجاناً' : 'List Your Brand Free'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FEATURED BRANDS ───────────────────────────────────────── */}
      <section ref={featuredSection.ref as React.RefObject<HTMLElement>} className="lp-section" style={featuredSection.style}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">{ar ? 'العلامات المميزة' : 'Featured Brands'}</div>
            <h2 className="lp-section-title">{ar ? 'تثق به أبرز العلامات الكويتية' : "Trusted by Kuwait's Top Brands"}</h2>
            <p className="lp-section-sub">{ar ? 'انضم إلى هؤلاء الموردين الموثّقين على المنصة' : 'Join these verified suppliers already on the platform'}</p>
          </div>

          <div className="lp-brand-cards">
            {(featuredBrands.length > 0 ? featuredBrands : [
              { id: '1', brand_name: 'Kuwait Fashion House', logo_url: '', verification_tier: 'premium', description: ar ? 'أزياء كويتية أصيلة بالجملة — كانديورات، عبايات، وملابس موسمية.' : 'Authentic Kuwaiti fashion wholesale — kanduras, abayas, seasonal wear.' },
              { id: '2', brand_name: 'Gulf Tech Solutions', logo_url: '', verification_tier: 'verified', description: ar ? 'مستلزمات التكنولوجيا ومعدات المكاتب بأسعار جملة تنافسية.' : 'Tech accessories and office equipment at competitive wholesale rates.' },
              { id: '3', brand_name: 'Desert Rose Beauty', logo_url: '', verification_tier: 'premium', description: ar ? 'مستحضرات تجميل فاخرة بالعود والمسك، مُصنَّعة في الكويت.' : 'Luxury oud and musk beauty products, manufactured in Kuwait.' },
            ] as FeaturedBrand[]).map((brand, i) => {
              const CARD_META = [
                { rating: 4.8, fulfilled: 428, products: 64, category: ar ? 'أزياء وملابس' : 'Fashion & Apparel' },
                { rating: 4.9, fulfilled: 112, products: 38, category: ar ? 'إلكترونيات' : 'Electronics & Tech' },
                { rating: 4.5, fulfilled: 86, products: 21, category: ar ? 'تجميل وعناية' : 'Beauty & Cosmetics' },
              ];
              const meta = CARD_META[i] ?? CARD_META[0];
              const tierLabel = brand.verification_tier === 'premium'
                ? (ar ? '✦ بريميوم موثّق' : '✦ Premium Verified')
                : brand.verification_tier === 'verified'
                  ? (ar ? '✓ موثّق' : '✓ Verified')
                  : (ar ? 'مورد جديد' : 'New Supplier');
              const tierClass = brand.verification_tier === 'premium' ? 'lp-brand-tier-premium' : brand.verification_tier === 'verified' ? 'lp-brand-tier-verified' : 'lp-brand-tier-new';

              // Deterministic initials from brand name
              const words = brand.brand_name.trim().split(/\s+/);
              const initials = words.length >= 2 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
              const PALETTE = ['#1A1A2E', '#2563EB', '#0D9488', '#7C3AED', '#D97706'];
              const bgColor = PALETTE[brand.brand_name.charCodeAt(0) % PALETTE.length];

              return (
                <div key={brand.id} className="lp-brand-card" style={{ animationDelay: `${i * 80}ms` }}>
                  {/* Card header */}
                  <div className="lp-brand-card-head" style={{ flexDirection: row }}>
                    <div className="lp-brand-logo-wrap">
                      {brand.logo_url
                        ? <img src={brand.logo_url} alt={brand.brand_name} className="lp-brand-logo-img" />
                        : <div className="lp-brand-logo-fallback" style={{ background: bgColor }}>{initials.toUpperCase()}</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: ar ? 'right' : 'left' }}>
                      <div className="lp-brand-name">{brand.brand_name}</div>
                      <div className="lp-brand-cat">{meta.category}</div>
                    </div>
                    <span className={`lp-brand-tier ${tierClass}`}>{tierLabel}</span>
                  </div>

                  {/* Description */}
                  {brand.description && (
                    <p className="lp-brand-desc" style={{ textAlign: ar ? 'right' : 'left' }}>{brand.description}</p>
                  )}

                  {/* Stats row */}
                  <div className="lp-brand-stats-row" style={{ flexDirection: row }}>
                    <div className="lp-brand-stat">
                      <span className="lp-brand-stat-val">⭐ {meta.rating}</span>
                      <span className="lp-brand-stat-key">{ar ? 'التقييم' : 'Rating'}</span>
                    </div>
                    <div className="lp-brand-stat-div" />
                    <div className="lp-brand-stat">
                      <span className="lp-brand-stat-val">{meta.fulfilled}</span>
                      <span className="lp-brand-stat-key">{ar ? 'طلب منجز' : 'Fulfilled'}</span>
                    </div>
                    <div className="lp-brand-stat-div" />
                    <div className="lp-brand-stat">
                      <span className="lp-brand-stat-val">{meta.products}</span>
                      <span className="lp-brand-stat-key">{ar ? 'منتج' : 'Products'}</span>
                    </div>
                  </div>

                  <Link href={`/brands/${brand.id}`} className="lp-brand-cta">
                    {ar ? 'عرض الكتالوج' : 'View Catalog'}
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/marketplace" className="lp-btn-secondary" style={{ display: 'inline-flex', gap: 8 }}>
              {ar ? 'عرض جميع العلامات' : 'View All Brands'}
              <span style={{ fontSize: 16 }}>{ar ? '←' : '→'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: TESTIMONIALS ──────────────────────────────────────────── */}
      <section ref={testimonialsSection.ref as React.RefObject<HTMLElement>} className="lp-section lp-section-alt" style={testimonialsSection.style}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">{ar ? 'آراء المستخدمين' : 'User Stories'}</div>
            <h2 className="lp-section-title">{ar ? 'ماذا يقول مستخدمونا' : 'What Our Users Say'}</h2>
            <p className="lp-section-sub">{ar ? 'قصص حقيقية من موردين ومشترين على المنصة' : 'Real stories from suppliers and buyers on the platform'}</p>
          </div>

          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => {
              const AVATAR_COLORS = ['#1A1A2E', '#2563EB', '#0D9488'];
              const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const initial = t.name.charAt(0);
              return (
                <div
                  key={i}
                  className="lp-testimonial-card"
                  style={{
                    textAlign: ar ? 'right' : 'left',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  {/* Decorative quote mark */}
                  <div className="lp-testimonial-quote-mark" style={{ [ar ? 'right' : 'left']: 20 }}>"</div>

                  {/* Stars */}
                  <div className="lp-stars" aria-label="5 out of 5 stars">
                    {'★'.repeat(5)}
                  </div>

                  {/* Quote text */}
                  <p className="lp-testimonial-quote">{t.quote}</p>

                  {/* Author */}
                  <div className="lp-testimonial-author" style={{ flexDirection: row }}>
                    <div className="lp-testimonial-avatar" style={{ background: avatarBg }}>
                      {initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lp-testimonial-name">{t.name}</div>
                      <div className="lp-testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: PRICING ───────────────────────────────────────────────── */}
      <section ref={pricingSection.ref as React.RefObject<HTMLElement>} className="lp-section" id="pricing" style={pricingSection.style}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">{ar ? 'الأسعار' : 'Pricing'}</div>
            <h2 className="lp-section-title">{ar ? 'أسعار بسيطة وشفافة' : 'Simple, Transparent Pricing'}</h2>
            <p className="lp-section-sub">{ar ? 'ابدأ مجاناً. وسّع أعمالك مع نمو نشاطك.' : 'Start free. Upgrade as you grow.'}</p>
          </div>

          <div className="lp-pricing-grid">
            {PRICING.map((plan, i) => (
              <div key={i} className={`lp-pricing-card${plan.featured ? ' lp-pricing-featured' : ''}`}>

                {/* Tier label / popular badge */}
                {plan.featured
                  ? <div className="lp-pricing-popular-pill">{plan.badge}</div>
                  : <div className="lp-pricing-tier-label">{plan.badge}</div>
                }

                {/* Price */}
                <div className="lp-pricing-price" dir="ltr">
                  <span className="lp-pricing-amount">{plan.price}</span>
                  {plan.priceSub && <span className="lp-pricing-period">{plan.priceSub}</span>}
                </div>
                <p className="lp-pricing-sub">{plan.sub}</p>

                {/* Trial note for featured plan */}
                {plan.featured && (
                  <div className="lp-pricing-trial">
                    {ar ? '✓ تجربة مجانية ١٤ يوماً · بدون بطاقة ائتمانية' : '✓ 14-day free trial · No credit card required'}
                  </div>
                )}

                {/* Divider */}
                <div className="lp-pricing-divider" />

                {/* Features */}
                <ul className="lp-pricing-features">
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ flexDirection: row }}>
                      <Check size={14} color={plan.featured ? '#2563EB' : '#16A34A'} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={
                    plan.ctaStyle === 'primary'
                      ? '/register?role=brand'
                      : i === 2
                        ? '/register'
                        : '/register?role=buyer'
                  }
                  className={
                    plan.featured
                      ? 'lp-btn-primary lp-btn-full'
                      : i === 2
                        ? 'lp-pricing-cta-ghost lp-btn-full'
                        : 'lp-btn-secondary lp-btn-full'
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="lp-pricing-note">
            {ar
              ? 'جميع الأسعار بالدينار الكويتي · متوفر بالريال السعودي والدرهم الإماراتي لعلامات الخليج'
              : 'All prices in KWD · SAR and AED pricing available for GCC brands'}
          </p>
        </div>
      </section>

      {/* ── SECTION 10: FAQ ──────────────────────────────────────────────────── */}
      <section ref={faqSection.ref as React.RefObject<HTMLElement>} className="lp-section lp-section-alt" id="faq" style={faqSection.style}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">{ar ? 'الأسئلة الشائعة' : 'FAQ'}</div>
            <h2 className="lp-section-title">{ar ? 'أسئلة يسألها الجميع' : 'Questions We Get All the Time'}</h2>
            <p className="lp-section-sub">{ar ? 'لم تجد إجابتك؟ راسلنا مباشرة.' : "Can't find an answer? Reach out directly."}</p>
          </div>

          <div className="lp-faq">
            {faq.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`lp-faq-item${isOpen ? ' lp-faq-open' : ''}`}>
                  <button
                    className="lp-faq-q"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="lp-faq-q-text">{item.q}</span>
                    <span className="lp-faq-chevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="lp-faq-a" style={{ textAlign: ar ? 'right' : 'left' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still have questions CTA */}
          <div className="lp-faq-footer" style={{ flexDirection: row }}>
            <div className="lp-faq-footer-icon">💬</div>
            <div style={{ textAlign: ar ? 'right' : 'left' }}>
              <div className="lp-faq-footer-title">{ar ? 'لا تزال لديك أسئلة؟' : 'Still have questions?'}</div>
              <div className="lp-faq-footer-sub">
                {ar ? 'فريقنا يرد خلال ساعات العمل. ' : "Our team responds within business hours. "}
                <a href="mailto:hello@kuwaitb2bhub.com" className="lp-faq-footer-link">
                  {ar ? 'راسلنا الآن' : 'Email us now'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 11: FINAL CTA ────────────────────────────────────────────── */}
      <section
        ref={ctaSection.ref as React.RefObject<HTMLElement>}
        className="lp-cta-section"
        style={ctaSection.style}
      >
        {/* Decorative grid overlay */}
        <div className="lp-cta-grid-bg" aria-hidden="true" />

        <div className="lp-container lp-cta-inner">
          {/* Eyebrow */}
          <div className="lp-cta-eyebrow">
            {ar ? '🚀 ابدأ اليوم' : '🚀 Get Started Today'}
          </div>

          {/* Headline */}
          <h2 className="lp-cta-title">
            {ar
              ? 'هل أنت مستعد لتحويل أعمالك بالجملة؟'
              : 'Ready to Transform Your\u00A0Wholesale Business?'}
          </h2>

          {/* Sub */}
          <p className="lp-cta-sub">
            {ar
              ? 'انضم إلى ٢٤+ علامة تجارية موثّقة وأكثر من ١٠٠ مشترٍ يستخدمون المنصة اليوم'
              : 'Join 24+ verified brands and 100+ buyers already growing on Kuwait B2B Hub'}
          </p>

          {/* Trust micro-badges */}
          <div className="lp-cta-trust" style={{ flexDirection: row }}>
            {[
              ar ? '✓ بدون بطاقة ائتمانية' : '✓ No credit card required',
              ar ? '✓ تجربة مجانية ١٤ يوماً' : '✓ 14-day free trial',
              ar ? '✓ إلغاء في أي وقت' : '✓ Cancel anytime',
            ].map((badge, i) => (
              <span key={i} className="lp-cta-trust-badge">{badge}</span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="lp-cta-btns" style={{ flexDirection: row }}>
            <Link href="/register" className="lp-btn-white lp-btn-lg">
              {ar ? 'ابدأ مجاناً' : 'Get Started Free'}
            </Link>
            <Link href="/marketplace" className="lp-btn-outline-white lp-btn-lg">
              {ar ? 'تصفّح السوق' : 'Browse Marketplace'}
            </Link>
          </div>

          {/* Escape hatch */}
          <p className="lp-cta-signin">
            {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
            <Link href="/login" className="lp-cta-signin-link">
              {ar ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </div>
      </section>

      {/* ── SECTION 12: FOOTER ───────────────────────────────────────────────── */}
      <footer
        ref={footerSection.ref as React.RefObject<HTMLElement>}
        className="lp-footer"
        style={footerSection.style}
      >
        <div className="lp-footer-inner">

          {/* GCC markets strip */}
          <div className="lp-footer-markets" style={{ flexDirection: row }}>
            <span className="lp-footer-markets-label">{ar ? 'الأسواق المخدومة:' : 'Markets served:'}</span>
            {['🇰🇼 Kuwait', '🇸🇦 Saudi Arabia', '🇦🇪 UAE', '🇧🇭 Bahrain'].map(m => (
              <span key={m} className="lp-footer-market-pill">{m}</span>
            ))}
          </div>

          {/* Main grid */}
          <div className="lp-footer-grid">

            {/* Col 1 — Brand */}
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">
                <div className="lp-nav-logo-icon" style={{ width: 30, height: 30 }}>
                  <Store size={14} color="white" />
                </div>
                <span>B2BHub Kuwait</span>
              </div>
              <p className="lp-footer-tagline">
                {ar
                  ? 'المنصة الاحترافية الأولى للجملة بين الشركات في الكويت'
                  : "Kuwait's first professional B2B wholesale platform"}
              </p>
              <div className="lp-footer-socials" style={{ flexDirection: row }}>
                <a href="mailto:hello@kuwaitb2bhub.com" aria-label="Email us">
                  <Mail size={16} />
                </a>
                <a href="#" aria-label="Website">
                  <Globe size={16} />
                </a>
              </div>
              <div className="lp-footer-lang-note">
                {ar ? '🌐 متوفر بالعربية والإنجليزية' : '🌐 Available in Arabic & English'}
              </div>
            </div>

            {/* Col 2 — Platform */}
            <div className="lp-footer-col">
              <h4>{ar ? 'المنصة' : 'Platform'}</h4>
              <Link href="/marketplace">{ar ? 'تصفّح السوق' : 'Marketplace'}</Link>
              <Link href="/register?role=buyer">{ar ? 'للمشترين' : 'For Buyers'}</Link>
              <Link href="/register?role=brand">{ar ? 'للعلامات' : 'For Brands'}</Link>
              <a href="#pricing">{ar ? 'الأسعار' : 'Pricing'}</a>
              <a href="#how-it-works">{ar ? 'كيف تعمل' : 'How It Works'}</a>
              <a href="#faq">{ar ? 'الأسئلة الشائعة' : 'FAQ'}</a>
            </div>

            {/* Col 3 — Company */}
            <div className="lp-footer-col">
              <h4>{ar ? 'الشركة' : 'Company'}</h4>
              <a href="#">{ar ? 'من نحن' : 'About Us'}</a>
              <a href="#">{ar ? 'المدوّنة' : 'Blog'}</a>
              <a href="#">{ar ? 'وظائف' : 'Careers'}</a>
              <a href="#">{ar ? 'الصحافة' : 'Press'}</a>
              <a href="mailto:hello@kuwaitb2bhub.com">{ar ? 'تواصل معنا' : 'Contact'}</a>
            </div>

            {/* Col 4 — Legal */}
            <div className="lp-footer-col">
              <h4>{ar ? 'قانوني' : 'Legal'}</h4>
              <a href="#">{ar ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
              <a href="#">{ar ? 'شروط الخدمة' : 'Terms of Service'}</a>
              <a href="#">{ar ? 'سياسة الكوكيز' : 'Cookie Policy'}</a>
              <a href="#">{ar ? 'إخلاء المسؤولية' : 'Disclaimer'}</a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="lp-footer-bottom" style={{ flexDirection: row }}>
            <span>
              © {new Date().getFullYear()} Kuwait B2B Hub.{' '}
              {ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </span>
            <span className="lp-footer-made">
              🇰🇼 {ar ? 'صُنع بشغف في الكويت' : 'Made with ❤️ in Kuwait'}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
