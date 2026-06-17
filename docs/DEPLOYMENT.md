# Eventiko — Deployment guide

This walks you through a full production deploy: **Supabase** (DB/Auth/Storage), **Render** (backend API), and **Vercel** (frontend), wired to **Stripe**.

Estimated time: ~30 minutes.

---

## 0. Prerequisites
- A GitHub account with this repository pushed.
- Free accounts on [Supabase](https://supabase.com), [Render](https://render.com), [Vercel](https://vercel.com), and [Stripe](https://stripe.com).

---

## 1. Supabase

### 1.1 Create the project
- New project → choose a region close to your audience (e.g. **EU (Frankfurt/Paris)**).
- Save the database password somewhere safe.

### 1.2 Run the schema
Open **SQL Editor** and run each file's contents **in this order** (copy‑paste, run, repeat):
1. `supabase/migrations/0001_init.sql` — tables, enums, indexes, settings singleton.
2. `supabase/migrations/0002_functions_triggers.sql` — `handle_new_user`, payout‑limit trigger, `finalize_paid_order`, etc.
3. `supabase/migrations/0003_rls.sql` — Row Level Security policies.
4. `supabase/migrations/0004_storage.sql` — storage buckets + policies.
5. `supabase/migrations/0005_promotions_and_fees.sql` — buyer service fee, 5% seller commission, paid promotions (plans + requests), event pinning. **Additive & idempotent — safe on an existing DB.**
6. `supabase/seed.sql` — default hero/footer/settings + a sample announcement.

> Using the Supabase CLI instead? `supabase link` then `supabase db push` will apply `supabase/migrations/*`.

### 1.3 Auth
- **Authentication → Providers → Email**: enable it.
- For quick testing, **disable “Confirm email”** (Authentication → Providers → Email → uncheck confirm). For production, leave it on — the app handles the “check your inbox” flow and `/auth/callback`.
- Optional: set the **Site URL** and redirect URLs to your Vercel domain.

### 1.4 Keys
From **Project Settings → API**, copy:
- `Project URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**backend only — keep secret**)

---

## 2. Stripe
- Copy your **Secret key** (`sk_test_…` for testing) → `STRIPE_SECRET_KEY`.
- You'll add the **webhook** in step 4 once the backend URL exists.

---

## 3. Backend → Render

### Option A — Blueprint (recommended)
1. Render → **New → Blueprint** → pick this repo. It reads `render.yaml` and provisions the **web service** (and an optional **news cron**).
2. Fill in the `sync: false` env vars when prompted (see below). `TICKET_SECRET` and `CRON_SECRET` are auto‑generated.

### Option B — Manual web service
- **New → Web Service**, connect repo, **Root Directory: `backend`**.
- Build: `npm install && npm run build` · Start: `npm start` · Health check path: `/health`.

### Env vars
```
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://<your-vercel-domain>      # set after step 4, then redeploy
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...                # set after creating the webhook
TICKET_SECRET=<long random string>
CRON_SECRET=<long random string>
# email (recommended — see docs/EMAILS.md for domain verification + anti-spam)
RESEND_API_KEY=...        EMAIL_FROM="Eventiko <tickets@yourdomain>"
EMAIL_REPLY_TO=support@yourdomain   SUPPORT_EMAIL=support@yourdomain
SEND_EMAIL_HOOK_SECRET=v1,whsec_...    # from Supabase Auth → Hooks (step 4b)
# optional news enrichment
NEWS_API_KEY=...          GNEWS_API_KEY=...
```
Deploy and note the URL, e.g. `https://eventiko-backend.onrender.com`.

---

## 4. Stripe webhook
- Stripe → **Developers → Webhooks → Add endpoint**.
- Endpoint URL: `https://<your-backend>.onrender.com/api/webhook/stripe`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`.
- Copy the **Signing secret** (`whsec_…`) into Render as `STRIPE_WEBHOOK_SECRET` and redeploy.

> Even without the webhook, the success page reconciles the order directly with Stripe, but the webhook is the recommended source of truth in production. The same webhook also confirms **promotion** payments.

### 4b. Branded emails (Resend) — confirm account / reset password / tickets
Follow **[`docs/EMAILS.md`](EMAILS.md)**: verify your domain in Resend (SPF/DKIM/DMARC so mail doesn't land in spam), set `RESEND_API_KEY` + `EMAIL_FROM` + `EMAIL_REPLY_TO`, then in **Supabase → Authentication → Hooks → Send Email Hook** enable it, point it at `https://<your-backend>.onrender.com/api/hooks/email`, and put its secret in `SEND_EMAIL_HOOK_SECRET`.

---

## 5. Frontend → Vercel
1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `frontend`** (Next.js auto‑detected).
3. Environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com
NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>
```
4. Deploy. Copy the domain, set it as the backend's `FRONTEND_URL` on Render, and redeploy the backend (so CORS + Stripe redirect URLs match).

---

## 6. Make yourself admin
1. Visit your site and **sign up**.
2. In Supabase SQL Editor run `docs/make-admin.sql` with your email.
3. Re‑login and open `/admin`. Adjust the platform fee, hero, footer, and post a promotion.

---

## 7. Smoke test
- [ ] Home, `/events`, `/news` load and are responsive on mobile.
- [ ] Sign up as a seller via **Sell tickets** → complete onboarding → create an event → add **multiple ticket types** in the Ticket Studio → **Publish**.
- [ ] As a visitor (incognito), buy a ticket with a [Stripe test card](https://stripe.com/docs/testing) `4242 4242 4242 4242`.
- [ ] Success page shows the QR + reference and **Download PDF** works; confirmation email arrives (if email configured).
- [ ] Seller **Scanner** validates the QR (green = admit), and a second scan shows “already used”.
- [ ] Buyer sees the **service fee** line in the selector and on Stripe; the **ticket email** arrives (inbox, not spam).
- [ ] **Confirm account** + **reset password** emails arrive branded from your domain.
- [ ] Seller **Promote** an event → pay → it shows as "Paid · review" under **Admin → Promotions** → admin **Confirm & activate** → event appears in the homepage **Spotlight**.
- [ ] Admin **Settings**: change seller commission (5%) + buyer service fee; verify checkout reflects it.
- [ ] Seller requests a payout; admin reviews it under **Admin → Payouts**.
- [ ] Admin **News → Refresh now** pulls articles.

---

## Troubleshooting
- **CORS errors** → backend `FRONTEND_URL` must equal your exact Vercel origin; redeploy after changing.
- **Tickets not appearing after payment** → check the Stripe webhook is delivering (Stripe dashboard) and `STRIPE_WEBHOOK_SECRET` matches; the success page will still reconcile within a few seconds.
- **“Admins only” / can't see /admin** → ensure `profiles.role = 'admin'` and you re‑logged in.
- **Camera won't start on the scanner** → the page must be served over **HTTPS** (Vercel is) and you must grant camera permission; otherwise use the manual reference entry.
- **No news** → click Refresh in the admin; some RSS sources rate‑limit, but 20+ are attempted and deduplicated.
