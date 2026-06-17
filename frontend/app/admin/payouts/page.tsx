import { createClient } from "@/lib/supabase/server";
import { PayoutsManager } from "@/components/admin/payouts-manager";
import type { Payout, PayoutAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

export type PayoutWithRelations = Payout & {
  seller: { business_name: string; contact_email: string } | null;
  payout_account: PayoutAccount | null;
};

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select(
      "*, seller:sellers(business_name, contact_email), payout_account:payout_accounts(*)"
    )
    .order("requested_at", { ascending: false });

  const payouts = (data ?? []) as unknown as PayoutWithRelations[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Payouts
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review withdrawal requests, verify account details and release funds.
        </p>
      </div>
      <PayoutsManager initialPayouts={payouts} />
    </div>
  );
}
