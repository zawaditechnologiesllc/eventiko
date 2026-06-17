import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/dashboard/event-form";
import type { Seller } from "@/lib/types";

export const metadata: Metadata = {
  title: "Create event",
};

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/events/new");

  const { data: sellerData } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as Pick<Seller, "id"> | null;
  if (!seller) redirect("/dashboard/onboarding");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Create a new event
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Start with the basics — you&apos;ll design tickets and publish on the next screen.
        </p>
      </div>

      <div className="card p-6">
        <EventForm sellerId={seller.id} />
      </div>
    </div>
  );
}
