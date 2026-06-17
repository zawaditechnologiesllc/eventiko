import { createClient } from "@/lib/supabase/server";
import { UsersManager } from "@/components/admin/users-manager";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Users
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage accounts and assign roles across the platform.
        </p>
      </div>
      <UsersManager initialUsers={users} />
    </div>
  );
}
