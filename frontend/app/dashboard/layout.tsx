import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { Profile, Seller } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard");

  const [{ data: profile }, { data: seller }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const typedSeller = seller as Seller | null;
  const typedProfile = profile as Profile | null;

  // No seller row yet → onboarding takes over the full screen (no chrome).
  // The /dashboard/onboarding page renders the application form; every other
  // dashboard page also guards with its own redirect to onboarding.
  if (!typedSeller) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <Sidebar
        sellerName={typedSeller.business_name}
        status={typedSeller.status}
        isAdmin={typedProfile?.role === "admin"}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
