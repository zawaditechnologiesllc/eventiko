"use client";

import { useMemo, useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  XCircle,
  Banknote,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
import { formatMoney, formatDateTime, cn } from "@/lib/utils";
import { PAYOUT_METHODS } from "@/lib/constants";
import type { PayoutStatus } from "@/lib/types";
import type { PayoutWithRelations } from "@/app/admin/payouts/page";

const STATUS_FILTERS: { value: "all" | PayoutStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function methodLabel(method?: string) {
  if (!method) return "—";
  return PAYOUT_METHODS.find((m) => m.id === method)?.label ?? method;
}

export function PayoutsManager({
  initialPayouts,
}: {
  initialPayouts: PayoutWithRelations[];
}) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [filter, setFilter] = useState<"all" | PayoutStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: payouts.length };
    for (const p of payouts) map[p.status] = (map[p.status] ?? 0) + 1;
    return map;
  }, [payouts]);

  const filtered = useMemo(
    () => (filter === "all" ? payouts : payouts.filter((p) => p.status === filter)),
    [payouts, filter]
  );

  const selected = payouts.find((p) => p.id === selectedId) ?? null;

  function applyUpdate(id: string, patch: Partial<PayoutWithRelations>) {
    setPayouts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filter === f.value
                ? "bg-ink text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">{counts[f.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          { label: "Seller" },
          { label: "Method", hideBelow: "md" },
          { label: "Requested", hideBelow: "lg" },
          { label: "Amount", align: "right" },
          { label: "Status" },
          { label: "", align: "right" },
        ]}
        isEmpty={filtered.length === 0}
        empty="No payout requests in this view."
      >
        {filtered.map((payout) => (
          <DataTableRow key={payout.id} onClick={() => setSelectedId(payout.id)}>
            <DataTableCell>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {payout.seller?.business_name ?? "Unknown seller"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {payout.seller?.contact_email}
                </p>
              </div>
            </DataTableCell>
            <DataTableCell hideBelow="md">
              {methodLabel(payout.payout_account?.method)}
            </DataTableCell>
            <DataTableCell hideBelow="lg">
              <span className="text-slate-500">{formatDateTime(payout.requested_at)}</span>
            </DataTableCell>
            <DataTableCell align="right">
              <span className="font-semibold text-slate-900">
                {formatMoney(Number(payout.amount ?? 0), payout.currency)}
              </span>
            </DataTableCell>
            <DataTableCell>
              <StatusBadge status={payout.status} />
            </DataTableCell>
            <DataTableCell align="right">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(payout.id);
                }}
              >
                Review
              </Button>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>

      {selected && (
        <PayoutDrawer
          payout={selected}
          onClose={() => setSelectedId(null)}
          onApplied={applyUpdate}
        />
      )}
    </div>
  );
}

function PayoutDrawer({
  payout,
  onClose,
  onApplied,
}: {
  payout: PayoutWithRelations;
  onClose: () => void;
  onApplied: (id: string, patch: Partial<PayoutWithRelations>) => void;
}) {
  const [reference, setReference] = useState(payout.reference ?? "");
  const [notes, setNotes] = useState(payout.notes ?? "");
  const [busy, setBusy] = useState<PayoutStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acc = payout.payout_account;
  const isFinal = payout.status === "paid" || payout.status === "rejected";

  async function process(status: PayoutStatus) {
    setError(null);

    if (status === "paid") {
      if (
        !window.confirm(
          `Mark ${formatMoney(Number(payout.amount), payout.currency)} to ${
            payout.seller?.business_name ?? "this seller"
          } as PAID? Only do this after the funds have actually been sent.`
        )
      ) {
        return;
      }
    }
    if (status === "rejected") {
      if (!window.confirm("Reject this payout request? The seller will be notified.")) {
        return;
      }
    }

    setBusy(status);
    const patch: Record<string, unknown> = { status };
    if (status === "paid" || status === "rejected") {
      patch.processed_at = new Date().toISOString();
    }
    if (status === "paid" && reference.trim()) {
      patch.reference = reference.trim();
    }
    if (status === "rejected") {
      patch.notes = notes.trim() || null;
    }

    const supabase = createClient();
    const { error: err } = await supabase.from("payouts").update(patch).eq("id", payout.id);
    setBusy(null);
    if (err) {
      setError(err.message);
      return;
    }
    onApplied(payout.id, patch as Partial<PayoutWithRelations>);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-xl font-bold text-slate-900">
                {payout.seller?.business_name ?? "Payout request"}
              </h2>
              <StatusBadge status={payout.status} />
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {payout.seller?.contact_email ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Amount */}
          <div className="rounded-2xl bg-brand-gradient p-5 text-white shadow-glow">
            <p className="text-sm font-medium opacity-90">Requested amount</p>
            <p className="font-display text-3xl font-extrabold">
              {formatMoney(Number(payout.amount ?? 0), payout.currency)}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Requested {formatDateTime(payout.requested_at)}
              {payout.processed_at && ` · Processed ${formatDateTime(payout.processed_at)}`}
            </p>
          </div>

          {/* Payout account */}
          <div className="mt-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-slate-400" />
              Destination account
            </h3>
            {!acc ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                No payout account is linked to this request. Verify with the seller before paying.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    {methodLabel(acc.method)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">{acc.currency}</span>
                </div>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  {acc.label && <Field label="Label" value={acc.label} />}
                  <Field label="Account name" value={acc.account_name} />
                  {acc.bank_name && <Field label="Bank" value={acc.bank_name} />}
                  {acc.account_number && (
                    <Field label="Account number" value={acc.account_number} mono />
                  )}
                  {acc.iban && <Field label="IBAN" value={acc.iban} mono />}
                  {acc.swift && <Field label="SWIFT/BIC" value={acc.swift} mono />}
                  {acc.routing_number && (
                    <Field label="Routing" value={acc.routing_number} mono />
                  )}
                  {acc.paypal_email && <Field label="PayPal email" value={acc.paypal_email} />}
                  {acc.other_details && <Field label="Other details" value={acc.other_details} />}
                </dl>
              </div>
            )}
          </div>

          {/* Reference + notes */}
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="payout-ref" className="label">
                Payment reference{" "}
                <span className="font-normal text-slate-400">(saved when marking paid)</span>
              </label>
              <input
                id="payout-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. bank transfer ID"
                className="input"
                disabled={isFinal}
              />
            </div>
            <div>
              <label htmlFor="payout-notes" className="label">
                Internal notes{" "}
                <span className="font-normal text-slate-400">(saved when rejecting)</span>
              </label>
              <textarea
                id="payout-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for rejection or any note for the record…"
                rows={3}
                className="input resize-none"
                disabled={isFinal}
              />
            </div>
          </div>

          {payout.notes && isFinal && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recorded notes
              </p>
              <p className="mt-0.5 text-slate-700">{payout.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 p-5">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {isFinal ? (
            <p className="text-center text-sm text-slate-500">
              This payout is {payout.status} and can no longer be changed.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {payout.status === "pending" && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busy === "approved"}
                  disabled={!!busy}
                  onClick={() => process("approved")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                loading={busy === "paid"}
                disabled={!!busy}
                onClick={() => process("paid")}
              >
                <Banknote className="h-4 w-4" /> Mark as paid
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={busy === "rejected"}
                disabled={!!busy}
                onClick={() => process("rejected")}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={cn("break-words font-medium text-slate-800", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}
