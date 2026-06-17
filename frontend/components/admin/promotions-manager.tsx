"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  PinOff,
  Tag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, formatDateTime, cn } from "@/lib/utils";
import type { EventPromotion, PromotionPlan, PromotionStatus } from "@/lib/types";

type Tone = "brand" | "accent" | "green" | "amber" | "red" | "slate" | "blue";

const STATUS_LABEL: Record<PromotionStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid · review",
  active: "Active",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_TONE: Record<PromotionStatus, Tone> = {
  pending_payment: "amber",
  paid: "blue",
  active: "green",
  rejected: "red",
  expired: "slate",
};

function PromotionStatusBadge({ status }: { status: PromotionStatus }) {
  return <Badge tone={STATUS_TONE[status] ?? "slate"}>{STATUS_LABEL[status] ?? status}</Badge>;
}

// Order used to surface requests needing attention first (paid → review).
const STATUS_RANK: Record<PromotionStatus, number> = {
  paid: 0,
  pending_payment: 1,
  active: 2,
  rejected: 3,
  expired: 4,
};

const STATUS_FILTERS: { value: "all" | PromotionStatus; label: string }[] = [
  { value: "paid", label: "Paid · review" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

const PLACEMENTS = [
  { value: "homepage", label: "Homepage" },
  { value: "featured", label: "Featured" },
  { value: "top", label: "Top" },
];

const CURRENCIES = ["EUR", "GBP", "USD"];

export function PromotionsManager({
  initialPlans,
  initialRequests,
}: {
  initialPlans: PromotionPlan[];
  initialRequests: EventPromotion[];
}) {
  const [tab, setTab] = useState<"requests" | "plans">("requests");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
          <Rocket className="h-4 w-4" /> Requests
          <span className="ml-1 opacity-60">{initialRequests.length}</span>
        </TabButton>
        <TabButton active={tab === "plans"} onClick={() => setTab("plans")}>
          <Tag className="h-4 w-4" /> Pricing plans
          <span className="ml-1 opacity-60">{initialPlans.length}</span>
        </TabButton>
      </div>

      {tab === "requests" ? (
        <RequestsSection initialRequests={initialRequests} />
      ) : (
        <PlansSection initialPlans={initialPlans} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-ink text-white"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Requests review                                                     */
/* ------------------------------------------------------------------ */

function RequestsSection({ initialRequests }: { initialRequests: EventPromotion[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | PromotionStatus>("paid");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: initialRequests.length };
    for (const r of initialRequests) map[r.status] = (map[r.status] ?? 0) + 1;
    return map;
  }, [initialRequests]);

  const sorted = useMemo(() => {
    const list =
      filter === "all" ? initialRequests : initialRequests.filter((r) => r.status === filter);
    return [...list].sort((a, b) => {
      const rank = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (rank !== 0) return rank;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [initialRequests, filter]);

  async function confirmAndActivate(req: EventPromotion) {
    if (req.status !== "paid") return;
    if (!window.confirm("Confirm payment received and pin this event?")) return;
    setBusyId(req.id);
    setError(null);
    const supabase = createClient();
    const now = new Date();
    const days = req.duration_days ?? 0;
    const ends = new Date(now.getTime() + days * 86400000).toISOString();

    const { error: promoErr } = await supabase
      .from("event_promotions")
      .update({
        status: "active",
        reviewed_at: now.toISOString(),
        starts_at: now.toISOString(),
        ends_at: ends,
      })
      .eq("id", req.id);

    if (promoErr) {
      setBusyId(null);
      setError(promoErr.message);
      return;
    }

    const { error: eventErr } = await supabase
      .from("events")
      .update({ pinned: true, pinned_until: ends, featured: true })
      .eq("id", req.event_id);

    setBusyId(null);
    if (eventErr) {
      setError(eventErr.message);
      return;
    }
    router.refresh();
  }

  async function reject(req: EventPromotion) {
    if (req.status !== "pending_payment" && req.status !== "paid") return;
    const note = window.prompt("Reason for rejecting (optional):", "");
    if (note === null) return; // cancelled
    setBusyId(req.id);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("event_promotions")
      .update({ status: "rejected", notes: note.trim() || null })
      .eq("id", req.id);
    setBusyId(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function unpin(req: EventPromotion) {
    if (!window.confirm("Unpin this event and end the promotion now?")) return;
    setBusyId(req.id);
    setError(null);
    const supabase = createClient();
    const { error: eventErr } = await supabase
      .from("events")
      .update({ pinned: false })
      .eq("id", req.event_id);
    if (eventErr) {
      setBusyId(null);
      setError(eventErr.message);
      return;
    }
    const { error: promoErr } = await supabase
      .from("event_promotions")
      .update({ status: "expired" })
      .eq("id", req.id);
    setBusyId(null);
    if (promoErr) {
      setError(promoErr.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filter === f.value
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">{counts[f.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Rocket className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-slate-600">No promotion requests in this view.</p>
          <p className="max-w-sm text-xs text-slate-400">
            When a seller pays for a promotion it appears here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((req) => (
            <div key={req.id} className="card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">
                      {req.event?.title ?? "Untitled event"}
                    </p>
                    <PromotionStatusBadge status={req.status} />
                    {req.placement && (
                      <Badge tone="brand" className="capitalize">
                        {req.placement}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">
                      {req.seller?.business_name ?? "Unknown seller"}
                    </span>
                    {req.seller?.contact_email && (
                      <span className="text-slate-400"> · {req.seller.contact_email}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Plan:{" "}
                      <span className="font-medium text-slate-700">
                        {req.plan_name ?? req.plan?.name ?? "—"}
                      </span>
                    </span>
                    <span>
                      Amount:{" "}
                      <span className="font-medium text-slate-700">
                        {formatMoney(Number(req.amount ?? 0), req.currency)}
                      </span>
                    </span>
                    {typeof req.duration_days === "number" && (
                      <span>
                        Duration:{" "}
                        <span className="font-medium text-slate-700">
                          {req.duration_days} day{req.duration_days === 1 ? "" : "s"}
                        </span>
                      </span>
                    )}
                    <span>Requested: {formatDate(req.created_at)}</span>
                  </div>
                  {req.status === "active" && req.starts_at && req.ends_at && (
                    <p className="text-xs text-emerald-700">
                      Pinned {formatDateTime(req.starts_at)} → {formatDateTime(req.ends_at)}
                    </p>
                  )}
                  {req.status === "rejected" && req.notes && (
                    <p className="text-xs text-red-600">Note: {req.notes}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {req.status === "paid" && (
                    <Button
                      size="sm"
                      onClick={() => confirmAndActivate(req)}
                      loading={busyId === req.id}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirm & activate
                    </Button>
                  )}
                  {(req.status === "pending_payment" || req.status === "paid") && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => reject(req)}
                      disabled={busyId === req.id}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  )}
                  {req.status === "active" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => unpin(req)}
                      disabled={busyId === req.id}
                    >
                      <PinOff className="h-4 w-4" /> Unpin
                    </Button>
                  )}
                  {req.status !== "paid" &&
                    req.status !== "pending_payment" &&
                    req.status !== "active" && (
                      <span className="text-xs text-slate-400">No actions</span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing plans CRUD                                                  */
/* ------------------------------------------------------------------ */

interface PlanFormState {
  name: string;
  description: string;
  placement: string;
  duration_days: number;
  price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

function emptyPlanForm(): PlanFormState {
  return {
    name: "",
    description: "",
    placement: "homepage",
    duration_days: 7,
    price: 0,
    currency: "EUR",
    is_active: true,
    sort_order: 0,
  };
}

function planFormFrom(p: PromotionPlan): PlanFormState {
  return {
    name: p.name ?? "",
    description: p.description ?? "",
    placement: p.placement ?? "homepage",
    duration_days: p.duration_days ?? 7,
    price: p.price ?? 0,
    currency: p.currency ?? "EUR",
    is_active: p.is_active,
    sort_order: p.sort_order ?? 0,
  };
}

function PlansSection({ initialPlans }: { initialPlans: PromotionPlan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [editing, setEditing] = useState<PromotionPlan | "new" | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(p: PromotionPlan) {
    setTogglingId(p.id);
    setError(null);
    const next = !p.is_active;
    const prev = plans;
    setPlans((list) => list.map((x) => (x.id === p.id ? { ...x, is_active: next } : x)));
    const supabase = createClient();
    const { error: err } = await supabase
      .from("promotion_plans")
      .update({ is_active: next })
      .eq("id", p.id);
    setTogglingId(null);
    if (err) {
      setPlans(prev);
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function remove(p: PromotionPlan) {
    if (!window.confirm(`Delete plan "${p.name}"?`)) return;
    setDeletingId(p.id);
    setError(null);
    const prev = plans;
    setPlans((list) => list.filter((x) => x.id !== p.id));
    const supabase = createClient();
    const { error: err } = await supabase.from("promotion_plans").delete().eq("id", p.id);
    setDeletingId(null);
    if (err) {
      setPlans(prev);
      setError(err.message);
      return;
    }
    router.refresh();
  }

  function handleSaved(saved: PromotionPlan) {
    setPlans((list) => {
      const exists = list.some((p) => p.id === saved.id);
      const next = exists
        ? list.map((p) => (p.id === saved.id ? saved : p))
        : [...list, saved];
      return next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    });
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {plans.length} plan{plans.length === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setEditing("new")} size="sm">
          <Plus className="h-4 w-4" /> New plan
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {plans.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Tag className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-slate-600">No pricing plans yet.</p>
          <p className="max-w-sm text-xs text-slate-400">
            Add a plan so sellers can pay to spotlight their events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{p.name}</p>
                    <Badge tone={p.is_active ? "green" : "slate"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge tone="brand" className="capitalize">
                      {p.placement}
                    </Badge>
                  </div>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{p.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatMoney(Number(p.price ?? 0), p.currency)} · {p.duration_days} day
                    {p.duration_days === 1 ? "" : "s"} · sort {p.sort_order}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <span className="text-slate-500">Active</span>
                    <span className="relative inline-flex">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={p.is_active}
                        disabled={togglingId === p.id}
                        onChange={() => toggleActive(p)}
                      />
                      <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-600 peer-disabled:opacity-50" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    aria-label="Edit"
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={deletingId === p.id}
                    aria-label="Delete"
                    className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PlanForm
          plan={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function PlanForm({
  plan,
  onClose,
  onSaved,
}: {
  plan: PromotionPlan | null;
  onClose: () => void;
  onSaved: (p: PromotionPlan) => void;
}) {
  const [form, setForm] = useState<PlanFormState>(
    plan ? planFormFrom(plan) : emptyPlanForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!Number.isFinite(form.duration_days) || form.duration_days <= 0) {
      setError("Duration must be at least 1 day.");
      return;
    }
    if (!Number.isFinite(form.price) || form.price < 0) {
      setError("Price must be a positive number.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      placement: form.placement,
      duration_days: form.duration_days,
      price: form.price,
      currency: form.currency,
      is_active: form.is_active,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
    };

    const supabase = createClient();
    const query = plan
      ? supabase.from("promotion_plans").update(payload).eq("id", plan.id).select().single()
      : supabase.from("promotion_plans").insert(payload).select().single();

    const { data, error: err } = await query;
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved(data as PromotionPlan);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
      />
      <div className="card relative w-full max-w-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {plan ? "Edit plan" : "New plan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label htmlFor="p-name" className="label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="Homepage spotlight — 7 days"
            />
          </div>

          <div>
            <label htmlFor="p-description" className="label">
              Description
            </label>
            <textarea
              id="p-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Pin your event to the homepage spotlight for a week."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-placement" className="label">
                Placement
              </label>
              <select
                id="p-placement"
                value={form.placement}
                onChange={(e) => set("placement", e.target.value)}
                className="input"
              >
                {PLACEMENTS.map((pl) => (
                  <option key={pl.value} value={pl.value}>
                    {pl.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="p-duration" className="label">
                Duration (days) <span className="text-red-500">*</span>
              </label>
              <input
                id="p-duration"
                type="number"
                min={1}
                value={form.duration_days}
                onChange={(e) => set("duration_days", parseInt(e.target.value, 10) || 0)}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="p-price" className="label">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                id="p-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="p-currency" className="label">
                Currency
              </label>
              <select
                id="p-currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="input"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="p-sort" className="label">
                Sort order
              </label>
              <input
                id="p-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", parseInt(e.target.value, 10) || 0)}
                className="input"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-600" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
            <span className="text-sm font-medium text-slate-700">
              Active (available for sellers to buy)
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {plan ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
