-- =============================================================================
-- Eventiko — Row Level Security
-- The backend (Render) uses the service role key and bypasses RLS.
-- The frontend (Vercel) uses the anon key and is governed by these policies.
-- =============================================================================

alter table profiles        enable row level security;
alter table sellers         enable row level security;
alter table payout_accounts enable row level security;
alter table events          enable row level security;
alter table ticket_types    enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table tickets         enable row level security;
alter table payouts         enable row level security;
alter table settings        enable row level security;
alter table broadcasts      enable row level security;
alter table news_articles   enable row level security;
alter table scan_logs       enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles self read" on profiles;
create policy "profiles self read" on profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles self update" on profiles;
create policy "profiles self update" on profiles
  for update using (auth.uid() = id or public.is_admin());

-- ---------- sellers ----------
drop policy if exists "sellers public read approved" on sellers;
create policy "sellers public read approved" on sellers
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "sellers insert own" on sellers;
create policy "sellers insert own" on sellers
  for insert with check (user_id = auth.uid());

drop policy if exists "sellers update own" on sellers;
create policy "sellers update own" on sellers
  for update using (user_id = auth.uid() or public.is_admin());

-- ---------- payout_accounts ----------
drop policy if exists "payout accounts owner" on payout_accounts;
create policy "payout accounts owner" on payout_accounts
  for all using (seller_id = public.current_seller_id() or public.is_admin())
  with check (seller_id = public.current_seller_id() or public.is_admin());

-- ---------- events ----------
drop policy if exists "events public read published" on events;
create policy "events public read published" on events
  for select using (
    status = 'published'
    or seller_id = public.current_seller_id()
    or public.is_admin()
  );

drop policy if exists "events owner write" on events;
create policy "events owner write" on events
  for all using (seller_id = public.current_seller_id() or public.is_admin())
  with check (seller_id = public.current_seller_id() or public.is_admin());

-- ---------- ticket_types ----------
drop policy if exists "ticket types public read" on ticket_types;
create policy "ticket types public read" on ticket_types
  for select using (
    exists (select 1 from events e where e.id = ticket_types.event_id
      and (e.status = 'published' or e.seller_id = public.current_seller_id() or public.is_admin()))
  );

drop policy if exists "ticket types owner write" on ticket_types;
create policy "ticket types owner write" on ticket_types
  for all using (
    exists (select 1 from events e where e.id = ticket_types.event_id
      and (e.seller_id = public.current_seller_id() or public.is_admin()))
  )
  with check (
    exists (select 1 from events e where e.id = ticket_types.event_id
      and (e.seller_id = public.current_seller_id() or public.is_admin()))
  );

-- ---------- orders ----------
-- Orders are created and read through the backend (service role). Sellers may
-- view orders for their own events; admins view all.
drop policy if exists "orders seller read" on orders;
create policy "orders seller read" on orders
  for select using (seller_id = public.current_seller_id() or public.is_admin());

-- ---------- order_items ----------
drop policy if exists "order items seller read" on order_items;
create policy "order items seller read" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_items.order_id
      and (o.seller_id = public.current_seller_id() or public.is_admin()))
  );

-- ---------- tickets ----------
-- Tickets are issued and fetched via the backend (service role) using the
-- order number / reference. Sellers can read tickets for their own events
-- (needed for the scanner) and admins read all.
drop policy if exists "tickets seller read" on tickets;
create policy "tickets seller read" on tickets
  for select using (
    exists (select 1 from events e where e.id = tickets.event_id
      and (e.seller_id = public.current_seller_id() or public.is_admin()))
  );

-- ---------- payouts ----------
drop policy if exists "payouts owner" on payouts;
create policy "payouts owner" on payouts
  for select using (seller_id = public.current_seller_id() or public.is_admin());

drop policy if exists "payouts request" on payouts;
create policy "payouts request" on payouts
  for insert with check (seller_id = public.current_seller_id());

drop policy if exists "payouts admin update" on payouts;
create policy "payouts admin update" on payouts
  for update using (public.is_admin());

-- ---------- settings ----------
drop policy if exists "settings public read" on settings;
create policy "settings public read" on settings
  for select using (true);

drop policy if exists "settings admin write" on settings;
create policy "settings admin write" on settings
  for update using (public.is_admin());

-- ---------- broadcasts ----------
drop policy if exists "broadcasts public read" on broadcasts;
create policy "broadcasts public read" on broadcasts
  for select using (is_active or public.is_admin());

drop policy if exists "broadcasts admin write" on broadcasts;
create policy "broadcasts admin write" on broadcasts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- news_articles ----------
drop policy if exists "news public read" on news_articles;
create policy "news public read" on news_articles
  for select using (true);

-- ---------- scan_logs ----------
drop policy if exists "scan logs seller read" on scan_logs;
create policy "scan logs seller read" on scan_logs
  for select using (
    exists (select 1 from events e where e.id = scan_logs.event_id
      and (e.seller_id = public.current_seller_id() or public.is_admin()))
  );
