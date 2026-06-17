"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Rocket, Sparkles, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDateTime, cn } from "@/lib/utils";
import type { EventPromotion, EventRecord, PromotionPlan, PromotionStatus } from "@/lib/types";

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

type PromoteEvent = Pick<
  EventRecord,
  "id" | "title" | "status" | "slug" | "pinned" | "pinned_until"
>;

export function Promote({
  events,
  plans,
  promotions,
}: {
  events: PromoteEvent[];
  plans: PromotionPlan[];
  promotions: EventPromotion[];
}) {
  const publishedEvents = useMemo(
    () => events.filter((e) => e.status === "published"),
    [events]
  );
  const otherEvents = useMemo(
    () => events.filter((e) => e.status !== "published"),
    [events]
  );

  const [eventId, setEventId] = useState<string>(publishedEvents[0]?.id ?? "");
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (!eventId) {
      setError("Select a published event to promote.");
      return;
    }
    if (!planId) {
      setError("Select a promotion plan.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token ?? "";
      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setSubmitting(false);
        return;
      }
      const res = await api.createPromotionCheckout({ eventId, planId }, token);
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const canBuy = publishedEvents.length > 0 && plans.length > 0;

  return (
    <div className="space-y-8">
      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Buy a promotion</h2>

        {plans.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Promotions are not available right now. Please check back later.
          </div>
        ) : publishedEvents.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <Rocket className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-slate-600">
              You need a published event to promote.
            </p>
            <p className="max-w-sm text-xs text-slate-400">
              Publish one of your events first, then come back to spotlight it on the homepage.
            </p>
            <ButtonLink href="/dashboard/events" variant="secondary" size="sm">
              Go to my events
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Event selector */}
            <div>
              <label htmlFor="promote-event" className="label">
                Event to promote
              </label>
              <select
                id="promote-event"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="input"
              >
                {publishedEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
              {otherEvents.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Not eligible yet
                  </p>
                  {otherEvents.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-400"
                    >
                      <span className="truncate">{e.title}</span>
                      <Badge tone="slate">Publish to promote</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan selection */}
            <div>
              <p className="label">Choose a plan</p>
              <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const selected = plan.id === planId;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanId(plan.id)}
                      aria-pressed={selected}
                      className={cn(
                        "relative flex flex-col rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500"
                          : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-brand-gradient text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="font-display text-base font-bold text-slate-900">
                        {plan.name}
                      </span>
                      <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                        {plan.placement} · {plan.duration_days} day
                        {plan.duration_days === 1 ? "" : "s"}
                      </span>
                      {plan.description && (
                        <span className="mt-2 text-sm text-slate-500">{plan.description}</span>
                      )}
                      <span className="mt-3 font-display text-2xl font-extrabold text-slate-900">
                        {formatMoney(Number(plan.price ?? 0), plan.currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={pay} loading={submitting} disabled={!canBuy}>
                <Sparkles className="h-4 w-4" /> Pay &amp; request promotion
              </Button>
              <p className="text-xs text-slate-400">
                You&apos;ll be redirected to Stripe. An admin confirms payment before pinning.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Your promotions</h2>
        </div>
        {promotions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            You haven&apos;t requested any promotions yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {promotions.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">
                      {p.event?.title ?? "Event"}
                    </p>
                    <PromotionStatusBadge status={p.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.plan_name ?? "Plan"} · {formatMoney(Number(p.amount ?? 0), p.currency)}
                  </p>
                  {p.status === "active" && p.starts_at && p.ends_at && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700">
                      <Star className="h-3.5 w-3.5" />
                      Spotlighted {formatDateTime(p.starts_at)} → {formatDateTime(p.ends_at)}
                    </p>
                  )}
                  {p.status === "rejected" && p.notes && (
                    <p className="mt-0.5 text-xs text-red-600">Note: {p.notes}</p>
                  )}
                </div>
                <CalendarDays className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
