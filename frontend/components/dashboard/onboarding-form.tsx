"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Wallet,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/dashboard/image-upload";
import {
  PayoutAccountFields,
  emptyPayoutAccount,
  type PayoutAccountDraft,
} from "@/components/dashboard/payout-account-fields";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface OnboardingFormProps {
  userId: string;
  defaultEmail: string;
  defaultName?: string | null;
  currentRole?: string;
}

const STEPS = [
  { id: 1, label: "Business", icon: Building2 },
  { id: 2, label: "Payouts", icon: Wallet },
  { id: 3, label: "Review", icon: CheckCircle2 },
];

export function OnboardingForm({
  userId,
  defaultEmail,
  defaultName,
  currentRole,
}: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business details
  const [businessName, setBusinessName] = useState(defaultName ?? "");
  const [legalName, setLegalName] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [contactPhone, setContactPhone] = useState("");
  const [country, setCountry] = useState<string>("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Payout accounts (up to 3)
  const [accounts, setAccounts] = useState<PayoutAccountDraft[]>([
    { ...emptyPayoutAccount(), is_primary: true },
  ]);

  function updateAccount(i: number, next: PayoutAccountDraft) {
    setAccounts((prev) => prev.map((a, idx) => (idx === i ? next : a)));
  }
  function addAccount() {
    if (accounts.length >= 3) return;
    setAccounts((prev) => [...prev, emptyPayoutAccount()]);
  }
  function removeAccount(i: number) {
    setAccounts((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length && !next.some((a) => a.is_primary)) next[0].is_primary = true;
      return next;
    });
  }
  function makePrimary(i: number) {
    setAccounts((prev) => prev.map((a, idx) => ({ ...a, is_primary: idx === i })));
  }

  function validateStep1(): string | null {
    if (!businessName.trim()) return "Business name is required.";
    if (!contactEmail.trim()) return "Contact email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return "Enter a valid contact email.";
    if (!contactPhone.trim()) return "A contact phone number is required.";
    if (!country) return "Please select your country.";
    if (!city.trim()) return "Please enter your city.";
    if (description.trim().length < 20)
      return "Tell us a bit about your business (at least 20 characters).";
    return null;
  }

  function validateStep2(): string | null {
    for (const [i, a] of accounts.entries()) {
      const n = `Payout account ${i + 1}: `;
      if (!a.account_name.trim()) return n + "account holder name is required.";
      if ((a.method === "bank" || a.method === "wise") && !a.iban.trim())
        return n + "an IBAN or account number is required.";
      if (a.method === "paypal" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.paypal_email))
        return n + "a valid PayPal email is required.";
      if (
        (a.method === "mpesa" || a.method === "crypto" || a.method === "other") &&
        !a.other_details.trim()
      )
        return n + "payout details are required.";
    }
    return null;
  }

  function next() {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) return setError(err);
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    const s1 = validateStep1();
    if (s1) {
      setStep(1);
      return setError(s1);
    }
    const s2 = validateStep2();
    if (s2) {
      setStep(2);
      return setError(s2);
    }

    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();

      const { data: sellerRow, error: sellerErr } = await supabase
        .from("sellers")
        .insert({
          user_id: userId,
          business_name: businessName.trim(),
          legal_name: legalName.trim() || null,
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          country,
          city: city.trim() || null,
          address: address.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
          status: "pending",
        })
        .select("id")
        .single();

      if (sellerErr) throw sellerErr;
      const sellerId = sellerRow.id as string;

      const rows = accounts.map((a) => ({
        seller_id: sellerId,
        method: a.method,
        label: a.label.trim() || null,
        account_name: a.account_name.trim(),
        account_number: a.account_number.trim() || null,
        bank_name: a.bank_name.trim() || null,
        iban: a.iban.trim() || null,
        swift: a.swift.trim() || null,
        routing_number: a.routing_number.trim() || null,
        paypal_email: a.paypal_email.trim() || null,
        other_details: a.other_details.trim() || null,
        currency: a.currency,
        is_primary: a.is_primary,
      }));

      const { error: paErr } = await supabase.from("payout_accounts").insert(rows);
      if (paErr) throw paErr;

      if (currentRole === "buyer") {
        await supabase.from("profiles").update({ role: "seller" }).eq("id", userId);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-brand-radial opacity-80" />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <Logo dark href="/" />
          <div className="mt-6 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
                Become an Eventiko seller
              </h1>
              <p className="mt-1 max-w-xl text-sm text-white/70">
                Set up your seller profile in under two minutes. Applications are reviewed by our
                team, but you can start creating events as drafts right away.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Stepper */}
        <ol className="mb-8 flex items-center">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            const Icon = s.icon;
            return (
              <li key={s.id} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition",
                      done && "bg-emerald-500 text-white",
                      active && "bg-brand-gradient text-white shadow-glow",
                      !active && !done && "bg-slate-200 text-slate-500"
                    )}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4.5 w-4.5" />}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-semibold sm:inline",
                      active ? "text-slate-900" : "text-slate-500"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-3 h-0.5 flex-1 rounded-full transition",
                      step > s.id ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1 — Business */}
        {step === 1 && (
          <div className="card space-y-5 p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Business details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Business name *</label>
                <input
                  className="input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your brand or organization"
                />
              </div>
              <div>
                <label className="label">Legal name</label>
                <input
                  className="input"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Registered company name"
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  className="input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="label">Contact email *</label>
                <input
                  type="email"
                  className="input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Contact phone *</label>
                <input
                  className="input"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+33 …"
                />
              </div>
              <div>
                <label className="label">Country *</label>
                <select
                  className="input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="" disabled>
                    Select your country…
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City *</label>
                <input
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, postal code"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">About your business *</label>
                <textarea
                  className="input min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell attendees who you are and what kind of events you run."
                />
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  bucket="seller-logos"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  label="Logo"
                  aspect="square"
                  hint="Square image works best. Shown on your events and tickets."
                  className="max-w-[220px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Payouts */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    How you&apos;ll get paid
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add up to 3 payout methods. We&apos;ll send your earnings to your primary
                    account once a payout is approved.
                  </p>
                </div>
              </div>
            </div>

            {accounts.map((a, i) => (
              <div key={i} className="card space-y-4 p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">Payout account {i + 1}</h3>
                    {a.is_primary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        <Star className="h-3 w-3 fill-current" /> Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!a.is_primary && (
                      <button
                        type="button"
                        onClick={() => makePrimary(i)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                      >
                        Make primary
                      </button>
                    )}
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAccount(i)}
                        aria-label="Remove account"
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <PayoutAccountFields value={a} onChange={(next) => updateAccount(i, next)} />
              </div>
            ))}

            {accounts.length < 3 && (
              <button
                type="button"
                onClick={addAccount}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" /> Add another payout method
              </button>
            )}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-slate-900">Review &amp; submit</h2>
              <p className="mt-1 text-sm text-slate-500">
                Double-check your details. You can edit everything later from your account settings.
              </p>

              <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Review label="Business name" value={businessName} />
                <Review label="Contact email" value={contactEmail} />
                <Review label="Country" value={country} />
                <Review label="City" value={city || "—"} />
                {website && <Review label="Website" value={website} />}
                {contactPhone && <Review label="Phone" value={contactPhone} />}
              </dl>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700">
                  Payout methods ({accounts.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {accounts.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
                        {a.method}
                      </span>
                      <span>{a.account_name || "—"}</span>
                      <span className="text-slate-400">· {a.currency}</span>
                      {a.is_primary && (
                        <span className="text-xs font-semibold text-brand-600">Primary</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p>
                Your application will be reviewed by our team. Approval usually takes 1–2 business
                days. In the meantime you can build your events and customize tickets in draft mode.
              </p>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={back} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <Button onClick={next}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
