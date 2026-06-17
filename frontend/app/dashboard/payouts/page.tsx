import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Wallet, TrendingUp, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { PayoutAccounts } from "@/components/dashboard/payout-accounts";
import { RequestPayout } from "@/components/dashboard/request-payout";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Seller, PayoutAccount, Payout } from "@/lib/types";

export const metadata: Metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/payouts");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Seller | null;
  if (!seller) redirect("/dashboard/onboarding");

  const [{ data: accountsData }, { data: payoutsData }, { data: settings }] = await Promise.all([
    supabase.from("payout_accounts").select("*").eq("seller_id", seller.id).order("created_at"),
    supabase.from("payouts").select("*").eq("seller_id", seller.id).order("requested_at", { ascending: false }),
    supabase.from("settings").select("payout_min, currency").eq("id", 1).single(),
  ]);

  const accounts = (accountsData as PayoutAccount[]) ?? [];
  const payouts = (payoutsData as Payout[]) ?? [];
  const currency = settings?.currency ?? "EUR";
  const minPayout = settings?.payout_min ?? 50;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Payouts</h1>
        <p className="mt-1 text-sm text-slate-500">Manage how you get paid and request withdrawals.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Available balance" value={formatMoney(seller.available_balance ?? 0, currency)} iconClassName="bg-emerald-100 text-emerald-700" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total sales" value={formatMoney(seller.total_sales ?? 0, currency)} />
        <StatCard icon={<Banknote className="h-5 w-5" />} label="Total paid out" value={formatMoney(seller.total_paid_out ?? 0, currency)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PayoutAccounts sellerId={seller.id} initialAccounts={accounts} />
        <RequestPayout
          sellerId={seller.id}
          balance={seller.available_balance ?? 0}
          minPayout={minPayout}
          currency={currency}
          accounts={accounts}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Payout history</h2>
        </div>
        {payouts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No payouts requested yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Requested</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Processed</th>
                  <th className="px-5 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-slate-600">{formatDate(p.requested_at)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatMoney(p.amount, p.currency)}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{p.processed_at ? formatDate(p.processed_at) : "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{p.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
