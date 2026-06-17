import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Plus, Ticket as TicketIcon, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Seller, EventRecord, TicketType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Events",
};

function eventStats(tickets: TicketType[] | undefined) {
  const list = tickets ?? [];
  const sold = list.reduce((s, t) => s + (t.sold || 0), 0);
  const capacity = list.reduce((s, t) => s + (t.quantity || 0), 0);
  const currency = list[0]?.currency || "EUR";
  const revenue = list.reduce((s, t) => s + (t.sold || 0) * (t.price || 0), 0);
  return { sold, capacity, currency, revenue, types: list.length };
}

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/events");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Pick<Seller, "id"> | null;
  if (!seller) redirect("/dashboard/onboarding");

  const { data: eventsData } = await supabase
    .from("events")
    .select("*, ticket_types(*)")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  const events = (eventsData as EventRecord[] | null) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Events</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, customize and manage all of your events.
          </p>
        </div>
        <ButtonLink href="/dashboard/events/new">
          <Plus className="h-4 w-4" /> Create event
        </ButtonLink>
      </header>

      {events.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-white">
            <CalendarDays className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-slate-900">No events yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Set up your first event, design beautiful tickets and start selling in minutes.
          </p>
          <ButtonLink href="/dashboard/events/new" className="mt-5">
            <Plus className="h-4 w-4" /> Create your first event
          </ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((event) => {
            const s = eventStats(event.ticket_types);
            return (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow sm:flex-row"
              >
                <div className="relative h-40 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-44">
                  {event.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-brand-gradient text-white/80">
                      <CalendarDays className="h-9 w-9" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <StatusBadge status={event.status} />
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                      {event.title}
                    </h3>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 shrink-0 text-brand-500" />
                      {formatDate(event.starts_at, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-accent-500" />
                      <span className="line-clamp-1">
                        {[event.venue_name, event.city].filter(Boolean).join(", ") || "Location TBA"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                    <Stat label="Sold" value={`${s.sold}/${s.capacity || "∞"}`} />
                    <Stat
                      label="Revenue"
                      value={s.revenue > 0 ? formatMoney(s.revenue, s.currency) : "—"}
                    />
                    <Stat
                      label="Types"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <TicketIcon className="h-3.5 w-3.5 text-slate-400" />
                          {s.types}
                        </span>
                      }
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
