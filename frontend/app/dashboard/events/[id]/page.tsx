import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  ExternalLink,
  Eye,
  Ticket as TicketIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/badge";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { TicketStudio } from "@/components/dashboard/ticket-studio";
import { EventDetailsEditor } from "@/components/dashboard/event-details-editor";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { Seller, EventRecord, TicketType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Manage event",
};

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/dashboard/events/${id}`);

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Pick<Seller, "id"> | null;
  if (!seller) redirect("/dashboard/onboarding");

  const { data: eventData } = await supabase
    .from("events")
    .select("*, ticket_types(*)")
    .eq("id", id)
    .maybeSingle();

  const event = eventData as EventRecord | null;
  if (!event) notFound();
  // Ownership guard — sellers can only manage their own events.
  if (event.seller_id !== seller.id) redirect("/dashboard/events");

  const ticketTypes = ([...(event.ticket_types ?? [])] as TicketType[]).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const canPublish = ticketTypes.some((t) => t.is_active);
  const totalSold = ticketTypes.reduce((s, t) => s + (t.sold || 0), 0);
  const totalCapacity = ticketTypes.reduce((s, t) => s + (t.quantity || 0), 0);
  const revenue = ticketTypes.reduce((s, t) => s + (t.sold || 0) * (t.price || 0), 0);
  const currency = ticketTypes[0]?.currency || "EUR";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      {/* Summary header */}
      <header className="card overflow-hidden">
        <div className="relative h-40 w-full bg-slate-100 sm:h-48">
          {event.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-brand-gradient text-white/80">
              <CalendarDays className="h-10 w-10" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={event.status} />
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold leading-tight text-slate-900">
                {event.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  {formatDateTime(event.starts_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-accent-500" />
                  {[event.venue_name, event.city, event.country].filter(Boolean).join(", ") ||
                    "Location TBA"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              <PublishToggle eventId={event.id} status={event.status} canPublish={canPublish} />
              {event.status === "published" && (
                <Link
                  href={`/events/${event.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  <ExternalLink className="h-4 w-4" /> View public page
                </Link>
              )}
            </div>
          </div>

          {!canPublish && event.status === "draft" && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ring-1 ring-amber-100">
              Add at least one active ticket type below before you can publish this event.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <Metric icon={<TicketIcon className="h-4 w-4" />} label="Tickets sold" value={String(totalSold)} />
            <Metric icon={<TicketIcon className="h-4 w-4" />} label="Capacity" value={totalCapacity ? String(totalCapacity) : "—"} />
            <Metric icon={<Eye className="h-4 w-4" />} label="Views" value={String(event.views ?? 0)} />
            <Metric
              icon={<CalendarDays className="h-4 w-4" />}
              label="Revenue"
              value={revenue > 0 ? formatMoney(revenue, currency) : "—"}
            />
          </div>
        </div>
      </header>

      {/* Edit details (collapsible) */}
      <EventDetailsEditor event={event} sellerId={seller.id} />

      {/* Ticket studio */}
      <section className="card p-5 sm:p-6">
        <TicketStudio eventId={event.id} event={event} ticketTypes={ticketTypes} />
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
