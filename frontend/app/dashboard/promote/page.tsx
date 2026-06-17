import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, XCircle, Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Promote } from "@/components/dashboard/promote";
import type { EventPromotion, EventRecord, PromotionPlan, Seller } from "@/lib/types";

export const metadata: Metadata = { title: "Promote your events" };

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/promote");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Seller | null;
  if (!seller) redirect("/dashboard/onboarding");

  const [{ data: eventsData }, { data: plansData }, { data: promotionsData }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, status, slug, pinned, pinned_until")
      .eq("seller_id", seller.id)
      .order("starts_at", { ascending: true }),
    supabase
      .from("promotion_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("event_promotions")
      .select("*, event:events(title)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false }),
  ]);

  const events = (eventsData ?? []) as Pick<
    EventRecord,
    "id" | "title" | "status" | "slug" | "pinned" | "pinned_until"
  >[];
  const plans = (plansData ?? []) as PromotionPlan[];
  const promotions = (promotionsData ?? []) as EventPromotion[];

  const { status } = await searchParams;
  const notice = status === "success" ? "success" : status === "cancel" ? "cancel" : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Promote your events
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a published event and a plan, then pay to request a homepage spotlight. An admin
          confirms your payment before your event is pinned.
        </p>
      </header>

      {notice === "success" && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment received — request submitted.</p>
            <p className="mt-0.5 text-emerald-700">
              Your promotion is awaiting admin confirmation. We&apos;ll pin your event to the
              spotlight once it&apos;s approved.
            </p>
          </div>
        </div>
      )}

      {notice === "cancel" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Checkout cancelled.</p>
            <p className="mt-0.5 text-amber-700">
              No payment was taken. You can start a new promotion request any time.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
        <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p>
          How it works: choose a published event and a promotion plan, pay securely via Stripe, then
          an admin confirms the payment and pins your event to the homepage spotlight for the plan&apos;s
          duration.
        </p>
      </div>

      <Promote events={events} plans={plans} promotions={promotions} />
    </div>
  );
}
