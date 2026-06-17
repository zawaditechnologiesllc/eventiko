import type { Metadata } from "next";
import {
  Sparkles,
  Globe2,
  ShieldCheck,
  Heart,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About us",
  description: `Learn about ${SITE.name} — the global events ticketing platform connecting fans with unforgettable live experiences and helping organizers sell out, securely.`,
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Fans first",
    desc: "Buying a ticket should be effortless and joyful — no accounts to chase, no fine-print traps. Just you and the moment.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Trust by design",
    desc: "Every payment runs through Stripe and every ticket carries a tamper-proof QR code. Security isn't a feature; it's the foundation.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Speed everywhere",
    desc: "From discovery to checkout to the door, we obsess over removing friction. Seconds matter when the show's about to start.",
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    title: "Built for the world",
    desc: "From a club night in Berlin to a festival in Lisbon, Eventiko works across borders, currencies and cultures.",
  },
];

const stats = [
  { value: "10k+", label: "Events powered" },
  { value: "20+", label: "Countries served" },
  { value: "100%", label: "Secure payments" },
  { value: "24/7", label: "Ticket access" },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 -z-10 bg-brand-radial" />
        <div className="pointer-events-none absolute -left-24 top-0 -z-10 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="container-page py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              Our story
            </span>
            <h1 className="mt-6 animate-fade-up font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              We make live moments unforgettable.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-slate-300">
              {SITE.name} is a global events ticketing platform on a simple mission: connect people
              with the experiences they&apos;ll never forget, and give organizers the tools to make
              them happen.
            </p>
          </div>
        </div>
        <div className="h-12 bg-gradient-to-b from-transparent to-slate-50" />
      </section>

      {/* MISSION */}
      <section className="container-page mt-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
            Why we built Eventiko
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-slate-600">
            <p>
              Live events are where life happens — the concerts you sing along to, the festivals you
              plan your summer around, the nights you talk about for years. But for too long, buying
              and selling tickets has been clunky, opaque and overpriced.
            </p>
            <p>
              We started Eventiko to fix that. A platform where fans discover events they love and
              buy tickets in seconds, and where organizers of any size can launch, sell and scan
              with tools that used to be reserved for the biggest players — at a fraction of the
              cost.
            </p>
            <p>
              No hidden fees. No friction. Just beautiful tickets, secure payments and a marketplace
              built to celebrate live culture across Europe and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container-page mt-16">
        <div className="grid grid-cols-2 gap-4 rounded-3xl bg-brand-gradient p-8 text-center text-white shadow-glow sm:grid-cols-4 sm:p-10">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-white/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="container-page mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            What we stand for
          </h2>
          <p className="mt-3 text-lg text-slate-500">The principles behind every decision we make.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="card flex gap-5 p-7">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                {v.icon}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-slate-500">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page mt-24">
        <div className="surface-dark overflow-hidden rounded-3xl bg-brand-radial px-6 py-14 text-center sm:px-12">
          <span className="grid mx-auto h-14 w-14 place-items-center rounded-2xl bg-white/10 text-brand-300">
            <Users className="h-7 w-7" />
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Join the movement.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Whether you&apos;re here to find your next night out or to fill a room, Eventiko is built
            for you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/events" variant="primary" size="lg">
              Discover events
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/sell"
              variant="secondary"
              size="lg"
              className="bg-white/10 text-white ring-white/15 hover:bg-white/20"
            >
              Sell tickets
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
