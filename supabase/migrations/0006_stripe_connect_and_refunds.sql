-- =============================================================================
-- Eventiko — 0006: Stripe Connect (automatic payouts) + refunds
-- Additive & idempotent: safe to run on an existing database.
-- =============================================================================

-- Payout mode: 'manual' (platform collects, admin pays out) or
-- 'stripe_connect' (funds routed to each seller's connected account automatically).
alter table settings add column if not exists payout_mode text not null default 'manual';

-- Seller's Stripe connected (Express) account.
alter table sellers
  add column if not exists stripe_account_id text,
  add column if not exists stripe_charges_enabled boolean default false,
  add column if not exists stripe_payouts_enabled boolean default false,
  add column if not exists stripe_onboarded boolean default false;

-- Orders settled directly to the seller via Connect skip platform balance crediting.
alter table orders add column if not exists direct_payout boolean not null default false;

-- ---------------------------------------------------------------------------
-- finalize_paid_order: optionally skip balance crediting (Connect pays seller
-- directly). Drop the single-arg version first to avoid overload ambiguity.
-- ---------------------------------------------------------------------------
drop function if exists public.finalize_paid_order(uuid);
create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_credit_balance boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare it record;
begin
  for it in select ticket_type_id, quantity from order_items where order_id = p_order_id loop
    update ticket_types set sold = sold + it.quantity where id = it.ticket_type_id;
  end loop;

  if p_credit_balance then
    update sellers s
    set total_sales = total_sales + o.subtotal,
        available_balance = available_balance + (o.subtotal - o.platform_fee)
    from orders o
    where o.id = p_order_id and s.id = o.seller_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- reverse_paid_order: on refund, release inventory and debit the seller's
-- balance (only if it was credited, i.e. not a direct Connect payout).
-- ---------------------------------------------------------------------------
create or replace function public.reverse_paid_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare it record;
begin
  for it in select ticket_type_id, quantity from order_items where order_id = p_order_id loop
    update ticket_types set sold = greatest(0, sold - it.quantity) where id = it.ticket_type_id;
  end loop;

  update sellers s
  set total_sales = greatest(0, total_sales - o.subtotal),
      available_balance = greatest(0, available_balance - (o.subtotal - o.platform_fee))
  from orders o
  where o.id = p_order_id and s.id = o.seller_id and o.direct_payout = false;
end;
$$;
