import { createClient } from "@/lib/supabase/server";
import { BroadcastsManager } from "@/components/admin/broadcasts-manager";
import type { Broadcast } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBroadcastsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("broadcasts")
    .select("*")
    .order("priority", { ascending: false })
    .order("id", { ascending: false });

  const broadcasts = (data ?? []) as Broadcast[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Promotions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the announcement bar shown at the top of the public site.
        </p>
      </div>
      <BroadcastsManager initialBroadcasts={broadcasts} />
    </div>
  );
}
