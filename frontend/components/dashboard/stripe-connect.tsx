"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";

interface Status {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboarded: boolean;
}

async function token() {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? "";
}

export function StripeConnect() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await api.connectStatus(await token()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Stripe status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onboard() {
    setWorking(true);
    setError(null);
    try {
      const { url } = await api.connectOnboard(await token());
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start onboarding.");
      setWorking(false);
    }
  }

  const ready = status?.connected && status?.chargesEnabled && status?.payoutsEnabled;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white">
          <CreditCard className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Automatic payouts (Stripe)</h2>
          <p className="text-sm text-slate-500">Get paid directly to your bank — Stripe handles the rest.</p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
          </div>
        ) : ready ? (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">You&apos;re all set.</p>
              <p className="mt-0.5">Your sales are paid out to your connected account automatically, minus the platform fee. You don&apos;t need to request payouts.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">
                  {status?.connected ? "Finish your Stripe setup" : "Connect your Stripe account"}
                </p>
                <p className="mt-0.5">
                  {status?.connected
                    ? "Stripe still needs a few details before payouts can be enabled."
                    : "Securely connect a Stripe account so we can pay you automatically for every sale."}
                </p>
              </div>
            </div>
            <Button onClick={onboard} loading={working}>
              <ExternalLink className="h-4 w-4" />
              {status?.connected ? "Continue Stripe setup" : "Connect with Stripe"}
            </Button>
          </div>
        )}
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
