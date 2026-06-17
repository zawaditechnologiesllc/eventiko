import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Receipt, TrendingUp, Ticket as TicketIcon, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatMoney, formatDateTime } from "@/lib/utils";
import type { Seller } from "@/lib/types";

export const metadata: Metadata = { title: "Sales" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/orders");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Seller | null;
  if (!seller) redirect("/dashboard/onboarding");

  const { data: ordersData } = await supabase
    .from("orders")
    .select("*, order_items(*), event:events(title)")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = ordersData ?? [];
  const paid = orders.filter((o: any) => o.status === "paid");
  const gross = paid.reduce((s: number, o: any) => s + (o.subtotal || 0), 0);
  const fees = paid.reduce((s: number, o: any) => s + (o.platform_fee || 0), 0);
  const ticketsSold = paid.reduce(
    (s: number, o: any) => s + (o.order_items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0),
    0
  );
  const currency = seller.available_balance != null ? "EUR" : "EUR";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Sales</h1>
        <p className="mt-1 text-sm text-slate-500">Every order placed across your events.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Gross sales" value={formatMoney(gross, currency)} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Platform fees" value={formatMoney(fees, currency)} sublabel={`${seller.commission_rate ?? 8}% per sale`} />
        <StatCard icon={<TicketIcon className="h-5 w-5" />} label="Tickets sold" value={String(ticketsSold)} />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Paid orders" value={String(paid.length)} />
      </div>

      {orders.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Receipt className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-slate-900">No sales yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Once buyers start purchasing, every order will show up here in real time.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o: any) => {
                  const qty = o.order_items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{o.buyer_name || "—"}</p>
                        <p className="text-xs text-slate-400">{o.buyer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{o.event?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">{qty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatMoney(o.total || 0, o.currency)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                        {formatDateTime(o.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
