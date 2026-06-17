"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle2, Plus, Trash2, Percent, Image as ImageIcon, LayoutTemplate, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Settings, FooterColumn } from "@/lib/types";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState({
    platform_fee_rate: String(initial.platform_fee_rate ?? 8),
    currency: initial.currency ?? "EUR",
    payout_min: String(initial.payout_min ?? 50),
    support_email: initial.support_email ?? "",
  });
  const [hero, setHero] = useState({
    title: initial.hero?.title ?? "",
    subtitle: initial.hero?.subtitle ?? "",
    ctaText: initial.hero?.ctaText ?? "",
    ctaLink: initial.hero?.ctaLink ?? "",
    backgroundImage: initial.hero?.backgroundImage ?? "",
  });
  const [footer, setFooter] = useState({
    about: initial.footer?.about ?? "",
    contactEmail: initial.footer?.contactEmail ?? "",
    contactPhone: initial.footer?.contactPhone ?? "",
    twitter: initial.footer?.social?.twitter ?? "",
    instagram: initial.footer?.social?.instagram ?? "",
    facebook: initial.footer?.social?.facebook ?? "",
  });
  const [columns, setColumns] = useState<FooterColumn[]>(
    initial.footer?.columns?.length ? initial.footer.columns : [{ title: "Discover", links: [{ label: "All events", href: "/events" }] }]
  );
  const [branding, setBranding] = useState({
    primary: initial.branding?.primary ?? "#7C3AED",
    accent: initial.branding?.accent ?? "#EC4899",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function updateColumn(i: number, col: FooterColumn) {
    setColumns((c) => c.map((x, idx) => (idx === i ? col : x)));
  }

  async function save() {
    setMsg(null);
    const fee = Number(s.platform_fee_rate);
    if (Number.isNaN(fee) || fee < 0 || fee > 100) {
      setMsg({ type: "err", text: "Platform fee must be between 0 and 100." });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("settings")
        .update({
          platform_fee_rate: fee,
          currency: s.currency,
          payout_min: Number(s.payout_min) || 0,
          support_email: s.support_email.trim(),
          hero,
          footer: {
            about: footer.about,
            contactEmail: footer.contactEmail,
            contactPhone: footer.contactPhone,
            social: { twitter: footer.twitter, instagram: footer.instagram, facebook: footer.facebook },
            columns,
          },
          branding,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
      setMsg({ type: "ok", text: "Settings saved." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Could not save settings." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Platform */}
      <Section icon={<Percent className="h-4 w-4" />} title="Platform & fees" desc="The commission charged to sellers on every ticket sold.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Platform fee (%)">
            <input type="number" min="0" max="100" step="0.1" className="input" value={s.platform_fee_rate} onChange={(e) => setS({ ...s, platform_fee_rate: e.target.value })} />
          </Field>
          <Field label="Default currency">
            <select className="input" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
              {["EUR", "GBP", "USD"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Minimum payout">
            <input type="number" min="0" className="input" value={s.payout_min} onChange={(e) => setS({ ...s, payout_min: e.target.value })} />
          </Field>
          <Field label="Support email">
            <input type="email" className="input" value={s.support_email} onChange={(e) => setS({ ...s, support_email: e.target.value })} />
          </Field>
        </div>
      </Section>

      {/* Hero */}
      <Section icon={<ImageIcon className="h-4 w-4" />} title="Homepage hero" desc="The headline section at the top of the public homepage.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input className="input" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
          </Field>
          <Field label="Subtitle" className="sm:col-span-2">
            <textarea className="input min-h-[70px]" value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
          </Field>
          <Field label="CTA text">
            <input className="input" value={hero.ctaText} onChange={(e) => setHero({ ...hero, ctaText: e.target.value })} />
          </Field>
          <Field label="CTA link">
            <input className="input" value={hero.ctaLink} onChange={(e) => setHero({ ...hero, ctaLink: e.target.value })} />
          </Field>
          <Field label="Background image URL" className="sm:col-span-2">
            <input className="input" value={hero.backgroundImage} onChange={(e) => setHero({ ...hero, backgroundImage: e.target.value })} placeholder="https://" />
          </Field>
        </div>
      </Section>

      {/* Footer */}
      <Section icon={<LayoutTemplate className="h-4 w-4" />} title="Footer" desc="Content and links shown in the site footer.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="About text" className="sm:col-span-2">
            <textarea className="input min-h-[70px]" value={footer.about} onChange={(e) => setFooter({ ...footer, about: e.target.value })} />
          </Field>
          <Field label="Contact email"><input className="input" value={footer.contactEmail} onChange={(e) => setFooter({ ...footer, contactEmail: e.target.value })} /></Field>
          <Field label="Contact phone"><input className="input" value={footer.contactPhone} onChange={(e) => setFooter({ ...footer, contactPhone: e.target.value })} /></Field>
          <Field label="Twitter URL"><input className="input" value={footer.twitter} onChange={(e) => setFooter({ ...footer, twitter: e.target.value })} /></Field>
          <Field label="Instagram URL"><input className="input" value={footer.instagram} onChange={(e) => setFooter({ ...footer, instagram: e.target.value })} /></Field>
          <Field label="Facebook URL"><input className="input" value={footer.facebook} onChange={(e) => setFooter({ ...footer, facebook: e.target.value })} /></Field>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Footer link columns</p>
            <Button size="sm" variant="secondary" onClick={() => setColumns([...columns, { title: "New column", links: [] }])}>
              <Plus className="h-4 w-4" /> Column
            </Button>
          </div>
          {columns.map((col, ci) => (
            <div key={ci} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  className="input font-semibold"
                  value={col.title}
                  onChange={(e) => updateColumn(ci, { ...col, title: e.target.value })}
                  placeholder="Column title"
                />
                <button onClick={() => setColumns(columns.filter((_, i) => i !== ci))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2">
                    <input className="input" value={link.label} placeholder="Label" onChange={(e) => updateColumn(ci, { ...col, links: col.links.map((l, i) => (i === li ? { ...l, label: e.target.value } : l)) })} />
                    <input className="input" value={link.href} placeholder="/path" onChange={(e) => updateColumn(ci, { ...col, links: col.links.map((l, i) => (i === li ? { ...l, href: e.target.value } : l)) })} />
                    <button onClick={() => updateColumn(ci, { ...col, links: col.links.filter((_, i) => i !== li) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => updateColumn(ci, { ...col, links: [...col.links, { label: "", href: "" }] })} className="text-sm font-semibold text-brand-600 hover:underline">
                  + Add link
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Branding */}
      <Section icon={<Palette className="h-4 w-4" />} title="Branding" desc="Accent colors used across promotional surfaces.">
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <ColorField label="Primary" value={branding.primary} onChange={(v) => setBranding({ ...branding, primary: v })} />
          <ColorField label="Accent" value={branding.accent} onChange={(v) => setBranding({ ...branding, accent: v })} />
        </div>
      </Section>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:pl-64">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {msg ? (
            <span className={`flex items-center gap-2 text-sm font-medium ${msg.type === "ok" ? "text-emerald-700" : "text-red-700"}`}>
              {msg.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {msg.text}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Changes apply to the public site immediately.</span>
          )}
          <Button onClick={save} loading={loading}>
            <Save className="h-4 w-4" /> Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100 text-brand-600">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-0 bg-transparent p-0 font-mono text-sm uppercase text-slate-700 focus:outline-none focus:ring-0" />
      </div>
    </div>
  );
}
