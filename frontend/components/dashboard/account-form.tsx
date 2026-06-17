"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/constants";
import type { Profile, Seller } from "@/lib/types";

export function AccountForm({ profile, seller }: { profile: Profile; seller: Seller }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState(profile.country ?? seller.country ?? "France");

  const [biz, setBiz] = useState({
    business_name: seller.business_name ?? "",
    legal_name: seller.legal_name ?? "",
    contact_email: seller.contact_email ?? "",
    contact_phone: seller.contact_phone ?? "",
    city: seller.city ?? "",
    address: seller.address ?? "",
    website: seller.website ?? "",
    description: seller.description ?? "",
    logo_url: seller.logo_url ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setBizField<K extends keyof typeof biz>(k: K, v: (typeof biz)[K]) {
    setBiz((b) => ({ ...b, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ error: pErr }, { error: sErr }] = await Promise.all([
        supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() || null, country }).eq("id", profile.id),
        supabase.from("sellers").update({ ...biz, country }).eq("id", seller.id),
      ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Changes saved.
        </div>
      )}

      {/* Personal */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Your profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50" value={profile.email} disabled />
          </div>
          <div>
            <label className="label">Country</label>
            <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Business */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Business details</h2>
        <p className="text-sm text-slate-500">Shown to buyers as the event organizer.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Business name *</label>
            <input className="input" value={biz.business_name} onChange={(e) => setBizField("business_name", e.target.value)} required />
          </div>
          <div>
            <label className="label">Legal name</label>
            <input className="input" value={biz.legal_name} onChange={(e) => setBizField("legal_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Contact email *</label>
            <input type="email" className="input" value={biz.contact_email} onChange={(e) => setBizField("contact_email", e.target.value)} required />
          </div>
          <div>
            <label className="label">Contact phone</label>
            <input className="input" value={biz.contact_phone} onChange={(e) => setBizField("contact_phone", e.target.value)} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={biz.city} onChange={(e) => setBizField("city", e.target.value)} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" value={biz.website} onChange={(e) => setBizField("website", e.target.value)} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={biz.address} onChange={(e) => setBizField("address", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">About your brand</label>
            <textarea className="input min-h-[90px]" value={biz.description} onChange={(e) => setBizField("description", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <ImageUpload
              bucket="seller-logos"
              value={biz.logo_url}
              onChange={(url) => setBizField("logo_url", url ?? "")}
              label="Logo"
              aspect="square"
              hint="Square image works best."
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </form>
  );
}
