import { createClient } from "@/lib/supabase/server";
import { EventsManager } from "@/components/admin/events-manager";
import type { EventRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export type EventWithSeller = EventRecord & {
  seller: { business_name: string } | null;
};

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, seller:sellers(business_name)")
    .order("created_at", { ascending: false });

  const events = (data ?? []) as unknown as EventWithSeller[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Events
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Moderate listings — feature, publish or remove events.
        </p>
      </div>
      <EventsManager initialEvents={events} />
    </div>
  );
}
