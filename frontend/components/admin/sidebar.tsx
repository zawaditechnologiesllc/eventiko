"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  CalendarDays,
  ShoppingCart,
  Ticket,
  Banknote,
  Megaphone,
  Newspaper,
  Settings,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Sellers", href: "/admin/sellers", icon: Store },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Payouts", href: "/admin/payouts", icon: Banknote },
  { label: "Promotions", href: "/admin/broadcasts", icon: Megaphone },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function FooterActions({ onNavigate }: { onNavigate?: () => void }) {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="space-y-1 border-t border-white/10 px-3 py-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5 shrink-0" />
        Back to site
      </Link>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll while the drawer is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="surface-dark hidden w-64 shrink-0 flex-col lg:flex lg:fixed lg:inset-y-0 lg:z-40">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Logo href="/admin" dark />
        </div>
        <div className="px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-200">
            Admin console
          </span>
        </div>
        <NavLinks />
        <FooterActions />
      </aside>

      {/* Mobile top bar */}
      <div className="surface-dark sticky top-0 z-40 flex h-16 items-center justify-between px-4 lg:hidden">
        <Logo href="/admin" dark />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <div className="surface-dark absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Logo href="/admin" dark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <FooterActions onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
