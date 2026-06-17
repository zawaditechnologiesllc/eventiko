import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Scanner } from "@/components/dashboard/scanner";
import type { Seller } from "@/lib/types";

export const metadata: Metadata = { title: "Scanner" };

export default async function ScannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/scanner");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Pick<Seller, "id"> | null;
  if (!seller) redirect("/dashboard/onboarding");

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("seller_id", seller.id)
    .in("status", ["published", "completed"])
    .order("starts_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white">
          <ScanLine className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Door scanner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Validate attendee QR codes in real time. Each ticket can only be admitted once.
          </p>
        </div>
      </header>

      <Scanner events={events ?? []} />
    </div>
  );
}
