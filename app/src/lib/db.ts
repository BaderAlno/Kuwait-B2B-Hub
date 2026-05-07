import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'brand_owner' | 'buyer';
  company_name?: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  whatsapp_number?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  owner_id: string;
  brand_name: string;
  description: string;
  logo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_tier?: 'premium' | 'verified' | 'new';
  whatsapp_number?: string;
  business_hours?: string;
  auto_reply_message?: string;
  whatsapp_clicks?: number;
  created_at: string;
}

export interface BulkPricingTier {
  min_qty: number;
  max_qty: number | null;
  price: number;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  price: number;
  moq: number;
  stock: number;
  image_url: string;
  bulk_pricing_tiers: BulkPricingTier[];
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  brand_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Review {
  id: string;
  brand_id: string;
  order_id: string | null;
  buyer_id: string;
  rating: number;
  content: string;
  anonymous: boolean;
  flagged: boolean;
  brand_reply: string | null;
  status?: 'active' | 'removed';
  created_at: string;
}

export interface BrandTrust {
  brand_id: string;
  response_rate: number;
  completion_rate: number;
  avg_response_hours: number;
  total_fulfilled: number;
  orders_this_month: number;
  avg_fulfillment_days: number;
  badges: string[];
}

export interface BuyerTrust {
  buyer_id: string;
  total_orders: number;
  completion_rate: number;
  cancellation_rate: number;
  badges: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  action_url: string;
  icon_type: string;
  created_at: string;
}

export interface DB {
  users: User[];
  brands: Brand[];
  products: Product[];
  orders: Order[];
  order_items: OrderItem[];
  messages: Message[];
  reviews?: Review[];
  brand_trust?: BrandTrust[];
  buyer_trust?: BuyerTrust[];
  notifications?: Notification[];
}


export function readDB(): DB {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function generateId(prefix: string): string {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}-${uuid}`;
}
