<div align="center">

# 🎟️ Eventiko

### Live moments, made unforgettable.

**A complete, global events ticketing platform** — discover events, buy secure QR tickets without an account, and sell your own in minutes with fully customizable tickets, a built‑in door scanner, manual payouts, an admin control center, and an always‑fresh European events news feed.

</div>

---

## ✨ What Eventiko does

**For buyers (no account required)**
- Browse a beautiful, SEO‑optimized **marketplace** of events across Europe and the world.
- Buy tickets through **Stripe Checkout** — secure, global, multi‑currency.
- Tickets are **issued instantly** with a unique **scannable QR code** and a human‑readable **reference number** (your backup if your phone dies).
- **Download tickets as PDF** immediately after payment, and they're **emailed** to you too.
- Look up tickets any time with your order number + email.

**For sellers (onboarded in ~2 minutes via “Sell tickets”)**
- Seamless **3‑step onboarding** (with required country + business details): business → up to **3 payout accounts** → review. Start creating events right away.
- Create unlimited events, each with **multiple ticket categories/types** (e.g. General, VIP, Early Bird).
- A **Ticket Studio** to fully customize each ticket: colors, layout, logo, banner, perks, terms, **expiry date**, inventory, max‑per‑order, with a **live preview**.
- A **door scanner** (works on any phone via the browser camera) to validate QR codes in real time — each ticket admits **once**, with a manual reference fallback.
- **Promote events** — pay to pin an event to the homepage **Spotlight** (admin confirms the payment, then it goes live for the plan's duration).
- Sales dashboard, **available balance**, and **manual payout requests**.

**For admins (full control center)**
- Manage **sellers** (approve / reject / suspend, review their payout accounts), **users** (roles), **events** (feature / unpublish / delete), **orders**, **tickets**, and **payouts** (manual review & mark‑as‑paid).
- Review **paid promotion requests** (confirm payment → pin to homepage) and set **promotion pricing plans** (by placement / days / price).
- Post **announcements** to the site‑wide hero bar.
- Edit the **hero & footer** content, branding colors, support email, minimum payout, the **seller commission % (default 5%)**, and the **buyer service fee** (percent + flat markup) — all from **Settings**.
- Trigger / monitor the **news aggregator**.

**Always‑on news**
- Aggregates events & live‑music news from **20+ European sources** (RSS, no API key required; optional NewsAPI/GNews enrichment) on a schedule to keep the site active.

---

## 🏗️ Architecture

```
┌────────────────────┐      ┌─────────────────────┐      ┌────────────────────┐
│  Next.js frontend  │      │   Express backend   │      │      Supabase      │
│   (Vercel)         │─────▶│   (Render)          │─────▶│  Postgres + Auth   │
│  App Router, SEO   │ HTTP │  Stripe • QR • PDF  │ svc  │  + Storage + RLS   │
│  Tailwind          │      │  Scanner • News     │ role │                    │
└─────────┬──────────┘      └──────────┬──────────┘      └────────────────────┘
          │  anon key (RLS)            │  Stripe Checkout + Webhooks
          ▼                            ▼
   Browse / dashboards          ┌─────────────┐
   read via Supabase            │   Stripe    │
                                └─────────────┘
```

- **Frontend** — Next.js 15 (App Router) + Tailwind, deployed on **Vercel**. SEO‑optimized (metadata, OpenGraph, `sitemap.xml`, `robots.txt`, JSON‑LD), fully responsive on desktop + mobile. Reads public data directly from Supabase with the anon key (protected by RLS) and talks to the backend for payments, ticket PDFs, and scanning.
- **Backend** — Node/Express (TypeScript) on **Render**. Owns everything sensitive with the Supabase **service role**: Stripe checkout + webhooks, ticket issuance (signed QR tokens + reference numbers), PDF generation, confirmation emails, the scanner validation API, and news aggregation (in‑process cron + optional Render Cron job).
- **Database / Auth / Storage** — **Supabase** (Postgres + Row Level Security, Auth, Storage buckets for images & documents).
- **Payments** — **Stripe Checkout**. The platform fee (default **8%**, editable in the admin panel) is recorded per order and deducted from the seller's balance; buyers pay face value.

### Repo structure

```
eventiko/
├── frontend/            # Next.js app (Vercel)
│   ├── app/             # routes: (marketing), dashboard, admin, checkout, auth…
│   ├── components/      # ui, layout, events, ticket, dashboard, admin, checkout
│   ├── lib/             # supabase clients, api client, types, utils, data
│   └── vercel.json
├── backend/             # Express API (Render)
│   └── src/
│       ├── routes/      # checkout, webhook, orders, tickets, scan, news
│       ├── services/    # ticketing (issue/finalize), news aggregator
│       └── lib/         # supabase, stripe, qr, pdf, email, ids, auth
├── supabase/
│   ├── migrations/      # 0001 schema · 0002 functions/triggers · 0003 RLS · 0004 storage
│   └── seed.sql         # default settings + sample promotion
├── docs/                # DEPLOYMENT.md, ARCHITECTURE.md, admin SQL
├── render.yaml          # Render blueprint (backend + news cron)
└── .github/workflows/   # CI: builds frontend + backend
```

---

## 🚀 Deploy to production

> Full step‑by‑step detail is in **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**. The short version:

### 1) Supabase (database, auth, storage)
1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migrations **in order**: `supabase/migrations/0001_init.sql`, `0002_functions_triggers.sql`, `0003_rls.sql`, `0004_storage.sql`, then `supabase/seed.sql`.
3. **Authentication → Providers**: enable **Email**. (Disable “Confirm email” for instant sign‑in while testing, or keep it on for production.)
4. Copy from **Project Settings → API**: `Project URL`, `anon` key, and `service_role` key.

### 2) Stripe (payments)
1. Get your **Secret key** (`sk_…`) from the Stripe dashboard.
2. After the backend is deployed (step 3), add a **webhook** → endpoint `https://<your-backend>.onrender.com/api/webhook/stripe`, events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`. Copy the **signing secret** (`whsec_…`).

### 3) Backend → Render
1. Push this repo to GitHub, then in Render: **New → Blueprint** and select the repo (it reads `render.yaml`). Or create a Web Service with **root dir `backend`**, build `npm install && npm run build`, start `npm start`.
2. Set env vars (see table below): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `TICKET_SECRET`, and optionally email/news keys.
3. Note the service URL, e.g. `https://eventiko-backend.onrender.com`.

### 4) Frontend → Vercel
1. In Vercel: **New Project** → import the repo → set **root directory to `frontend`** (framework auto‑detects Next.js).
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (your Render URL), `NEXT_PUBLIC_SITE_URL` (your Vercel URL).
3. Deploy. Then set the backend's `FRONTEND_URL` to the Vercel URL and redeploy the backend so CORS + Stripe redirects line up.

### 5) Create your admin
Sign up normally on the site, then in Supabase SQL Editor run (see `docs/make-admin.sql`):
```sql
update profiles set role = 'admin' where email = 'you@example.com';
```
Log out/in and visit `/admin`.

---

## 💻 Local development

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in Supabase service key + Stripe test keys
npm install
npm run dev                 # http://localhost:8080

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local  # fill in Supabase URL + anon key, API_URL=http://localhost:8080
npm install
npm run dev                 # http://localhost:3000
```

For Stripe webhooks locally: `stripe listen --forward-to localhost:8080/api/webhook/stripe` and put the printed `whsec_…` in `backend/.env`. (The success page also reconciles directly with Stripe, so testing works even without the CLI.)

---

## 🔐 Environment variables

**Frontend (`frontend/.env.local` / Vercel)**

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_API_URL` | Backend base URL (Render) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (SEO/canonical) |

**Backend (`backend/.env` / Render)**

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** key (server‑only, secret) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_URL` | Frontend URL (CORS + Stripe redirects) |
| `TICKET_SECRET` | Long random string; signs QR tokens |
| `CRON_SECRET` | Protects the news refresh endpoint |
| `RESEND_API_KEY` / `SMTP_*` | Email delivery via Resend or SMTP (else logged) |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | Sender + reply‑to (use a **verified domain**) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase “Send Email” hook secret (branded auth emails) |
| `NEWS_API_KEY` / `GNEWS_API_KEY` | Optional news enrichment (RSS needs none) |

---

## 🧠 How the core flows work

- **Buying:** `ticket-selector` → `POST /api/checkout` creates a pending order + Stripe Checkout Session → buyer pays → Stripe **webhook** (and a **success‑page reconciliation** fallback) finalizes the order, **issues tickets** (signed QR + reference), bumps sold counts, credits the seller's balance (net of fee), and emails the buyer.
- **QR & scanning:** each ticket's QR encodes a **JWT signed with `TICKET_SECRET`**. The seller's scanner posts it to `POST /api/scan/validate` (authorized by the seller's Supabase session); the backend verifies the signature, checks the event + expiry, and **atomically** flips `valid → used` so a ticket can't be admitted twice. Manual reference entry is supported as a fallback.
- **Payouts:** sellers add up to 3 payout accounts and request withdrawals against their available balance; **all payouts are reviewed manually** by an admin who can approve / mark paid / reject.
- **Promotions:** a seller picks an event + a promotion plan → pays via Stripe → the webhook marks it `paid` → an admin **confirms the payment and activates** it, which pins the event to the homepage Spotlight (`events.pinned` + `pinned_until`) for the plan's duration. An hourly job unpins expired promotions.
- **Two fees (both admin-set):**
  - **Buyer service fee** — a markup added to the buyer's total **at checkout** (`service_fee_percent` + `service_fee_flat`), shown live in the ticket selector and as a Stripe line item. The platform keeps this.
  - **Seller commission** — `platform_fee_rate` (**default 5%**), deducted from the seller's balance. Buyer pays face value + service fee; seller receives `subtotal − commission`. Platform earns `service_fee + commission`.

---

## 💳 Payments with a single Stripe account (the model we use)

**Yes — one Stripe account collects all payments, and it works well.** Eventiko runs as the **merchant of record**: every buyer pays into your single platform Stripe account, and you **settle sellers manually** via the built‑in payout system. Concretely:

- Each order records `subtotal`, the buyer `service_fee`, and the seller `platform_fee` (commission). On payment, the seller's `available_balance` is credited with `subtotal − commission`; the rest stays with the platform.
- Sellers add payout accounts and **request withdrawals**; an admin reviews and pays them out (bank/PayPal/Wise/etc.) and marks the payout paid. The platform's owner account holds funds until then.
- Promotions are charged to the same account.

**What to keep in mind as merchant of record:** you are responsible for refunds/chargebacks, you hold balances/float, and you should reflect this in your Terms and handle tax/VAT for your jurisdiction.

**The alternative — Stripe Connect:** if you later want Stripe to split funds and pay sellers automatically (each seller onboards their own connected account, Stripe handles their KYC + payouts, and you take an `application_fee`), migrate to **Connect destination charges**. It removes manual payouts and reduces your liability, at the cost of per‑seller onboarding. The current single‑account + manual‑payout model is intentionally simpler and is fully implemented here; Connect is a clean future upgrade because all the per‑order fee accounting already exists.

---

## 🌐 Backend API reference

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check (Render) |
| `POST` | `/api/checkout` | Create order + Stripe Checkout Session |
| `POST` | `/api/webhook/stripe` | Stripe webhook (raw body, signature‑verified) |
| `GET` | `/api/orders/session/:id` | Resolve order by Stripe session (success page) |
| `GET` | `/api/orders/:orderNumber` | Look up order (`?email=` to authorize) |
| `GET` | `/api/orders/:orderNumber/pdf` | Download all tickets in one PDF |
| `GET` | `/api/tickets/:id/pdf` | Download a single ticket PDF |
| `POST` | `/api/scan/validate` | Validate a QR/reference (seller/admin auth) |
| `POST` | `/api/promotions/checkout` | Pay to promote an event (seller auth) |
| `POST` | `/api/hooks/email` | Supabase Send‑Email hook → branded Resend emails |
| `GET` | `/api/news` | Latest aggregated news |
| `POST` | `/api/news/refresh` | Aggregate now (admin bearer or cron secret) |

---

## 🛡️ Security notes
- The **service role key never touches the browser** — only the backend uses it. The frontend uses the anon key, constrained by **Row Level Security** on every table.
- Stripe webhooks are **signature‑verified**; order finalization is **idempotent** (safe against duplicate webhooks / reconciliation races).
- QR tokens are **tamper‑proof** (HMAC‑signed) and single‑use at the door.

---

## 📄 License
Proprietary — © Eventiko. All rights reserved.
