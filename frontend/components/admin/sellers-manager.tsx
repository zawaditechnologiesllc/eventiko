"use client";

import { useMemo, useState } from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Ban,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { PAYOUT_METHODS } from "@/lib/constants";
import type { SellerStatus } from "@/lib/types";
import type { SellerWithRelations } from "@/app/admin/sellers/page";

const STATUS_FILTERS: { value: "all" | SellerStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
];

function methodLabel(method: string) {
  return PAYOUT_METHODS.find((m) => m.id === method)?.label ?? method;
}

export function SellersManager({
  initialSellers,
}: {
  initialSellers: SellerWithRelations[];
}) {
  const [sellers, setSellers] = useState(initialSellers);
  const [filter, setFilter] = useState<"all" | SellerStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<SellerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: sellers.length };
    for (const s of sellers) map[s.status] = (map[s.status] ?? 0) + 1;
    return map;
  }, [sellers]);

  const filtered = useMemo(
    () => (filter === "all" ? sellers : sellers.filter((s) => s.status === filter)),
    [sellers, filter]
  );

  const selected = sellers.find((s) => s.id === selectedId) ?? null;

  async function updateStatus(id: string, status: SellerStatus) {
    setBusy(status);
    setError(null);
    const prev = sellers;
    setSellers((list) => list.map((s) => (s.id === id ? { ...s, status } : s)));
    const supabase = createClient();
    const { error: err } = await supabase.from("sellers").update({ status }).eq("id", id);
    setBusy(null);
    if (err) {
      setSellers(prev);
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
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
          { label: "Business" },
          { label: "Contact", hideBelow: "md" },
          { label: "Country", hideBelow: "lg" },
          { label: "Status" },
          { label: "Sales", align: "right", hideBelow: "sm" },
          { label: "Balance", align: "right", hideBelow: "lg" },
          { label: "Applied", hideBelow: "lg" },
          { label: "", align: "right" },
        ]}
        isEmpty={filtered.length === 0}
        empty="No sellers match this filter."
      >
        {filtered.map((seller) => (
          <DataTableRow key={seller.id} onClick={() => setSelectedId(seller.id)}>
            <DataTableCell>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{seller.business_name}</p>
                <p className="truncate text-xs text-slate-500 md:hidden">{seller.contact_email}</p>
              </div>
            </DataTableCell>
            <DataTableCell hideBelow="md">
              <span className="text-slate-600">{seller.contact_email}</span>
            </DataTableCell>
            <DataTableCell hideBelow="lg">{seller.country}</DataTableCell>
            <DataTableCell>
              <StatusBadge status={seller.status} />
            </DataTableCell>
            <DataTableCell align="right" hideBelow="sm">
              {formatMoney(Number(seller.total_sales ?? 0))}
            </DataTableCell>
            <DataTableCell align="right" hideBelow="lg">
              {formatMoney(Number(seller.available_balance ?? 0))}
            </DataTableCell>
            <DataTableCell hideBelow="lg">
              <span className="text-slate-500">{formatDate(seller.created_at)}</span>
            </DataTableCell>
            <DataTableCell align="right">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(seller.id);
                }}
              >
                Review
              </Button>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>

      {/* Review drawer */}
      {selected && (
        <SellerDrawer
          seller={selected}
          busy={busy}
          error={error}
          onClose={() => {
            setSelectedId(null);
            setError(null);
          }}
          onUpdate={(status) => updateStatus(selected.id, status)}
        />
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="break-words text-sm font-medium text-slate-800">{value || "—"}</div>
      </div>
    </div>
  );
}

function SellerDrawer({
  seller,
  busy,
  error,
  onClose,
  onUpdate,
}: {
  seller: SellerWithRelations;
  busy: SellerStatus | null;
  error: string | null;
  onClose: () => void;
  onUpdate: (status: SellerStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-xl font-bold text-slate-900">
                {seller.business_name}
              </h2>
              <StatusBadge status={seller.status} />
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {seller.legal_name || "No legal name provided"}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Summary numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Sales</p>
              <p className="font-display text-base font-bold text-slate-900">
                {formatMoney(Number(seller.total_sales ?? 0))}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Paid out</p>
              <p className="font-display text-base font-bold text-slate-900">
                {formatMoney(Number(seller.total_paid_out ?? 0))}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Balance</p>
              <p className="font-display text-base font-bold text-slate-900">
                {formatMoney(Number(seller.available_balance ?? 0))}
              </p>
            </div>
          </div>

          {/* Business details */}
          <div className="mt-5">
            <h3 className="mb-1 text-sm font-bold text-slate-900">Business details</h3>
            <div className="divide-y divide-slate-50">
              <DetailRow
                icon={<Mail className="h-4 w-4" />}
                label="Contact email"
                value={seller.contact_email}
              />
              <DetailRow
                icon={<Mail className="h-4 w-4" />}
                label="Account email"
                value={seller.profile?.email}
              />
              <DetailRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={seller.contact_phone}
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={[seller.address, seller.city, seller.country]
                  .filter(Boolean)
                  .join(", ")}
              />
              <DetailRow
                icon={<Globe className="h-4 w-4" />}
                label="Website"
                value={
                  seller.website ? (
                    <a
                      href={seller.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                    >
                      {seller.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null
                }
              />
              <DetailRow
                icon={<Building2 className="h-4 w-4" />}
                label="Commission rate"
                value={
                  seller.commission_rate != null ? `${seller.commission_rate}%` : "Platform default"
                }
              />
              <DetailRow
                icon={<FileText className="h-4 w-4" />}
                label="Description"
                value={seller.description}
              />
              {seller.id_document_url && (
                <DetailRow
                  icon={<FileText className="h-4 w-4" />}
                  label="ID document"
                  value={
                    <a
                      href={seller.id_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                    >
                      View document <ExternalLink className="h-3 w-3" />
                    </a>
                  }
                />
              )}
            </div>
          </div>

          {/* Payout accounts */}
          <div className="mt-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-slate-400" />
              Payout accounts
              <span className="text-xs font-medium text-slate-400">
                ({seller.payout_accounts?.length ?? 0})
              </span>
            </h3>
            {!seller.payout_accounts?.length ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                No payout accounts added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {seller.payout_accounts.map((acc) => (
                  <div key={acc.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        {methodLabel(acc.method)}
                      </span>
                      <div className="flex items-center gap-2">
                        {acc.is_primary && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Primary
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-400">{acc.currency}</span>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      {acc.label && <PayoutField label="Label" value={acc.label} />}
                      <PayoutField label="Account name" value={acc.account_name} />
                      {acc.bank_name && <PayoutField label="Bank" value={acc.bank_name} />}
                      {acc.account_number && (
                        <PayoutField label="Account number" value={acc.account_number} />
                      )}
                      {acc.iban && <PayoutField label="IBAN" value={acc.iban} />}
                      {acc.swift && <PayoutField label="SWIFT/BIC" value={acc.swift} />}
                      {acc.routing_number && (
                        <PayoutField label="Routing" value={acc.routing_number} />
                      )}
                      {acc.paypal_email && (
                        <PayoutField label="PayPal" value={acc.paypal_email} />
                      )}
                      {acc.other_details && (
                        <PayoutField label="Details" value={acc.other_details} />
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="border-t border-slate-100 p-5">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={busy === "approved"}
              disabled={!!busy || seller.status === "approved"}
              onClick={() => onUpdate("approved")}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={busy === "suspended"}
              disabled={!!busy || seller.status === "suspended"}
              onClick={() => onUpdate("suspended")}
            >
              <Ban className="h-4 w-4" /> Suspend
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={busy === "rejected"}
              disabled={!!busy || seller.status === "rejected"}
              onClick={() => onUpdate("rejected")}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayoutField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="break-words font-medium text-slate-800">{value}</dd>
    </div>
  );
}
