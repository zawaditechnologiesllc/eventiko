import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/dashboard/account-form";
import type { Profile, Seller } from "@/lib/types";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/account");

  const [{ data: profileData }, { data: sellerData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const seller = sellerData as Seller | null;
  if (!seller) redirect("/dashboard/onboarding");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile and business details.</p>
      </header>
      <AccountForm profile={profileData as Profile} seller={seller} />
    </div>
  );
}
