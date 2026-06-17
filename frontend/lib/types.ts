// Shared domain types mirroring the Supabase schema.

export type UserRole = "buyer" | "seller" | "admin";
export type SellerStatus = "pending" | "approved" | "rejected" | "suspended";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type TicketStatus = "valid" | "used" | "cancelled" | "expired";
export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";
export type PayoutMethod = "bank" | "paypal" | "wise" | "mpesa" | "crypto" | "other";
export type PromotionStatus = "pending_payment" | "paid" | "active" | "rejected" | "expired";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  country: string | null;
  created_at: string;
}

export interface Seller {
  id: string;
  user_id: string;
  business_name: string;
  legal_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  country: string;
  city: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  id_document_url: string | null;
  status: SellerStatus;
  commission_rate: number | null;
  total_sales: number;
  total_paid_out: number;
  available_balance: number;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_onboarded: boolean;
  created_at: string;
}

export interface PayoutAccount {
  id: string;
  seller_id: string;
  method: PayoutMethod;
  label: string | null;
  account_name: string;
  account_number: string | null;
  bank_name: string | null;
  iban: string | null;
  swift: string | null;
  routing_number: string | null;
  paypal_email: string | null;
  other_details: string | null;
  currency: string;
  is_primary: boolean;
  created_at: string;
}

export interface EventRecord {
  id: string;
  seller_id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  cover_image_url: string | null;
  gallery: string[];
  status: EventStatus;
  featured: boolean;
  pinned: boolean;
  pinned_until: string | null;
  views: number;
  created_at: string;
  updated_at: string;
  // joined
  ticket_types?: TicketType[];
  seller?: Seller;
}

export interface PromotionPlan {
  id: string;
  name: string;
  description: string | null;
  placement: string;
  duration_days: number;
  price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

export interface EventPromotion {
  id: string;
  event_id: string;
  seller_id: string;
  plan_id: string | null;
  plan_name: string | null;
  placement: string | null;
  duration_days: number | null;
  amount: number;
  currency: string;
  status: PromotionStatus;
  stripe_session_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  // joined
  event?: Partial<EventRecord>;
  seller?: Partial<Seller>;
  plan?: Partial<PromotionPlan>;
}

export interface TicketDesign {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  layout?: "classic" | "modern" | "minimal" | "festival";
  logoUrl?: string;
  bannerUrl?: string;
  perks?: string[];
  terms?: string;
  showQr?: boolean;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  max_per_order: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  design: TicketDesign;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  order_number: string;
  event_id: string | null;
  seller_id: string | null;
  buyer_email: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  currency: string;
  subtotal: number;
  service_fee: number;
  service_fee_rate: number;
  platform_fee: number;
  platform_fee_rate: number;
  total: number;
  status: OrderStatus;
  direct_payout: boolean;
  stripe_session_id: string | null;
  created_at: string;
  order_items?: OrderItem[];
  event?: EventRecord;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string | null;
  ticket_type_name: string | null;
  unit_price: number;
  quantity: number;
}

export interface Ticket {
  id: string;
  order_id: string;
  event_id: string | null;
  ticket_type_id: string | null;
  reference_number: string;
  qr_token: string;
  holder_name: string | null;
  holder_email: string | null;
  seat: string | null;
  status: TicketStatus;
  scanned_at: string | null;
  scan_count: number;
  created_at: string;
}

export interface Payout {
  id: string;
  seller_id: string;
  payout_account_id: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  notes: string | null;
  reference: string | null;
  requested_at: string;
  processed_at: string | null;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string | null;
  type: string;
  image_url: string | null;
  link_url: string | null;
  cta_text: string | null;
  bg_color: string | null;
  text_color: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
}

export interface NewsArticle {
  id: string;
  external_id: string | null;
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  author: string | null;
  category: string;
  country: string | null;
  published_at: string | null;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface Settings {
  id: number;
  platform_fee_rate: number;
  service_fee_percent: number;
  service_fee_flat: number;
  payout_mode: "manual" | "stripe_connect";
  currency: string;
  payout_min: number;
  support_email: string;
  hero: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
  };
  footer: {
    about?: string;
    contactEmail?: string;
    contactPhone?: string;
    social?: Record<string, string>;
    columns?: FooterColumn[];
  };
  branding: { primary?: string; accent?: string; logoUrl?: string };
}
