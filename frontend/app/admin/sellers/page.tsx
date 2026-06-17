import { createClient } from "@/lib/supabase/server";
import { SellersManager } from "@/components/admin/sellers-manager";
import type { PayoutAccount, Seller } from "@/lib/types";

export const dynamic = "force-dynamic";

export type SellerWithRelations = Seller & {
  profile: { email: string; full_name: string | null } | null;
  payout_accounts: PayoutAccount[];
};

export default async function AdminSellersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sellers")
    .select("*, profile:profiles(email, full_name), payout_accounts(*)")
    .order("created_at", { ascending: false });

  const sellers = (data ?? []) as unknown as SellerWithRelations[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Sellers
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review applications, inspect payout details and manage seller access.
        </p>
      </div>
      <SellersManager initialSellers={sellers} />
    </div>
  );
}
