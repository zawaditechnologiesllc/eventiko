import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Wallet,
  TrendingUp,
  CalendarCheck,
  Ticket as TicketIcon,
  Plus,
  ScanLine,
  ArrowUpRight,
  Clock,
  CalendarPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Seller, EventRecord, Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Seller | null;
  if (!seller) redirect("/dashboard/onboarding");

  const [{ data: eventsData }, { data: ordersData }] = await Promise.all([
    supabase
      .from("events")
      .select("*, ticket_types(*)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, order_items(*), event:events(title)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const events = (eventsData as EventRecord[] | null) ?? [];
  const recentOrders = (ordersData as Order[] | null) ?? [];

  const activeEvents = events.filter((e) => e.status === "published").length;
  const ticketsSold = events.reduce(
    (sum, e) => sum + (e.ticket_types?.reduce((s, t) => s + (t.sold || 0), 0) ?? 0),
    0
  );
  const currency = "EUR";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with {seller.business_name}.
          </p>
        </div>
        <ButtonLink href="/dashboard/events/new">
          <Plus className="h-4 w-4" /> New event
        </ButtonLink>
      </header>

      {seller.status === "pending" && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Your seller application is under review.</p>
            <p className="mt-0.5 text-amber-800/90">
              You can create and customize events now — they&apos;ll go live once your account is
              approved (usually within 1–2 business days).
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total sales"
          value={formatMoney(seller.total_sales ?? 0, currency)}
          iconClassName="bg-brand-100 text-brand-700"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Available balance"
          value={formatMoney(seller.available_balance ?? 0, currency)}
          sublabel="Ready to withdraw"
          iconClassName="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Active events"
          value={activeEvents}
          sublabel={`${events.length} total`}
          iconClassName="bg-accent-100 text-accent-700"
        />
        <StatCard
          icon={<TicketIcon className="h-5 w-5" />}
          label="Tickets sold"
          value={ticketsSold}
          iconClassName="bg-gold-400/20 text-gold-600"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction
          href="/dashboard/events/new"
          icon={<CalendarPlus className="h-5 w-5" />}
          title="Create an event"
          desc="Set up a new event and start selling."
        />
        <QuickAction
          href="/dashboard/scanner"
          icon={<ScanLine className="h-5 w-5" />}
          title="Open scanner"
          desc="Validate tickets at the door."
        />
        <QuickAction
          href="/dashboard/payouts"
          icon={<Wallet className="h-5 w-5" />}
          title="Request a payout"
          desc="Withdraw your available balance."
        />
      </div>

      {/* Recent orders */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Recent sales</h2>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
              <TicketIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-700">No sales yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {events.length === 0
                ? "Create your first event to start selling tickets."
                : "Share your event link to get your first sale."}
            </p>
            {events.length === 0 && (
              <ButtonLink href="/dashboard/events/new" size="sm" className="mt-4">
                <Plus className="h-4 w-4" /> Create your first event
              </ButtonLink>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold sm:px-6">Order</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">Date</th>
                  <th className="px-5 py-3 text-right font-semibold sm:px-6">Total</th>
                  <th className="px-5 py-3 text-right font-semibold sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 sm:px-6">
                      <p className="font-semibold text-slate-900">{o.buyer_name || "Guest"}</p>
                      <p className="text-xs text-slate-400">{o.order_number}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="line-clamp-1">{o.event?.title || "—"}</span>
                    </td>
                    <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 sm:px-6">
                      {formatMoney(o.total, o.currency)}
                    </td>
                    <td className="px-5 py-3 text-right sm:px-6">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 font-semibold text-slate-900">
          {title}
          <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
        </p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
