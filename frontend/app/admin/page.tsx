import Link from "next/link";
import {
  Users,
  Store,
  CalendarCheck,
  ShoppingCart,
  Wallet,
  Banknote,
  ArrowRight,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminStatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney, formatDateTime, timeFromNow } from "@/lib/utils";
import type { Order, Seller } from "@/lib/types";

export const dynamic = "force-dynamic";

type RecentOrder = Pick<
  Order,
  "id" | "order_number" | "buyer_email" | "buyer_name" | "total" | "currency" | "status" | "created_at"
> & { event: { title: string } | null };

type PendingSeller = Pick<
  Seller,
  "id" | "business_name" | "contact_email" | "country" | "created_at"
>;

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    usersCount,
    sellersCount,
    pendingSellersCount,
    publishedEventsCount,
    paidOrders,
    pendingPayouts,
    recentOrdersRes,
    pendingSellersRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("sellers").select("id", { count: "exact", head: true }),
    supabase
      .from("sellers")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("orders").select("total, platform_fee").eq("status", "paid"),
    supabase.from("payouts").select("amount, currency").eq("status", "pending"),
    supabase
      .from("orders")
      .select("id, order_number, buyer_email, buyer_name, total, currency, status, created_at, event:events(title)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("sellers")
      .select("id, business_name, contact_email, country, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const paid = (paidOrders.data ?? []) as { total: number; platform_fee: number }[];
  const grossRevenue = paid.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const platformEarnings = paid.reduce((sum, o) => sum + Number(o.platform_fee ?? 0), 0);
  const paidOrdersCount = paid.length;

  const payouts = (pendingPayouts.data ?? []) as { amount: number; currency: string }[];
  const pendingPayoutAmount = payouts.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const pendingPayoutCount = payouts.length;

  const recentOrders = (recentOrdersRes.data ?? []) as unknown as RecentOrder[];
  const pendingSellers = (pendingSellersRes.data ?? []) as PendingSeller[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform health at a glance — revenue, sellers and pending actions.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          icon={<Users className="h-5 w-5" />}
          label="Total users"
          value={(usersCount.count ?? 0).toLocaleString()}
          iconClassName="bg-brand-100 text-brand-700"
        />
        <AdminStatCard
          icon={<Store className="h-5 w-5" />}
          label="Sellers"
          value={(sellersCount.count ?? 0).toLocaleString()}
          highlight={(pendingSellersCount.count ?? 0) > 0}
          sublabel={
            (pendingSellersCount.count ?? 0) > 0 ? (
              <Link href="/admin/sellers" className="font-semibold text-amber-600 hover:underline">
                {pendingSellersCount.count} pending review
              </Link>
            ) : (
              "All applications reviewed"
            )
          }
          iconClassName="bg-accent-100 text-accent-700"
        />
        <AdminStatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Published events"
          value={(publishedEventsCount.count ?? 0).toLocaleString()}
          iconClassName="bg-emerald-100 text-emerald-700"
        />
        <AdminStatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Paid orders"
          value={paidOrdersCount.toLocaleString()}
          sublabel={`Gross revenue ${formatMoney(grossRevenue)}`}
          iconClassName="bg-blue-100 text-blue-700"
        />
        <AdminStatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Platform earnings"
          value={formatMoney(platformEarnings)}
          sublabel="Fees from paid orders"
          iconClassName="bg-gold-400/20 text-gold-600"
        />
        <AdminStatCard
          icon={<Banknote className="h-5 w-5" />}
          label="Pending payouts"
          value={pendingPayoutCount.toLocaleString()}
          highlight={pendingPayoutCount > 0}
          sublabel={
            pendingPayoutCount > 0 ? (
              <Link href="/admin/payouts" className="font-semibold text-amber-600 hover:underline">
                {formatMoney(pendingPayoutAmount)} awaiting payout
              </Link>
            ) : (
              "No requests waiting"
            )
          }
          iconClassName="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent orders */}
        <section className="card flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {order.event?.title ?? "Unknown event"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      #{order.order_number} · {order.buyer_name || order.buyer_email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(Number(order.total), order.currency)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pending seller applications */}
        <section className="card flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Seller applications</h2>
            <Link
              href="/admin/sellers"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              Review all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {pendingSellers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No applications waiting for review.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingSellers.map((seller) => (
                <li key={seller.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {seller.business_name}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <Clock className="h-3 w-3 shrink-0" />
                      {seller.country} · applied {timeFromNow(seller.created_at)}
                    </p>
                  </div>
                  <ButtonLink
                    href="/admin/sellers"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                  >
                    Review
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-center text-xs text-slate-400">
        Snapshot generated {formatDateTime(new Date())}.
      </p>
    </div>
  );
}
