import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          <XCircle className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-slate-900">
          Checkout cancelled
        </h1>
        <p className="mt-3 max-w-md text-slate-500">
          No payment was taken. Your tickets are still available — you can pick up right where you left off.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/events" variant="primary">Back to events</ButtonLink>
          <Link href="/" className="font-semibold text-slate-600 hover:text-slate-900">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
