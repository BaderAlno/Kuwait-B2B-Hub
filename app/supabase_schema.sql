-- =============================================================
-- B2BHub Kuwait — Supabase Schema
-- Generated from src/lib/db.ts
-- Run this entire script in the Supabase SQL Editor.
-- =============================================================

-- Enable the pgcrypto extension (needed for gen_random_uuid() on older PG versions)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- 1. PROFILES (replaces the "users" table)
--    Linked 1-to-1 with Supabase auth.users via the same UUID.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  email               TEXT        NOT NULL UNIQUE,
  role                TEXT        NOT NULL CHECK (role IN ('admin', 'brand_owner', 'buyer')),
  company_name        TEXT,                         -- NULL for buyers
  verification_status TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  whatsapp_number     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read & update their own profile
CREATE POLICY "profiles: owner read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: owner update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles: admin read"   ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 2. BRANDS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name           TEXT        NOT NULL,
  description          TEXT        NOT NULL DEFAULT '',
  logo_url             TEXT        NOT NULL DEFAULT '',
  status               TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_tier    TEXT        DEFAULT 'new'
                                   CHECK (verification_tier IN ('premium', 'verified', 'new')),
  whatsapp_number      TEXT,
  business_hours       TEXT,
  auto_reply_message   TEXT,
  whatsapp_clicks      INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved brands
CREATE POLICY "brands: public read approved" ON public.brands FOR SELECT
  USING (status = 'approved');

-- Brand owners can see & update their own brand
CREATE POLICY "brands: owner read own"   ON public.brands FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "brands: owner update own" ON public.brands FOR UPDATE USING (owner_id = auth.uid());

-- Admins have full access
CREATE POLICY "brands: admin all" ON public.brands FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 3. PRODUCTS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id            UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  description         TEXT        NOT NULL DEFAULT '',
  price               NUMERIC(12, 3) NOT NULL CHECK (price >= 0),
  moq                 INTEGER     NOT NULL DEFAULT 1 CHECK (moq >= 1),
  stock               INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url           TEXT        NOT NULL DEFAULT '',
  -- Embedded array of { min_qty, max_qty | null, price } objects
  bulk_pricing_tiers  JSONB       NOT NULL DEFAULT '[]'::JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read products of approved brands
CREATE POLICY "products: authenticated read" ON public.products FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND status = 'approved')
  );

-- Brand owners can manage their own products
CREATE POLICY "products: owner all" ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid()));

-- Admins have full access
CREATE POLICY "products: admin all" ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 4. ORDERS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  brand_id      UUID        NOT NULL REFERENCES public.brands(id)   ON DELETE RESTRICT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  total_amount  NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own orders
CREATE POLICY "orders: buyer read own" ON public.orders FOR SELECT USING (buyer_id = auth.uid());

-- Brand owners can see orders for their brands
CREATE POLICY "orders: brand owner read" ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid()));

-- Buyers can create orders
CREATE POLICY "orders: buyer insert" ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Brand owners can update order status
CREATE POLICY "orders: brand owner update" ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid()));

-- Admins have full access
CREATE POLICY "orders: admin all" ON public.orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 5. ORDER ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES public.orders(id)   ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity    INTEGER     NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12, 3) NOT NULL CHECK (unit_price >= 0)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users who can see the order can see its items
CREATE POLICY "order_items: buyer read own" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid()));

CREATE POLICY "order_items: brand owner read" ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.brands b ON b.id = o.brand_id
    WHERE o.id = order_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "order_items: buyer insert" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid()));

CREATE POLICY "order_items: admin all" ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 6. MESSAGES
-- =============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Parties of the order (buyer + brand owner) can read messages
CREATE POLICY "messages: order parties read" ON public.messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.brands b ON b.id = o.brand_id
      WHERE o.id = order_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "messages: order parties insert" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.brands b ON b.id = o.brand_id
        WHERE o.id = order_id AND b.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "messages: admin all" ON public.messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 7. REVIEWS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     UUID        NOT NULL REFERENCES public.brands(id)  ON DELETE CASCADE,
  order_id     UUID                    REFERENCES public.orders(id) ON DELETE SET NULL,
  buyer_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating       SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content      TEXT        NOT NULL DEFAULT '',
  anonymous    BOOLEAN     NOT NULL DEFAULT FALSE,
  flagged      BOOLEAN     NOT NULL DEFAULT FALSE,
  brand_reply  TEXT,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'removed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read active, non-flagged reviews
CREATE POLICY "reviews: public read active" ON public.reviews FOR SELECT
  USING (status = 'active' AND flagged = FALSE);

-- Buyers can insert their own reviews
CREATE POLICY "reviews: buyer insert" ON public.reviews FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Brand owners can update their reply
CREATE POLICY "reviews: brand owner update reply" ON public.reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid()));

-- Admins have full access
CREATE POLICY "reviews: admin all" ON public.reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 8. BRAND TRUST
-- =============================================================
CREATE TABLE IF NOT EXISTS public.brand_trust (
  brand_id              UUID    PRIMARY KEY REFERENCES public.brands(id) ON DELETE CASCADE,
  response_rate         NUMERIC(5, 2) NOT NULL DEFAULT 0,
  completion_rate       NUMERIC(5, 2) NOT NULL DEFAULT 0,
  avg_response_hours    NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_fulfilled       INTEGER       NOT NULL DEFAULT 0,
  orders_this_month     INTEGER       NOT NULL DEFAULT 0,
  avg_fulfillment_days  NUMERIC(8, 2) NOT NULL DEFAULT 0,
  badges                JSONB         NOT NULL DEFAULT '[]'::JSONB
);

ALTER TABLE public.brand_trust ENABLE ROW LEVEL SECURITY;

-- Anyone can read trust scores
CREATE POLICY "brand_trust: public read" ON public.brand_trust FOR SELECT USING (TRUE);

-- Admins can manage trust scores
CREATE POLICY "brand_trust: admin all" ON public.brand_trust FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 9. BUYER TRUST
-- =============================================================
CREATE TABLE IF NOT EXISTS public.buyer_trust (
  buyer_id           UUID    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_orders       INTEGER       NOT NULL DEFAULT 0,
  completion_rate    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  cancellation_rate  NUMERIC(5, 2) NOT NULL DEFAULT 0,
  badges             JSONB         NOT NULL DEFAULT '[]'::JSONB
);

ALTER TABLE public.buyer_trust ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own trust score; brand owners can read buyers' trust scores
CREATE POLICY "buyer_trust: self read" ON public.buyer_trust FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "buyer_trust: brand owners read" ON public.buyer_trust FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'brand_owner'));

-- Admins have full access
CREATE POLICY "buyer_trust: admin all" ON public.buyer_trust FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- 10. NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  action_url  TEXT        NOT NULL DEFAULT '',
  icon_type   TEXT        NOT NULL DEFAULT 'info',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own notifications
CREATE POLICY "notifications: owner read"   ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications: owner update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications: owner delete" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- Admins can insert notifications for any user (server-side inserts also work via service role)
CREATE POLICY "notifications: admin insert" ON public.notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- =============================================================
-- INDEXES (performance)
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_brands_owner_id        ON public.brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_brands_status          ON public.brands(status);
CREATE INDEX IF NOT EXISTS idx_products_brand_id      ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id        ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id        ON public.orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_order_id      ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_brand_id       ON public.reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id       ON public.reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read     ON public.notifications(user_id, read);
