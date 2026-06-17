import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Become a seller",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/onboarding");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (seller) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "full_name" | "role"> | null;

  return (
    <OnboardingForm
      userId={user.id}
      defaultEmail={user.email ?? ""}
      defaultName={typedProfile?.full_name}
      currentRole={typedProfile?.role}
    />
  );
}
