import { createClient } from "@/lib/supabase/server";
import { PromotionsManager } from "@/components/admin/promotions-manager";
import type { EventPromotion, PromotionPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const supabase = await createClient();

  const [{ data: plansData }, { data: requestsData }] = await Promise.all([
    supabase.from("promotion_plans").select("*").order("sort_order"),
    supabase
      .from("event_promotions")
      .select(
        "*, event:events(title, slug), seller:sellers(business_name, contact_email), plan:promotion_plans(name)"
      )
      .order("created_at", { ascending: false }),
  ]);

  const plans = (plansData ?? []) as PromotionPlan[];
  const requests = (requestsData ?? []) as EventPromotion[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Promotions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review paid promotion requests, pin events to the homepage spotlight, and manage pricing
          plans.
        </p>
      </div>
      <PromotionsManager initialPlans={plans} initialRequests={requests} />
    </div>
  );
}
