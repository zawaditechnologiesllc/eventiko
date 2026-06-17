# Eventiko — Architecture

## Components
- **Frontend (Vercel)** — Next.js 15 App Router, Tailwind. Public marketplace + buyer flow, seller dashboard, and admin console. Reads public data from Supabase via the anon key (RLS‑guarded); calls the backend for payments, PDFs, and scanning.
- **Backend (Render)** — Express + TypeScript. Uses the Supabase **service role** for all privileged writes. Responsibilities: Stripe checkout & webhooks, ticket issuance, PDF generation, email, scanner validation, news aggregation.
- **Supabase** — Postgres + RLS, Auth, Storage.
- **Stripe** — Checkout + webhooks.

## Data model (Postgres)
`profiles` (mirrors `auth.users`, holds `role`), `sellers`, `payout_accounts` (≤3 per seller, enforced by trigger), `events`, `ticket_types` (price/inventory/expiry + `design` jsonb), `orders`, `order_items`, `tickets` (`reference_number`, `qr_token`, `status`), `payouts`, `settings` (singleton row id=1: fee, hero, footer, branding), `broadcasts`, `news_articles`, `scan_logs`.

Key DB functions: `handle_new_user` (auto‑create profile on signup), `is_admin()` / `current_seller_id()` (RLS helpers), `finalize_paid_order(order_id)` (atomic sold++ and seller balance credit), `enforce_payout_account_limit`.

## Security model
- **RLS everywhere.** Anon can read only published events, active ticket types, approved sellers, active broadcasts, news, and settings. Authenticated users manage only their own rows. Admins (`profiles.role='admin'`) manage all.
- The **anon key** is the only Supabase credential exposed to browsers. The **service role key** lives only on the backend.
- **QR tokens** are HMAC‑signed JWTs (`TICKET_SECRET`); validation is server‑side and single‑use via an atomic `valid → used` update.
- **Stripe webhooks** are signature‑verified. Finalization is idempotent: the order status transition is atomic, ticket issuance checks for existing tickets, and balance crediting runs once.

## Money flow & fees
Per order we store `subtotal`, the buyer `service_fee` (`service_fee_percent` + `service_fee_flat`, admin‑set markup) and the seller `platform_fee` (commission, default **5%**, admin‑set). The buyer always pays `subtotal + service_fee`; the seller nets `subtotal − platform_fee`; the platform keeps `service_fee + platform_fee`. There are two payout modes (admin toggle, `settings.payout_mode`):

- **Manual (default) — platform as merchant of record.** All funds land in one platform Stripe account. On finalize, the seller's `available_balance` is credited `subtotal − platform_fee`. Sellers request payouts; admins approve & pay them out manually.
- **Automatic — Stripe Connect destination charges.** Each seller has an Express connected account (`sellers.stripe_account_id`, synced via the `account.updated` webhook). Checkout sets `transfer_data.destination` to the seller and `application_fee_amount = service_fee + platform_fee`, so Stripe routes `subtotal − commission` to the seller and pays them out automatically. Such orders set `orders.direct_payout = true`, and `finalize_paid_order(p_credit_balance => false)` skips internal balance crediting. If a seller isn't onboarded, that checkout falls back to manual.

**Refunds (admin):** `POST /api/admin/orders/:n/refund` atomically flips `paid → refunded`, issues a Stripe refund (with `reverse_transfer` + `refund_application_fee` for Connect orders), cancels the order's tickets, and calls `reverse_paid_order` to release inventory and debit the seller balance (manual orders only). Cancelled tickets are rejected at the scanner.

## Promotions
`promotion_plans` (admin pricing by placement/days/price) and `event_promotions` (a seller's purchase). Flow: seller checks out a plan for an event (`/api/promotions/checkout`) → Stripe → webhook sets the promotion `paid` → an admin confirms payment and activates it, setting `events.pinned=true` + `pinned_until` for the plan duration. `expire_promotions()` (hourly cron) unpins expired events. The homepage queries pinned events for the "Spotlight".

## SEO & performance
SSR + Tailwind, per‑route `metadata` + OpenGraph/Twitter cards, `sitemap.xml` (incl. event slugs), `robots.txt`, a web manifest, and JSON‑LD `Event` structured data on event pages. Public pages fetch with a cookie‑free anon client so they render as **ISR** (homepage 5 min, news 15 min) and are served from Vercel's CDN for fast TTFB and strong Core Web Vitals; fonts use `next/font` with `display: swap`. (A literal sub‑2‑millisecond load is not physically possible — network latency alone exceeds that — so we optimize for top‑tier Core Web Vitals and sub‑second cached loads.)

## Order lifecycle
```
pending ──(Stripe paid: webhook OR success-page reconcile)──▶ paid
   │                                                          │ issue tickets (QR+ref)
   │                                                          │ finalize_paid_order()
   └──(checkout expired)──▶ cancelled                         │ email buyer
```

## News aggregation
`services/news.ts` fetches 20+ European/global RSS feeds (defensively, per‑feed try/catch), optionally enriches via NewsAPI/GNews, dedupes by URL hash, upserts into `news_articles`, and prunes to the newest ~400. Runs on an in‑process cron every 6h (plus shortly after boot) and via `POST /api/news/refresh` (admin or `CRON_SECRET`). `render.yaml` also defines a standalone cron job as an alternative.

## Frontend routes
- `(marketing)`: `/`, `/events`, `/events/[slug]`, `/news`, `/sell`, `/about`, `/contact`, `/terms`, `/privacy`
- buyer: `/checkout/success`, `/checkout/cancel`, `/ticket`
- auth: `/login`, `/signup`, `/auth/callback`
- seller: `/dashboard` (+ `events`, `events/[id]` Ticket Studio, `orders`, `scanner`, `payouts`, `account`, `onboarding`)
- admin: `/admin` (+ `sellers`, `users`, `events`, `orders`, `tickets`, `payouts`, `broadcasts`, `news`, `settings`)
- SEO: `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`
