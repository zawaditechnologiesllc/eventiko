import type { Metadata } from "next";
import { Compass, Ticket } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="surface-dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-radial px-4 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent-500/40 blur-3xl" />
      </div>

      <div className="animate-fade-up">
        <Logo dark href="/" className="justify-center" />
      </div>

      <div className="mt-10 flex items-center gap-3 text-white/90 animate-fade-up">
        <Ticket className="h-7 w-7 text-accent-400" />
        <span className="font-display text-7xl font-extrabold tracking-tight sm:text-8xl">404</span>
      </div>

      <h1 className="mt-4 max-w-xl font-display text-2xl font-bold text-white sm:text-3xl">
        This show seems to have moved venues.
      </h1>
      <p className="mt-3 max-w-md text-balance text-slate-300">
        We couldn&apos;t find the page you were looking for. It may have ended, sold out, or never
        existed. Let&apos;s get you back to the action.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <ButtonLink href="/" variant="primary" size="lg">
          Back to home
        </ButtonLink>
        <ButtonLink href="/events" variant="secondary" size="lg">
          <Compass className="h-4 w-4" />
          Browse events
        </ButtonLink>
      </div>
    </main>
  );
}
