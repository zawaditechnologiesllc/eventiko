import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  QrCode,
  Ticket,
  CreditCard,
  ScanLine,
  Compass,
  TrendingUp,
  Calendar,
  Newspaper,
} from "lucide-react";
import { getPublishedEvents, getNews, getSettings } from "@/lib/data";
import { EventCard } from "@/components/events/event-card";
import { ButtonLink } from "@/components/ui/button";
import { EVENT_CATEGORIES, SITE } from "@/lib/constants";
import { timeFromNow, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${SITE.name} — Buy & sell tickets to unforgettable events`,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Live moments, made unforgettable`,
    description: SITE.description,
    url: SITE.url,
  },
};

const CATEGORY_EMOJI: Record<string, string> = {
  Concert: "🎤",
  Festival: "🎪",
  "Club Night": "🪩",
  Theatre: "🎭",
  Comedy: "😂",
  Sports: "🏟️",
  Conference: "🎙️",
  Exhibition: "🖼️",
  Workshop: "🛠️",
  Family: "🎈",
  "Food & Drink": "🍷",
  Other: "✨",
};

export default async function HomePage() {
  const settings = await getSettings();
  const [featuredRaw, news] = await Promise.all([
    getPublishedEvents({ featured: true, limit: 8 }),
    getNews(3),
  ]);

  const featured = featuredRaw.length ? featuredRaw : await getPublishedEvents({ limit: 8 });
  const hero = settings.hero || {};

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {hero.backgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.backgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/80 to-ink" />
          </>
        )}
        <div className="absolute inset-0 -z-10 bg-brand-radial opacity-90" />
        <div className="pointer-events-none absolute -left-24 top-1/4 -z-10 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-accent-500/30 blur-3xl" />

        <div className="container-page py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              {SITE.tagline}
            </span>

            <h1 className="mt-6 animate-fade-up font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {hero.title || "Live moments, made unforgettable."}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-slate-300 sm:text-xl">
              {hero.subtitle ||
                "Discover and book tickets to the best concerts, festivals and events across Europe and beyond — secure checkout, instant QR tickets."}
            </p>

            {/* Search */}
            <form
              action="/events"
              method="GET"
              className="mx-auto mt-9 flex max-w-xl animate-fade-up items-center gap-2 rounded-2xl bg-white p-2 shadow-glow"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search events, artists, cities…"
                  aria-label="Search events"
                  className="w-full rounded-xl border-0 bg-transparent py-2.5 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0">
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="h-4 w-4 sm:hidden" />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-slate-400">Popular:</span>
              {["Concert", "Festival", "Club Night", "Comedy"].map((c) => (
                <Link
                  key={c}
                  href={`/events?category=${encodeURIComponent(c)}`}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/90 transition hover:border-white/30 hover:bg-white/10"
                >
                  {c}
                </Link>
              ))}
            </div>

            {/* Trust stats */}
            <div className="mx-auto mt-12 grid max-w-2xl animate-fade-up grid-cols-1 gap-4 sm:grid-cols-3">
              <TrustStat icon={<Calendar className="h-5 w-5" />} value="10k+" label="Events listed" />
              <TrustStat
                icon={<ShieldCheck className="h-5 w-5" />}
                value="100%"
                label="Secure Stripe payments"
              />
              <TrustStat
                icon={<QrCode className="h-5 w-5" />}
                value="Instant"
                label="QR tickets by email"
              />
            </div>
          </div>
        </div>

        <div className="h-12 bg-gradient-to-b from-transparent to-slate-50" />
      </section>

      {/* CATEGORY PILLS */}
      <section className="container-page -mt-4">
        <div className="flex flex-wrap justify-center gap-2.5">
          {EVENT_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/events?category=${encodeURIComponent(cat)}`}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-200"
            >
              <span aria-hidden="true">{CATEGORY_EMOJI[cat] || "🎟️"}</span>
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="container-page mt-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Handpicked
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Featured events
            </h2>
            <p className="mt-2 text-slate-500">The experiences everyone&apos;s talking about.</p>
          </div>
          <ButtonLink href="/events" variant="secondary" className="shrink-0">
            See all events
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>

        {featured.length ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Ticket className="h-7 w-7" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
              The lineup is loading
            </h3>
            <p className="mt-2 max-w-md text-slate-500">
              New events are added every day. Be the first to discover them — or list your own.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/events" variant="primary">
                <Compass className="h-4 w-4" /> Browse events
              </ButtonLink>
              <ButtonLink href="/sell" variant="secondary">
                Sell tickets
              </ButtonLink>
            </div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How Eventiko works
          </h2>
          <p className="mt-3 text-lg text-slate-500">
            From discovery to the door in three simple steps.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StepCard
            step="01"
            icon={<Compass className="h-6 w-6" />}
            title="Discover"
            description="Browse thousands of events by category, city or date. Find concerts, festivals, club nights and more — all in one place."
          />
          <StepCard
            step="02"
            icon={<CreditCard className="h-6 w-6" />}
            title="Buy securely"
            description="Checkout in seconds with Stripe. No account required. Your tickets land in your inbox instantly with a unique QR code."
          />
          <StepCard
            step="03"
            icon={<ScanLine className="h-6 w-6" />}
            title="Scan & enter"
            description="Show your QR ticket at the door — on your phone or printed. Fast, contactless entry to every experience."
          />
        </div>
      </section>

      {/* SELL CTA BAND */}
      <section className="container-page mt-24">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-white shadow-glow sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-black/10 blur-2xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
                <Ticket className="h-3.5 w-3.5" />
                For organizers
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Sell your tickets in minutes.
              </h2>
              <p className="mt-3 max-w-lg text-white/90">
                Instant onboarding, beautiful customizable QR tickets, a built-in door scanner and
                low fees — just {settings.platform_fee_rate}% per ticket. Get paid securely with
                Stripe.
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
                {[
                  "No setup or monthly fees",
                  "Secure Stripe payouts",
                  "Customizable ticket designs",
                  "Free scanner app",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="/signup?role=seller" variant="secondary" size="lg">
                Start selling free
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/sell"
                variant="dark"
                size="lg"
                className="bg-ink/40 backdrop-blur hover:bg-ink/60"
              >
                Learn more
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* NEWS TEASER */}
      {news.length > 0 && (
        <section className="container-page mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-700">
                <Newspaper className="h-3.5 w-3.5" />
                Fresh off the wire
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Latest events news
              </h2>
            </div>
            <ButtonLink href="/news" variant="ghost" className="shrink-0">
              All news
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {news.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  {article.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-brand-gradient text-white/70">
                      <Newspaper className="h-9 w-9" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {article.source && (
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
                      {article.source}
                    </span>
                  )}
                  <h3 className="mt-1.5 line-clamp-2 font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {truncate(article.summary, 110)}
                    </p>
                  )}
                  {article.published_at && (
                    <p className="mt-auto pt-3 text-xs text-slate-400">
                      {timeFromNow(article.published_at)}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* NEWSLETTER / FINAL CTA */}
      <section className="container-page mt-24">
        <div className="surface-dark overflow-hidden rounded-3xl bg-brand-radial px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Never miss a moment that matters.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Get the best new events, exclusive presales and festival drops — straight to your inbox.
          </p>
          <form
            action="/events"
            method="GET"
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              name="newsletter"
              placeholder="you@email.com"
              aria-label="Email address"
              className="input flex-1 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus:border-white/30 focus:ring-white/20"
            />
            <button type="submit" className="btn-primary shrink-0">
              Explore events
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-400">
            No spam. Unsubscribe anytime. By subscribing you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-white">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}

function TrustStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
        {icon}
      </span>
      <div>
        <p className="font-display text-lg font-extrabold leading-none text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-300">{label}</p>
      </div>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card group relative p-7 transition hover:-translate-y-1 hover:shadow-glow">
      <span className="absolute right-6 top-6 font-display text-5xl font-extrabold text-slate-100 transition group-hover:text-brand-100">
        {step}
      </span>
      <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
        {icon}
      </span>
      <h3 className="relative mt-5 font-display text-xl font-bold text-slate-900">{title}</h3>
      <p className="relative mt-2 text-slate-500">{description}</p>
    </div>
  );
}
