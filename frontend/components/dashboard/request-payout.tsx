"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import type { PayoutAccount } from "@/lib/types";

export function RequestPayout({
  sellerId,
  balance,
  minPayout,
  currency,
  accounts,
}: {
  sellerId: string;
  balance: number;
  minPayout: number;
  currency: string;
  accounts: PayoutAccount[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(balance > 0 ? balance : ""));
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.is_primary)?.id ?? accounts[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canRequest = balance >= minPayout && accounts.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (Number.isNaN(value) || value <= 0) return setError("Enter a valid amount.");
    if (value < minPayout) return setError(`Minimum payout is ${formatMoney(minPayout, currency)}.`);
    if (value > balance) return setError("Amount exceeds your available balance.");
    if (!accountId) return setError("Choose a payout account.");

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: e } = await supabase.from("payouts").insert({
        seller_id: sellerId,
        payout_account_id: accountId,
        amount: value,
        currency,
        status: "pending",
      });
      if (e) throw e;
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Request a payout</h2>
          <p className="text-sm text-slate-500">
            Available balance:{" "}
            <span className="font-bold text-slate-900">{formatMoney(balance, currency)}</span>
          </p>
        </div>
      </div>

      {done ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Payout request submitted. Our team will review it shortly.
        </div>
      ) : !canRequest ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {accounts.length === 0
            ? "Add a payout account above to request a payout."
            : `You need at least ${formatMoney(minPayout, currency)} available to request a payout.`}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="label">Amount ({currency})</label>
            <input
              type="number"
              min={minPayout}
              max={balance}
              step="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pay to</label>
            <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} · {a.method} ({a.currency})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Request {amount ? formatMoney(Number(amount) || 0, currency) : "payout"}
          </Button>
        </form>
      )}
    </div>
  );
}
