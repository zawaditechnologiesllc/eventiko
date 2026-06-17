"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
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
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [query, setQuery] = useState("");

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

      <DataTable
        columns={[
          { label: "Order" },
          { label: "Buyer", hideBelow: "md" },
          { label: "Event", hideBelow: "lg" },
          { label: "Fee", align: "right", hideBelow: "lg" },
          { label: "Total", align: "right" },
          { label: "Status", align: "right" },
          { label: "Date", hideBelow: "sm" },
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
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  );
}
