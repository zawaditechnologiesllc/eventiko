"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
import { formatDateTime, cn } from "@/lib/utils";
import type { EventStatus } from "@/lib/types";
import type { EventWithSeller } from "@/app/admin/events/page";

const STATUS_FILTERS: { value: "all" | EventStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export function EventsManager({
  initialEvents,
}: {
  initialEvents: EventWithSeller[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState<"all" | EventStatus>("all");
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: events.length };
    for (const e of events) map[e.status] = (map[e.status] ?? 0) + 1;
    return map;
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (q && !e.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, filter, query]);

  async function toggleFeatured(id: string, featured: boolean) {
    setPendingId(id);
    setError(null);
    const prev = events;
    setEvents((list) => list.map((e) => (e.id === id ? { ...e, featured } : e)));
    const supabase = createClient();
    const { error: err } = await supabase.from("events").update({ featured }).eq("id", id);
    setPendingId(null);
    if (err) {
      setEvents(prev);
      setError(err.message);
    }
  }

  async function toggleStatus(id: string, status: EventStatus) {
    setPendingId(id);
    setError(null);
    const prev = events;
    setEvents((list) => list.map((e) => (e.id === id ? { ...e, status } : e)));
    const supabase = createClient();
    const { error: err } = await supabase.from("events").update({ status }).eq("id", id);
    setPendingId(null);
    if (err) {
      setEvents(prev);
      setError(err.message);
    }
  }

  async function remove(id: string, title: string) {
    if (
      !window.confirm(
        `Delete "${title}"? This permanently removes the event and cannot be undone.`
      )
    ) {
      return;
    }
    setPendingId(id);
    setError(null);
    const prev = events;
    setEvents((list) => list.filter((e) => e.id !== id));
    const supabase = createClient();
    const { error: err } = await supabase.from("events").delete().eq("id", id);
    setPendingId(null);
    if (err) {
      setEvents(prev);
      setError(err.message);
    }
  }

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
            placeholder="Search events…"
            className="input pl-10"
            aria-label="Search events"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <DataTable
        columns={[
          { label: "Event" },
          { label: "Organizer", hideBelow: "lg" },
          { label: "Date", hideBelow: "md" },
          { label: "Views", align: "right", hideBelow: "sm" },
          { label: "Status" },
          { label: "Actions", align: "right" },
        ]}
        isEmpty={filtered.length === 0}
        empty="No events match these filters."
      >
        {filtered.map((event) => {
          const busy = pendingId === event.id;
          return (
            <DataTableRow key={event.id}>
              <DataTableCell>
                <div className="flex items-center gap-2">
                  {event.featured && (
                    <Star className="h-4 w-4 shrink-0 fill-gold-400 text-gold-400" aria-label="Featured" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{event.title}</p>
                    <p className="truncate text-xs text-slate-500 lg:hidden">
                      {event.seller?.business_name ?? "—"}
                    </p>
                  </div>
                </div>
              </DataTableCell>
              <DataTableCell hideBelow="lg">
                {event.seller?.business_name ?? <span className="text-slate-400">—</span>}
              </DataTableCell>
              <DataTableCell hideBelow="md">
                <span className="text-slate-500">{formatDateTime(event.starts_at)}</span>
              </DataTableCell>
              <DataTableCell align="right" hideBelow="sm">
                {Number(event.views ?? 0).toLocaleString()}
              </DataTableCell>
              <DataTableCell>
                <StatusBadge status={event.status} />
              </DataTableCell>
              <DataTableCell align="right">
                <div className="flex items-center justify-end gap-1">
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleFeatured(event.id, !event.featured)}
                    title={event.featured ? "Unfeature" : "Feature"}
                    aria-label={event.featured ? "Unfeature event" : "Feature event"}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg transition disabled:opacity-50",
                      event.featured
                        ? "bg-gold-400/20 text-gold-600 hover:bg-gold-400/30"
                        : "text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <Star className={cn("h-4 w-4", event.featured && "fill-current")} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      toggleStatus(event.id, event.status === "published" ? "draft" : "published")
                    }
                    title={event.status === "published" ? "Unpublish" : "Publish"}
                    aria-label={event.status === "published" ? "Unpublish event" : "Publish event"}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    {event.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    title="View public page"
                    aria-label="View public page"
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(event.id, event.title)}
                    title="Delete"
                    aria-label="Delete event"
                    className="grid h-9 w-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </DataTableCell>
            </DataTableRow>
          );
        })}
      </DataTable>
    </div>
  );
}
