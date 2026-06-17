import Link from "next/link";
import { Mail, Phone, Twitter, Instagram, Facebook } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Settings } from "@/lib/types";

const DEFAULT_COLUMNS = [
  {
    title: "Discover",
    links: [
      { label: "All events", href: "/events" },
      { label: "News", href: "/news" },
      { label: "Sell tickets", href: "/sell" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function Footer({ settings }: { settings?: Settings | null }) {
  const footer = settings?.footer || {};
  const columns = footer.columns?.length ? footer.columns : DEFAULT_COLUMNS;
  const social = footer.social || {};

  return (
    <footer className="surface-dark mt-24 bg-brand-radial">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-300">
            {footer.about ||
              "Eventiko is a global ticketing platform connecting fans with unforgettable live experiences."}
          </p>
          <div className="mt-5 flex gap-3">
            {social.twitter && <Social href={social.twitter}><Twitter className="h-4 w-4" /></Social>}
            {social.instagram && <Social href={social.instagram}><Instagram className="h-4 w-4" /></Social>}
            {social.facebook && <Social href={social.facebook}><Facebook className="h-4 w-4" /></Social>}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-300 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Get in touch</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-400" />
              <a href={`mailto:${footer.contactEmail || "support@eventiko.com"}`} className="hover:text-white">
                {footer.contactEmail || "support@eventiko.com"}
              </a>
            </li>
            {footer.contactPhone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" />
                <span>{footer.contactPhone}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Eventiko. All rights reserved.</p>
          <p>Secure payments by Stripe · Tickets verified with QR</p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
    >
      {children}
    </a>
  );
}
