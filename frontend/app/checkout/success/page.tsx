import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { OrderSuccess } from "@/components/checkout/order-success";

export const metadata: Metadata = {
  title: "Your tickets",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Link href="/events" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Browse events
          </Link>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
          </div>
        }
      >
        <OrderSuccess />
      </Suspense>
    </div>
  );
}
