"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Star, X, AlertCircle, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PayoutAccountFields,
  emptyPayoutAccount,
  type PayoutAccountDraft,
} from "@/components/dashboard/payout-account-fields";
import { createClient } from "@/lib/supabase/client";
import { PAYOUT_METHODS } from "@/lib/constants";
import type { PayoutAccount } from "@/lib/types";

function draftFrom(a: PayoutAccount): PayoutAccountDraft {
  return {
    method: a.method,
    label: a.label ?? "",
    account_name: a.account_name ?? "",
    account_number: a.account_number ?? "",
    bank_name: a.bank_name ?? "",
    iban: a.iban ?? "",
    swift: a.swift ?? "",
    routing_number: a.routing_number ?? "",
    paypal_email: a.paypal_email ?? "",
    other_details: a.other_details ?? "",
    currency: a.currency ?? "EUR",
    is_primary: a.is_primary ?? false,
  };
}

function summarize(a: PayoutAccount): string {
  if (a.method === "paypal") return a.paypal_email || "PayPal";
  if (a.method === "bank" || a.method === "wise") return [a.bank_name, a.iban || a.account_number].filter(Boolean).join(" · ");
  return a.other_details || "—";
}

export function PayoutAccounts({
  sellerId,
  initialAccounts,
}: {
  sellerId: string;
  initialAccounts: PayoutAccount[];
}) {
  const router = useRouter();
  const [accounts] = useState<PayoutAccount[]>(initialAccounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PayoutAccountDraft>(emptyPayoutAccount());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = accounts.length >= 3;
  const open = adding || editingId !== null;

  function startAdd() {
    setError(null);
    setEditingId(null);
    setAdding(true);
    setDraft({ ...emptyPayoutAccount(), is_primary: accounts.length === 0 });
  }
  function startEdit(a: PayoutAccount) {
    setError(null);
    setAdding(false);
    setEditingId(a.id);
    setDraft(draftFrom(a));
  }
  function close() {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!draft.account_name.trim()) return setError("Account holder name is required.");
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = { ...draft, seller_id: sellerId };

      if (draft.is_primary) {
        // demote others
        await supabase.from("payout_accounts").update({ is_primary: false }).eq("seller_id", sellerId);
      }

      if (editingId) {
        const { error: e } = await supabase.from("payout_accounts").update(payload).eq("id", editingId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("payout_accounts").insert(payload);
        if (e) throw e;
      }
      close();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the account.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this payout account?")) return;
    const supabase = createClient();
    await supabase.from("payout_accounts").delete().eq("id", id);
    router.refresh();
  }

  async function makePrimary(id: string) {
    const supabase = createClient();
    await supabase.from("payout_accounts").update({ is_primary: false }).eq("seller_id", sellerId);
    await supabase.from("payout_accounts").update({ is_primary: true }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Payout accounts</h2>
          <p className="text-sm text-slate-500">Add up to 3 accounts. All payouts are reviewed manually.</p>
        </div>
        {!open && !atLimit && (
          <Button size="sm" variant="secondary" onClick={startAdd}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {accounts.length === 0 && !open && (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No payout accounts yet. Add one to request payouts.
          </p>
        )}

        {accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
              <Banknote className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-slate-900">{a.account_name}</p>
                {a.is_primary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    <Star className="h-3 w-3" /> Primary
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">
                {PAYOUT_METHODS.find((m) => m.id === a.method)?.label} · {summarize(a)} · {a.currency}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!a.is_primary && (
                <button onClick={() => makePrimary(a.id)} title="Make primary" className="grid h-8 w-8 place-items-center rounded-lg text-amber-500 hover:bg-amber-50">
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => startEdit(a)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{editingId ? "Edit account" : "New payout account"}</h3>
            <button onClick={close} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <PayoutAccountFields value={draft} onChange={setDraft} />
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={draft.is_primary}
              onChange={(e) => setDraft({ ...draft, is_primary: e.target.checked })}
            />
            Set as primary payout account
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save account</Button>
          </div>
        </div>
      )}
    </div>
  );
}
