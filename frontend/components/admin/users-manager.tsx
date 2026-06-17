"use client";

import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableRow, DataTableCell } from "@/components/admin/data-table";
import { formatDate, initials } from "@/lib/utils";
import type { Profile, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["buyer", "seller", "admin"];

const roleTone: Record<UserRole, "brand" | "accent" | "slate"> = {
  admin: "brand",
  seller: "accent",
  buyer: "slate",
};

export function UsersManager({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.full_name ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  async function changeRole(id: string, role: UserRole) {
    setSavingId(id);
    setError(null);
    const prev = users;
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role } : u)));
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update({ role }).eq("id", id);
    setSavingId(null);
    if (err) {
      setUsers(prev);
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name…"
          className="input pl-10"
          aria-label="Search users"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <DataTable
        columns={[
          { label: "User" },
          { label: "Country", hideBelow: "md" },
          { label: "Joined", hideBelow: "sm" },
          { label: "Role", align: "right" },
        ]}
        isEmpty={filtered.length === 0}
        empty={query ? "No users match your search." : "No users yet."}
      >
        {filtered.map((user) => (
          <DataTableRow key={user.id}>
            <DataTableCell>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  {initials(user.full_name || user.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {user.full_name || "—"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            </DataTableCell>
            <DataTableCell hideBelow="md">
              {user.country || <span className="text-slate-400">—</span>}
            </DataTableCell>
            <DataTableCell hideBelow="sm">
              <span className="text-slate-500">{formatDate(user.created_at)}</span>
            </DataTableCell>
            <DataTableCell align="right">
              <div className="flex items-center justify-end gap-2">
                <Badge tone={roleTone[user.role]} className="capitalize">
                  {user.role}
                </Badge>
                <div className="relative">
                  <select
                    value={user.role}
                    disabled={savingId === user.id}
                    onChange={(e) => changeRole(user.id, e.target.value as UserRole)}
                    aria-label={`Change role for ${user.email}`}
                    className="input w-auto cursor-pointer py-1.5 pr-8 text-xs capitalize disabled:opacity-50"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role} className="capitalize">
                        {role}
                      </option>
                    ))}
                  </select>
                  {savingId === user.id && (
                    <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  );
}
