-- =============================================================================
-- Eventiko — Core schema
-- Global events ticketing platform
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('buyer', 'seller', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type seller_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('draft', 'published', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('valid', 'used', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payout_status as enum ('pending', 'approved', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payout_method_type as enum ('bank', 'paypal', 'wise', 'mpesa', 'crypto', 'other');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Profiles (mirrors auth.users)
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'buyer',
  phone text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Sellers (organizers onboarded to sell tickets)
-- -----------------------------------------------------------------------------
create table if not exists sellers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  business_name text not null,
  legal_name text,
  contact_email text not null,
  contact_phone text,
  country text not null,
  city text,
  address text,
  website text,
  description text,
  logo_url text,
  id_document_url text,
  status seller_status not null default 'pending',
  commission_rate numeric,                  -- optional per-seller override of platform fee
  total_sales numeric default 0,
  total_paid_out numeric default 0,
  available_balance numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

-- -----------------------------------------------------------------------------
-- Payout accounts (max 3 per seller; enforced via trigger)
-- -----------------------------------------------------------------------------
create table if not exists payout_accounts (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references sellers(id) on delete cascade,
  method payout_method_type not null default 'bank',
  label text,
  account_name text not null,
  account_number text,
  bank_name text,
  iban text,
  swift text,
  routing_number text,
  paypal_email text,
  other_details text,
  currency text default 'EUR',
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Events
-- -----------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references sellers(id) on delete cascade,
  slug text unique not null,
  title text not null,
  description text,
  category text,
  venue_name text,
  address text,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text default 'Europe/Paris',
  cover_image_url text,
  gallery jsonb default '[]'::jsonb,
  status event_status not null default 'draft',
  featured boolean default false,
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists events_status_idx on events (status);
create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_seller_idx on events (seller_id);
create index if not exists events_country_idx on events (country);

-- -----------------------------------------------------------------------------
-- Ticket types (sellable tiers with full customization)
-- -----------------------------------------------------------------------------
create table if not exists ticket_types (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null default 0,
  currency text not null default 'EUR',
  quantity integer not null default 0,      -- total available
  sold integer not null default 0,
  max_per_order integer default 10,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,                  -- ticket expiry / sales close
  -- full ticket design customization
  design jsonb default '{}'::jsonb,          -- { primaryColor, accentColor, bgColor, textColor, layout, logoUrl, bannerUrl, perks[], terms, showQr }
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ticket_types_event_idx on ticket_types (event_id);

-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  event_id uuid references events(id),
  seller_id uuid references sellers(id),
  buyer_email text not null,
  buyer_name text,
  buyer_phone text,
  currency text not null default 'EUR',
  subtotal numeric not null default 0,
  platform_fee numeric not null default 0,
  platform_fee_rate numeric not null default 8,
  total numeric not null default 0,
  status order_status not null default 'pending',
  stripe_session_id text,
  stripe_payment_intent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_buyer_email_idx on orders (buyer_email);
create index if not exists orders_seller_idx on orders (seller_id);
create index if not exists orders_session_idx on orders (stripe_session_id);

-- -----------------------------------------------------------------------------
-- Order items
-- -----------------------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  ticket_type_id uuid references ticket_types(id),
  ticket_type_name text,
  unit_price numeric not null,
  quantity integer not null,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Tickets (individual issued tickets with QR + reference)
-- -----------------------------------------------------------------------------
create table if not exists tickets (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  event_id uuid references events(id),
  ticket_type_id uuid references ticket_types(id),
  reference_number text unique not null,     -- human friendly reference shown at the door
  qr_token text unique not null,             -- signed token embedded in QR image
  holder_name text,
  holder_email text,
  seat text,
  status ticket_status not null default 'valid',
  scanned_at timestamptz,
  scanned_by uuid references profiles(id),
  scan_count integer default 0,
  created_at timestamptz default now()
);

create index if not exists tickets_order_idx on tickets (order_id);
create index if not exists tickets_event_idx on tickets (event_id);
create index if not exists tickets_reference_idx on tickets (reference_number);

-- -----------------------------------------------------------------------------
-- Payouts (manually reviewed)
-- -----------------------------------------------------------------------------
create table if not exists payouts (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references sellers(id) on delete cascade,
  payout_account_id uuid references payout_accounts(id),
  amount numeric not null,
  currency text default 'EUR',
  status payout_status not null default 'pending',
  notes text,
  reference text,
  requested_at timestamptz default now(),
  processed_at timestamptz,
  processed_by uuid references profiles(id)
);

create index if not exists payouts_seller_idx on payouts (seller_id);
create index if not exists payouts_status_idx on payouts (status);

-- -----------------------------------------------------------------------------
-- Settings (singleton row id = 1)
-- -----------------------------------------------------------------------------
create table if not exists settings (
  id integer primary key default 1,
  platform_fee_rate numeric not null default 8,
  currency text default 'EUR',
  payout_min numeric default 50,
  support_email text default 'support@eventiko.com',
  hero jsonb default '{}'::jsonb,            -- { title, subtitle, ctaText, ctaLink, backgroundImage }
  footer jsonb default '{}'::jsonb,          -- { about, columns[], social{}, contactEmail, contactPhone }
  branding jsonb default '{}'::jsonb,        -- { primary, accent, logoUrl }
  updated_at timestamptz default now(),
  constraint settings_singleton check (id = 1)
);

-- -----------------------------------------------------------------------------
-- Broadcasts / promotions (hero banners)
-- -----------------------------------------------------------------------------
create table if not exists broadcasts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text,
  type text default 'promotion',             -- promotion | broadcast | announcement
  image_url text,
  link_url text,
  cta_text text,
  bg_color text,
  text_color text,
  is_active boolean default true,
  priority integer default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- News articles (aggregated from external sources)
-- -----------------------------------------------------------------------------
create table if not exists news_articles (
  id uuid primary key default uuid_generate_v4(),
  external_id text unique,                    -- hash of url to dedupe
  title text not null,
  summary text,
  url text not null,
  image_url text,
  source text,
  author text,
  category text default 'events',
  country text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists news_published_idx on news_articles (published_at desc);

-- -----------------------------------------------------------------------------
-- Scan logs (audit trail for ticket validation)
-- -----------------------------------------------------------------------------
create table if not exists scan_logs (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id),
  event_id uuid references events(id),
  scanned_by uuid references profiles(id),
  result text,                                -- valid | already_used | invalid | expired | wrong_event
  created_at timestamptz default now()
);

-- Seed the settings singleton
insert into settings (id) values (1) on conflict (id) do nothing;
