"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  ScanLine,
  Wallet,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Sales", href: "/dashboard/orders", icon: Receipt },
  { label: "Scanner", href: "/dashboard/scanner", icon: ScanLine },
  { label: "Payouts", href: "/dashboard/payouts", icon: Wallet },
  { label: "Account", href: "/dashboard/account", icon: SettingsIcon },
];

interface SidebarProps {
  sellerName: string;
  status: string;
  isAdmin?: boolean;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ sellerName, status, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}

      {isAdmin && (
        <Link
          href="/admin"
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
        >
          <Shield className="h-[18px] w-[18px] shrink-0" />
          Admin panel
        </Link>
      )}
    </nav>
  );

  const footer = (
    <div className="space-y-1 px-3 pb-4">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ExternalLink className="h-[18px] w-[18px] shrink-0" />
        View site
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        Sign out
      </button>
    </div>
  );

  const sellerCard = (
    <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
        {initials(sellerName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{sellerName}</p>
        <div className="mt-0.5">
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>
        {sellerCard}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {sellerCard}
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
