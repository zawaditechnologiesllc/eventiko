import type { Metadata } from "next";
import { CalendarSearch, SearchX } from "lucide-react";
import { getPublishedEvents } from "@/lib/data";
import { EventCard } from "@/components/events/event-card";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/events/filter-bar";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string; country?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { q, category, country } = await searchParams;
  const parts = [category, country].filter(Boolean);
  const focus = q
    ? `"${q}"`
    : parts.length
      ? parts.join(" · ")
      : "concerts, festivals & live events";

  const title = q || parts.length ? `Tickets for ${focus}` : "Discover events & buy tickets";
  const description = `Browse ${
    parts.length ? `${parts.join(" ")} ` : ""
  }events on ${SITE.name}. Secure Stripe checkout, instant QR tickets, and the best live experiences across Europe and beyond.`;

  return {
    title,
    description,
    alternates: { canonical: "/events" },
    openGraph: { title: `${title} · ${SITE.name}`, description, url: `${SITE.url}/events` },
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, category, country } = await searchParams;
  const events = await getPublishedEvents({ q, category, country });

  const activeFilters = [q && `"${q}"`, category, country].filter(Boolean);

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="max-w-3xl animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
          <CalendarSearch className="h-3.5 w-3.5" />
          Marketplace
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Find your next experience
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          {activeFilters.length
            ? `Showing results for ${activeFilters.join(" · ")}.`
            : "Concerts, festivals, club nights, theatre and more — all in one place, with secure checkout and instant QR tickets."}
        </p>
      </header>

      <div className="mt-8">
        <FilterBar />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500" aria-live="polite">
          {events.length} {events.length === 1 ? "event" : "events"} found
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState hasFilters={activeFilters.length > 0} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <div key={event.id} className="animate-fade-up">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <SearchX className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-display text-xl font-bold text-slate-900">
        {hasFilters ? "No events match your filters" : "No events just yet"}
      </h2>
      <p className="mt-2 max-w-md text-slate-500">
        {hasFilters
          ? "Try widening your search — clear a filter or explore a different category or country."
          : "New events are added all the time. Check back soon, or be the first to list one."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {hasFilters ? (
          <ButtonLink href="/events" variant="primary">
            Clear filters
          </ButtonLink>
        ) : (
          <ButtonLink href="/sell" variant="primary">
            Sell your tickets
          </ButtonLink>
        )}
        <ButtonLink href="/news" variant="secondary">
          Read events news
        </ButtonLink>
      </div>
    </div>
  );
}
