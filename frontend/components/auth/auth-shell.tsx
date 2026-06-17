import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Sparkles, ShieldCheck, QrCode, Ticket } from "lucide-react";

/**
 * Split-screen auth layout: branded gradient panel on desktop, form on the
 * right. Shared by the login and signup pages.
 */
export function AuthShell({
  children,
  heading,
  sub,
}: {
  children: React.ReactNode;
  heading: string;
  sub: string;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-brand-radial opacity-90" />
        <div className="relative">
          <Logo dark />
        </div>
        <div className="relative space-y-6">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Live moments, made unforgettable.
          </h2>
          <ul className="space-y-3 text-white/80">
            {[
              { icon: Sparkles, t: "Beautiful, fully customizable tickets" },
              { icon: QrCode, t: "Secure QR codes, scanned at the door" },
              { icon: ShieldCheck, t: "Protected payments powered by Stripe" },
              { icon: Ticket, t: "Sell to a global audience in minutes" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Eventiko. Tickets for the world&apos;s best events.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight text-slate-900 lg:mt-0">
            {heading}
          </h1>
          <p className="mt-2 text-slate-500">{sub}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing you agree to our{" "}
            <Link href="/terms" className="font-semibold text-brand-600 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
