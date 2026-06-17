"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink, Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setUser(null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", data.user.id)
        .single();
      setUser({ email: data.user.email, name: profile?.full_name, role: profile?.role });
    });
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) setUser(null);
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled ? "border-b border-slate-200 bg-white/90 backdrop-blur-lg" : "bg-transparent"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                pathname.startsWith(link.href) && "text-brand-700"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/events" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Search events">
            <Search className="h-5 w-5" />
          </Link>
          {user ? (
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {initials(user.name || user.email)}
                </span>
              </button>
              <div className="invisible absolute right-0 top-full w-52 translate-y-1 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-card transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <p className="truncate px-3 py-2 text-xs text-slate-400">{user.email}</p>
                <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100">
                    <UserIcon className="h-4 w-4" /> Admin panel
                  </Link>
                )}
                <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/sell" variant="primary" size="sm">
                Sell tickets
              </ButtonLink>
            </>
          )}
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page space-y-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100">
                {link.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-3">
              {user ? (
                <>
                  <ButtonLink href="/dashboard" variant="secondary" className="w-full">Dashboard</ButtonLink>
                  <Button variant="ghost" onClick={signOut} className="w-full">Sign out</Button>
                </>
              ) : (
                <>
                  <ButtonLink href="/login" variant="secondary" className="w-full">Log in</ButtonLink>
                  <ButtonLink href="/sell" variant="primary" className="w-full">Sell tickets</ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
