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

## Money flow
Buyer pays face value via Stripe Checkout. Per order we store `subtotal`, `platform_fee_rate` (from settings, default 8%), and `platform_fee`. On finalize, the seller's `available_balance` increases by `subtotal − platform_fee`. Sellers request payouts against that balance; admins approve/pay manually.

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
