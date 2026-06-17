-- =============================================================================
-- Eventiko — 0005: Buyer service fee, seller commission, paid promotions
-- Additive & idempotent: safe to run on an existing database.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fees
--   * Seller commission: default moves to 5% (admin editable).
--   * Buyer service fee: a markup added at checkout (percent + flat), admin set.
-- ---------------------------------------------------------------------------
alter table settings
  add column if not exists service_fee_percent numeric not null default 5,
  add column if not exists service_fee_flat numeric not null default 0;

-- Move the seller commission default to 5% (only touch the row if still at the
-- old 8% default, so we never override an admin's custom value).
update settings set platform_fee_rate = 5 where id = 1 and platform_fee_rate = 8;

-- Record the buyer-side service fee on each order.
alter table orders
  add column if not exists service_fee numeric not null default 0,
  add column if not exists service_fee_rate numeric not null default 0;

-- ---------------------------------------------------------------------------
-- Events: paid pinning to the first page
-- ---------------------------------------------------------------------------
alter table events
  add column if not exists pinned boolean not null default false,
  add column if not exists pinned_until timestamptz;

create index if not exists events_pinned_idx on events (pinned, pinned_until);

-- ---------------------------------------------------------------------------
-- Promotion plans (admin-managed pricing — by placement, days, price)
-- ---------------------------------------------------------------------------
create table if not exists promotion_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  placement text not null default 'homepage',  -- homepage | featured | top
  duration_days integer not null default 7,
  price numeric not null default 0,
  currency text not null default 'EUR',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Event promotions (a seller's purchase/request, reviewed by an admin)
-- ---------------------------------------------------------------------------
do $$ begin
  create type promotion_status as enum ('pending_payment', 'paid', 'active', 'rejected', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists event_promotions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  seller_id uuid not null references sellers(id) on delete cascade,
  plan_id uuid references promotion_plans(id),
  plan_name text,
  placement text,
  duration_days integer,
  amount numeric not null default 0,
  currency text default 'EUR',
  status promotion_status not null default 'pending_payment',
  stripe_session_id text,
  stripe_payment_intent text,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists event_promotions_status_idx on event_promotions (status);
create index if not exists event_promotions_seller_idx on event_promotions (seller_id);
create index if not exists event_promotions_event_idx on event_promotions (event_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table promotion_plans  enable row level security;
alter table event_promotions enable row level security;

drop policy if exists "promotion plans public read" on promotion_plans;
create policy "promotion plans public read" on promotion_plans
  for select using (is_active or public.is_admin());

drop policy if exists "promotion plans admin write" on promotion_plans;
create policy "promotion plans admin write" on promotion_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- Sellers read their own promotions; admins read all. Inserts happen via the
-- backend (service role) at checkout; admins update (review/activate).
drop policy if exists "event promotions owner read" on event_promotions;
create policy "event promotions owner read" on event_promotions
  for select using (seller_id = public.current_seller_id() or public.is_admin());

drop policy if exists "event promotions admin update" on event_promotions;
create policy "event promotions admin update" on event_promotions
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Helper: expire promotions whose window has passed (callable from a cron)
-- ---------------------------------------------------------------------------
create or replace function public.expire_promotions()
returns void
language sql
security definer
set search_path = public
as $$
  update events set pinned = false
    where pinned = true and pinned_until is not null and pinned_until < now();
  update event_promotions set status = 'expired'
    where status = 'active' and ends_at is not null and ends_at < now();
$$;

-- ---------------------------------------------------------------------------
-- Seed default promotion plans (only if none exist)
-- ---------------------------------------------------------------------------
insert into promotion_plans (name, description, placement, duration_days, price, currency, sort_order)
select * from (values
  ('Homepage Spotlight — 7 days',  'Pin your event to the homepage spotlight for a week.', 'homepage', 7,  49,  'EUR', 1),
  ('Homepage Spotlight — 14 days', 'Two weeks of premium homepage placement.',            'homepage', 14, 89,  'EUR', 2),
  ('Homepage Spotlight — 30 days', 'Maximum exposure for a full month.',                  'homepage', 30, 149, 'EUR', 3)
) as v(name, description, placement, duration_days, price, currency, sort_order)
where not exists (select 1 from promotion_plans);
