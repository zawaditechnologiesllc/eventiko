"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { formatMoney, formatDateTime, cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import type { OrderWithEvent } from "@/app/admin/orders/page";

const STATUS_FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersTable({ orders }: { orders: OrderWithEvent[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [query, setQuery] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refund(order: OrderWithEvent) {
    if (
      !confirm(
        `Refund order #${order.order_number}? This refunds the buyer via Stripe, cancels its tickets and reverses the sale. This cannot be undone.`
      )
    )
      return;
    setRefundingId(order.id);
    setError(null);
    try {
      const { data } = await createClient().auth.getSession();
      await api.refundOrder(order.order_number, data.session?.access_token ?? "");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refund failed.");
    } finally {
      setRefundingId(null);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (
        q &&
        !o.order_number.toLowerCase().includes(q) &&
        !o.buyer_email.toLowerCase().includes(q) &&
        !(o.buyer_name ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order # or buyer…"
            className="input pl-10"
            aria-label="Search orders"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <DataTable
        columns={[
          { label: "Order" },
          { label: "Buyer", hideBelow: "md" },
          { label: "Event", hideBelow: "lg" },
          { label: "Fee", align: "right", hideBelow: "lg" },
          { label: "Total", align: "right" },
          { label: "Status", align: "right" },
          { label: "Date", hideBelow: "sm" },
          { label: "", align: "right" },
        ]}
        isEmpty={filtered.length === 0}
        empty="No orders match these filters."
      >
        {filtered.map((order) => (
          <DataTableRow key={order.id}>
            <DataTableCell>
              <span className="font-mono text-xs font-semibold text-slate-900">
                #{order.order_number}
              </span>
            </DataTableCell>
            <DataTableCell hideBelow="md">
              <div className="min-w-0">
                <p className="truncate text-slate-800">{order.buyer_name || "—"}</p>
                <p className="truncate text-xs text-slate-500">{order.buyer_email}</p>
              </div>
            </DataTableCell>
            <DataTableCell hideBelow="lg">
              <span className="block max-w-[220px] truncate text-slate-600">
                {order.event?.title ?? "—"}
              </span>
            </DataTableCell>
            <DataTableCell align="right" hideBelow="lg">
              <span className="text-slate-500">
                {formatMoney(Number(order.platform_fee ?? 0), order.currency)}
              </span>
            </DataTableCell>
            <DataTableCell align="right">
              <span className="font-semibold text-slate-900">
                {formatMoney(Number(order.total ?? 0), order.currency)}
              </span>
            </DataTableCell>
            <DataTableCell align="right">
              <StatusBadge status={order.status} />
            </DataTableCell>
            <DataTableCell hideBelow="sm">
              <span className="text-slate-500">{formatDateTime(order.created_at)}</span>
            </DataTableCell>
            <DataTableCell align="right">
              {order.status === "paid" ? (
                <button
                  type="button"
                  onClick={() => refund(order)}
                  disabled={refundingId === order.id}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {refundingId === order.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Refund
                </button>
              ) : null}
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  );
}
