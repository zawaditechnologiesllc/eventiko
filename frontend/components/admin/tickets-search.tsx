"use client";

import { useState } from "react";
import { Search, Ticket as TicketIcon, ScanLine, User, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
import { formatDateTime } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

type TicketWithEvent = Ticket & { event: { title: string } | null };

export function TicketsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TicketWithEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("tickets")
      .select("*, event:events(title)")
      .ilike("reference_number", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (err) {
      setError(err.message);
      setResults([]);
      return;
    }
    setResults((data ?? []) as unknown as TicketWithEvent[]);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={search} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter ticket reference number…"
            className="input pl-10"
            aria-label="Ticket reference number"
            autoFocus
          />
        </div>
        <Button type="submit" loading={loading} className="sm:w-auto">
          Search tickets
        </Button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {results === null ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <TicketIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-slate-600">
            Search a reference number to look up a ticket.
          </p>
          <p className="max-w-sm text-xs text-slate-400">
            You can paste a partial reference — matching is case-insensitive.
          </p>
        </div>
      ) : (
        <DataTable
          columns={[
            { label: "Reference" },
            { label: "Event", hideBelow: "md" },
            { label: "Holder", hideBelow: "sm" },
            { label: "Scanned", hideBelow: "lg" },
            { label: "Status", align: "right" },
          ]}
          isEmpty={results.length === 0}
          empty="No tickets found for that reference."
        >
          {results.map((ticket) => (
            <DataTableRow key={ticket.id}>
              <DataTableCell>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-slate-900">
                    {ticket.reference_number}
                  </p>
                  {ticket.seat && (
                    <p className="text-xs text-slate-500">Seat {ticket.seat}</p>
                  )}
                </div>
              </DataTableCell>
              <DataTableCell hideBelow="md">
                <span className="block max-w-[220px] truncate text-slate-600">
                  {ticket.event?.title ?? "—"}
                </span>
              </DataTableCell>
              <DataTableCell hideBelow="sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-slate-800">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {ticket.holder_name || "—"}
                  </p>
                  {ticket.holder_email && (
                    <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                      {ticket.holder_email}
                    </p>
                  )}
                </div>
              </DataTableCell>
              <DataTableCell hideBelow="lg">
                {ticket.scanned_at ? (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <ScanLine className="h-3.5 w-3.5 text-slate-400" />
                    {formatDateTime(ticket.scanned_at)}
                    {ticket.scan_count > 1 && (
                      <span className="text-xs text-amber-600">×{ticket.scan_count}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400">Not scanned</span>
                )}
              </DataTableCell>
              <DataTableCell align="right">
                <StatusBadge status={ticket.status} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
