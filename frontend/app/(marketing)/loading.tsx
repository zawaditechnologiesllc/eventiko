import { EventCardSkeleton } from "@/components/events/event-card";

export default function Loading() {
  return (
    <div className="container-page py-12">
      <div className="space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
