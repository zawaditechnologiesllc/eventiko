import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Palette,
  Banknote,
  ScanLine,
  BarChart3,
  Globe2,
  ShieldCheck,
  UserPlus,
  CalendarPlus,
  Megaphone,
  Wallet,
  Sparkles,
} from "lucide-react";
import { getSettings } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sell tickets online — for organizers",
  description:
    "Sell tickets on Eventiko with instant onboarding, beautiful customizable QR tickets, a built-in door scanner and secure Stripe payouts. Low fees, no monthly cost.",
  alternates: { canonical: "/sell" },
  openGraph: {
    title: `Sell tickets online · ${SITE.name}`,
    description:
      "Instant onboarding, customizable QR tickets, a built-in scanner and secure Stripe payouts. Start selling in minutes.",
    url: `${SITE.url}/sell`,
  },
};

export default async function SellPage() {
  const settings = await getSettings();
  const fee = settings.platform_fee_rate;

  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant onboarding",
      desc: "Create your seller account and publish your first event in minutes. No paperwork, no waiting, no setup fees.",
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Beautiful, custom QR tickets",
      desc: "Design stunning branded tickets with your colors, logo and perks. Every ticket carries a secure, scannable QR code.",
    },
    {
      icon: <Banknote className="h-6 w-6" />,
      title: "Secure Stripe payouts",
      desc: "Buyers pay safely through Stripe. Track your balance and request payouts to your bank, PayPal, Wise and more.",
    },
    {
      icon: <ScanLine className="h-6 w-6" />,
      title: "Built-in scanner app",
      desc: "Validate tickets at the door from any phone. Fast, contactless check-in with instant duplicate detection.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time analytics",
      desc: "Watch sales, revenue and check-ins update live from your dashboard. Know exactly how your event is performing.",
    },
    {
      icon: <Globe2 className="h-6 w-6" />,
      title: "Reach a global audience",
      desc: "Get discovered in the Eventiko marketplace by fans across Europe and beyond, with built-in SEO for every event.",
    },
  ];

  const steps = [
    {
      icon: <UserPlus className="h-6 w-6" />,
      title: "Create your account",
      desc: "Sign up as a seller in seconds and tell us a little about your business.",
    },
    {
      icon: <CalendarPlus className="h-6 w-6" />,
      title: "Build your event",
      desc: "Add details, upload your cover, create ticket tiers and design your QR tickets.",
    },
    {
      icon: <Megaphone className="h-6 w-6" />,
      title: "Publish & promote",
      desc: "Go live on the marketplace and share your event page everywhere.",
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Get paid",
      desc: "Sell tickets, scan at the door, and request secure payouts whenever you like.",
    },
  ];

  const faqs = [
    {
      q: "How much does it cost to sell?",
      a: `There are no setup or monthly fees. Eventiko charges a simple ${fee}% platform fee per ticket sold — you only pay when you sell. Stripe's standard processing fees apply on top.`,
    },
    {
      q: "When do I get paid?",
      a: "Funds from completed orders build up as your available balance. Once you reach the minimum threshold you can request a payout to your preferred method, and our team processes it promptly.",
    },
    {
      q: "Do my buyers need an account?",
      a: "No. Buyers can purchase in seconds with just their name and email — tickets are delivered instantly by email with a unique QR code.",
    },
    {
      q: "How does check-in work?",
      a: "Use the built-in Eventiko scanner from any phone browser. It validates each QR ticket in real time and flags duplicates, so entry is fast and fraud-proof.",
    },
    {
      q: "Can I customize how tickets look?",
      a: "Absolutely. Choose layouts, brand colors, add your logo, list perks and set terms. Your tickets look professional and unmistakably yours.",
    },
    {
      q: "What kinds of events can I sell?",
      a: "Concerts, festivals, club nights, theatre, comedy, sports, conferences, workshops and more — anything with a date, a place and an audience.",
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 -z-10 bg-brand-radial" />
        <div className="pointer-events-none absolute -right-24 top-0 -z-10 h-96 w-96 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />

        <div className="container-page py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              For organizers
            </span>
            <h1 className="mt-6 animate-fade-up font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Turn your audience into{" "}
              <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                ticket sales.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-slate-300">
              Eventiko gives you everything to sell out your event: instant onboarding, gorgeous
              customizable QR tickets, a built-in door scanner and secure Stripe payouts — for just{" "}
              <span className="font-bold text-white">{fee}% per ticket</span>.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup?role=seller" variant="primary" size="lg">
                Start selling free
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="#how-it-works"
                variant="secondary"
                size="lg"
                className="bg-white/10 text-white ring-white/15 hover:bg-white/20"
              >
                See how it works
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              No setup fees · No monthly cost · Cancel anytime
            </p>
          </div>
        </div>
        <div className="h-12 bg-gradient-to-b from-transparent to-slate-50" />
      </section>

      {/* BENEFITS */}
      <section className="container-page mt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to sell out
          </h2>
          <p className="mt-3 text-lg text-slate-500">
            A complete ticketing toolkit, built for organizers of every size.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="card group p-7 transition hover:-translate-y-1 hover:shadow-glow">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                {b.icon}
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-900">{b.title}</h3>
              <p className="mt-2 text-slate-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEE HIGHLIGHT */}
      <section className="container-page mt-20">
        <div className="grid items-center gap-8 rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100 sm:p-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Transparent pricing
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900">
              Pay only when you sell.
            </h2>
            <p className="mt-3 text-slate-500">
              No hidden costs, no surprises. Just a flat platform fee on each ticket you sell, plus
              Stripe&apos;s standard processing. Keep the rest.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
              {[
                "No monthly subscription",
                "No listing or setup fees",
                "Free customizable ticket designs",
                "Free door scanner for your team",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-glow">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Platform fee
            </p>
            <p className="mt-2 font-display text-7xl font-extrabold leading-none">{fee}%</p>
            <p className="mt-2 text-white/90">per ticket sold</p>
            <ButtonLink
              href="/signup?role=seller"
              variant="secondary"
              size="lg"
              className="mt-8 w-full"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* HOW SELLING WORKS */}
      <section id="how-it-works" className="container-page mt-24 scroll-mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How selling works
          </h2>
          <p className="mt-3 text-lg text-slate-500">From sign-up to sold-out, in four steps.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-slate-100">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                {s.icon}
              </span>
              <h3 className="relative mt-4 font-display text-lg font-bold text-slate-900">
                {s.title}
              </h3>
              <p className="relative mt-2 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page mt-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              Everything you need to know before you start selling.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition open:ring-brand-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  {faq.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 group-open:bg-brand-100 group-open:text-brand-600">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-page mt-24">
        <div className="surface-dark overflow-hidden rounded-3xl bg-brand-radial px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to sell your first ticket?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Join organizers using Eventiko to power unforgettable events. It&apos;s free to start.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup?role=seller" variant="primary" size="lg">
              Create your seller account
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="secondary"
              size="lg"
              className="bg-white/10 text-white ring-white/15 hover:bg-white/20"
            >
              Talk to us
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white underline">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
