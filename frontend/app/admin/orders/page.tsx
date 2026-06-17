import { ShoppingCart, Wallet, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminStatCard } from "@/components/admin/stat-card";
import { OrdersTable } from "@/components/admin/orders-table";
import { formatMoney } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export type OrderWithEvent = Order & { event: { title: string } | null };

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, event:events(title)")
    .order("created_at", { ascending: false })
    .limit(500);

  const orders = (data ?? []) as unknown as OrderWithEvent[];

  const paid = orders.filter((o) => o.status === "paid");
  const grossRevenue = paid.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const platformEarnings = paid.reduce((sum, o) => sum + Number(o.platform_fee ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Every transaction across the platform, with revenue summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Paid orders"
          value={paid.length.toLocaleString()}
          sublabel={`${orders.length.toLocaleString()} total records`}
          iconClassName="bg-blue-100 text-blue-700"
        />
        <AdminStatCard
          icon={<Banknote className="h-5 w-5" />}
          label="Gross revenue"
          value={formatMoney(grossRevenue)}
          sublabel="Sum of paid order totals"
          iconClassName="bg-emerald-100 text-emerald-700"
        />
        <AdminStatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Platform earnings"
          value={formatMoney(platformEarnings)}
          sublabel="Fees collected"
          iconClassName="bg-gold-400/20 text-gold-600"
        />
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
