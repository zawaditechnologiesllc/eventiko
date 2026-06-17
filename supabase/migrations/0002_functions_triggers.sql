-- =============================================================================
-- Eventiko — Functions & triggers
-- =============================================================================

-- Helper: is the current authenticated user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: get the seller id owned by the current user
create or replace function public.current_seller_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from sellers where user_id = auth.uid() limit 1;
$$;

-- Create a profile automatically when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enforce a maximum of 3 payout accounts per seller
create or replace function public.enforce_payout_account_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from payout_accounts where seller_id = new.seller_id) >= 3 then
    raise exception 'A seller can have at most 3 payout accounts';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payout_account_limit on payout_accounts;
create trigger trg_payout_account_limit
  before insert on payout_accounts
  for each row execute function public.enforce_payout_account_limit();

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_profiles on profiles;
create trigger trg_touch_profiles before update on profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_sellers on sellers;
create trigger trg_touch_sellers before update on sellers
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_events on events;
create trigger trg_touch_events before update on events
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_ticket_types on ticket_types;
create trigger trg_touch_ticket_types before update on ticket_types
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_orders on orders;
create trigger trg_touch_orders before update on orders
  for each row execute function public.touch_updated_at();

-- Atomically increment sold count and seller balances when an order is paid.
-- Called from the backend after a successful Stripe webhook.
create or replace function public.finalize_paid_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  it record;
begin
  -- bump sold counts
  for it in select ticket_type_id, quantity from order_items where order_id = p_order_id loop
    update ticket_types set sold = sold + it.quantity where id = it.ticket_type_id;
  end loop;

  -- credit the seller's balance with subtotal (net of platform fee)
  update sellers s
  set total_sales = total_sales + o.subtotal,
      available_balance = available_balance + (o.subtotal - o.platform_fee)
  from orders o
  where o.id = p_order_id and s.id = o.seller_id;
end;
$$;

-- Increment a counter (used for event views) without race conditions
create or replace function public.increment_event_views(p_event_id uuid)
returns void
language sql
as $$
  update events set views = views + 1 where id = p_event_id;
$$;
