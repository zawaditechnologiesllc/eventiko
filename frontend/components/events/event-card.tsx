import Link from "next/link";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EventRecord } from "@/lib/types";

function lowestPrice(e: EventRecord) {
  const prices = (e.ticket_types || []).filter((t) => t.is_active).map((t) => t.price);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export function EventCard({ event }: { event: EventRecord }) {
  const from = lowestPrice(event);
  const currency = event.ticket_types?.[0]?.currency || "EUR";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-brand-gradient text-white/80">
            <CalendarDays className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {event.category && <Badge tone="brand">{event.category}</Badge>}
          {event.featured && <Badge tone="amber">★ Featured</Badge>}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">
          {event.title}
        </h3>
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand-500" />
            {formatDate(event.starts_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-accent-500" />
            <span className="line-clamp-1">{[event.venue_name, event.city, event.country].filter(Boolean).join(", ") || "Online"}</span>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-xs text-slate-400">From</span>
            <p className="font-bold text-slate-900">
              {from === null ? "Free" : from === 0 ? "Free" : formatMoney(from, currency)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
            Get tickets <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="aspect-[16/10] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
