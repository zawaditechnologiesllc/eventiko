import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  Share2,
  Ticket,
  ChevronRight,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { getEventBySlug } from "@/lib/data";
import { formatDate, formatDateTime, initials, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TicketSelector } from "@/components/checkout/ticket-selector";
import { SITE } from "@/lib/constants";
import type { EventRecord } from "@/lib/types";

type Params = Promise<{ slug: string }>;

function mapsHref(event: EventRecord) {
  if (event.latitude != null && event.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
  }
  const q = [event.venue_name, event.address, event.city, event.country]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function lowestPrice(event: EventRecord) {
  const prices = (event.ticket_types || []).filter((t) => t.is_active).map((t) => t.price);
  return prices.length ? Math.min(...prices) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return { title: "Event not found", robots: { index: false, follow: false } };
  }

  const description = event.description
    ? truncate(event.description.replace(/\s+/g, " "), 155)
    : `Get tickets for ${event.title}${
        event.city ? ` in ${event.city}` : ""
      } on ${SITE.name}. Secure checkout, instant QR tickets.`;

  const images = event.cover_image_url ? [event.cover_image_url] : undefined;

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "website",
      title: `${event.title} · ${SITE.name}`,
      description,
      url: `${SITE.url}/events/${event.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images,
    },
  };
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "published") notFound();

  const from = lowestPrice(event);
  const currency = event.ticket_types?.[0]?.currency || "EUR";
  const location = [event.venue_name, event.city, event.country].filter(Boolean).join(", ");
  const organizerName = event.seller?.business_name || "Eventiko organizer";
  const gallery = (event.gallery || []).filter(Boolean);

  const lowPrice = event.ticket_types?.length
    ? Math.min(...event.ticket_types.map((t) => t.price))
    : undefined;
  const highPrice = event.ticket_types?.length
    ? Math.max(...event.ticket_types.map((t) => t.price))
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: event.starts_at,
    endDate: event.ends_at || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.cover_image_url ? [event.cover_image_url] : undefined,
    url: `${SITE.url}/events/${event.slug}`,
    location: {
      "@type": "Place",
      name: event.venue_name || event.city || "Venue",
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address || undefined,
        addressLocality: event.city || undefined,
        addressCountry: event.country || undefined,
      },
      ...(event.latitude != null && event.longitude != null
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.latitude,
              longitude: event.longitude,
            },
          }
        : {}),
    },
    organizer: {
      "@type": "Organization",
      name: organizerName,
    },
    ...(lowPrice != null
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: currency,
            lowPrice,
            highPrice,
            availability: "https://schema.org/InStock",
            url: `${SITE.url}/events/${event.slug}`,
          },
        }
      : {}),
  };

  return (
    <article className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="relative">
        <div className="relative h-[44vh] min-h-[320px] w-full overflow-hidden bg-ink sm:h-[56vh]">
          {event.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
        </div>

        <div className="container-page relative -mt-44 sm:-mt-48">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-white/70" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/events" className="transition hover:text-white">
              Events
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate text-white/90">{event.title}</span>
          </nav>

          <div className="max-w-3xl animate-fade-up text-white">
            <div className="flex flex-wrap items-center gap-2">
              {event.category && <Badge tone="brand">{event.category}</Badge>}
              {event.featured && <Badge tone="amber">★ Featured</Badge>}
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {event.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/90">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-300" />
                {formatDate(event.starts_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-300" />
                {formatDate(event.starts_at, { hour: "2-digit", minute: "2-digit" })}
                {event.ends_at ? ` – ${formatDate(event.ends_at, { hour: "2-digit", minute: "2-digit" })}` : ""}
              </span>
              {location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-300" />
                  {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="container-page mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Quick facts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FactCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Date"
              value={formatDate(event.starts_at, { weekday: "short", day: "numeric", month: "short" })}
              sub={formatDate(event.starts_at, { year: "numeric" })}
            />
            <FactCard
              icon={<Clock className="h-5 w-5" />}
              label="Doors"
              value={formatDate(event.starts_at, { hour: "2-digit", minute: "2-digit" })}
              sub={event.timezone || "Local time"}
            />
            <FactCard
              icon={<Ticket className="h-5 w-5" />}
              label="From"
              value={from === null || from === 0 ? "Free" : `${currency} ${from}`}
              sub={(event.ticket_types?.length || 0) > 1 ? "Multiple tiers" : "Per ticket"}
            />
          </div>

          {/* About */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold text-slate-900">About this event</h2>
            {event.description ? (
              <div className="prose-event mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">
                {event.description}
              </div>
            ) : (
              <p className="mt-4 text-slate-500">
                The organizer hasn&apos;t added a description yet. Grab your tickets and don&apos;t
                miss out!
              </p>
            )}
          </section>

          {/* Gallery */}
          {gallery.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-slate-900">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${event.title} photo ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Location */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold text-slate-900">Location</h2>
            <div className="card mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{event.venue_name || "Venue TBA"}</p>
                  <p className="text-sm text-slate-500">
                    {[event.address, event.city, event.country].filter(Boolean).join(", ") ||
                      "Address to be announced"}
                  </p>
                </div>
              </div>
              <ButtonLink
                href={mapsHref(event)}
                variant="secondary"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <MapPin className="h-4 w-4" />
                Open in Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          </section>

          {/* Organizer */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold text-slate-900">Organizer</h2>
            <div className="card mt-4 p-5">
              <div className="flex items-center gap-4">
                {event.seller?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.seller.logo_url}
                    alt={organizerName}
                    className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-100"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-lg font-bold text-white">
                    {initials(organizerName)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-lg font-bold text-slate-900">
                    <Building2 className="h-4 w-4 text-brand-500" />
                    {organizerName}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Eventiko organizer
                  </p>
                </div>
              </div>
              {event.seller?.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {event.seller.description}
                </p>
              )}
            </div>
          </section>

          {/* Share */}
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
            <Share2 className="h-4 w-4" />
            <span>Share:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                event.title
              )}&url=${encodeURIComponent(`${SITE.url}/events/${event.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-600 hover:underline"
            >
              X / Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                `${SITE.url}/events/${event.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-600 hover:underline"
            >
              Facebook
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${event.title} — ${SITE.url}/events/${event.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-600 hover:underline"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Sticky purchase panel */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <TicketSelector event={event} />
            <p className="mt-4 px-1 text-center text-xs text-slate-400">
              By purchasing you agree to our{" "}
              <Link href="/terms" className="font-semibold text-slate-500 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-slate-500 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function FactCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate font-bold text-slate-900">{value}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
