"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Sparkles,
  Tag,
  Palette,
  Eye,
  AlertCircle,
  GripVertical,
  Ticket as TicketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { TicketPreview } from "@/components/ticket/ticket-preview";
import { createClient } from "@/lib/supabase/client";
import { TICKET_LAYOUTS, DEFAULT_TICKET_DESIGN } from "@/lib/constants";
import { formatMoney, cn } from "@/lib/utils";
import type { EventRecord, TicketType, TicketDesign } from "@/lib/types";

interface TicketStudioProps {
  eventId: string;
  event: EventRecord;
  ticketTypes: TicketType[];
}

interface Draft {
  name: string;
  description: string;
  price: string;
  currency: string;
  quantity: string;
  max_per_order: string;
  sale_starts_at: string;
  sale_ends_at: string;
  is_active: boolean;
  design: TicketDesign;
}

const CURRENCIES = ["EUR", "GBP", "USD"];

function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function draftFromTicket(t: TicketType): Draft {
  return {
    name: t.name,
    description: t.description ?? "",
    price: String(t.price ?? 0),
    currency: t.currency || "EUR",
    quantity: String(t.quantity ?? 100),
    max_per_order: String(t.max_per_order ?? 10),
    sale_starts_at: toLocalInput(t.sale_starts_at),
    sale_ends_at: toLocalInput(t.sale_ends_at),
    is_active: t.is_active,
    design: { ...DEFAULT_TICKET_DESIGN, ...(t.design || {}) },
  };
}

function emptyDraft(): Draft {
  return {
    name: "",
    description: "",
    price: "0",
    currency: "EUR",
    quantity: "100",
    max_per_order: "10",
    sale_starts_at: "",
    sale_ends_at: "",
    is_active: true,
    design: { ...DEFAULT_TICKET_DESIGN },
  };
}

export function TicketStudio({ eventId, event, ticketTypes }: TicketStudioProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(ticketTypes.length === 0);
  const [draft, setDraft] = useState<Draft>(
    ticketTypes.length === 0 ? emptyDraft() : draftFromTicket(ticketTypes[0])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perkInput, setPerkInput] = useState("");

  const editorOpen = creating || editingId !== null;

  function openCreate() {
    setEditingId(null);
    setCreating(true);
    setDraft(emptyDraft());
    setError(null);
    setPerkInput("");
  }

  function openEdit(t: TicketType) {
    setCreating(false);
    setEditingId(t.id);
    setDraft(draftFromTicket(t));
    setError(null);
    setPerkInput("");
  }

  function closeEditor() {
    setCreating(false);
    setEditingId(null);
    setError(null);
  }

  function setDesign<K extends keyof TicketDesign>(key: K, value: TicketDesign[K]) {
    setDraft((d) => ({ ...d, design: { ...d.design, [key]: value } }));
  }

  function addPerk() {
    const p = perkInput.trim();
    if (!p) return;
    const existing = draft.design.perks ?? [];
    if (existing.includes(p)) {
      setPerkInput("");
      return;
    }
    setDesign("perks", [...existing, p]);
    setPerkInput("");
  }

  function removePerk(perk: string) {
    setDesign(
      "perks",
      (draft.design.perks ?? []).filter((p) => p !== perk)
    );
  }

  async function save() {
    setError(null);
    if (!draft.name.trim()) return setError("Ticket name is required.");
    const price = Number(draft.price);
    if (Number.isNaN(price) || price < 0) return setError("Enter a valid price.");
    const quantity = parseInt(draft.quantity, 10);
    if (Number.isNaN(quantity) || quantity < 1) return setError("Quantity must be at least 1.");
    const maxPer = parseInt(draft.max_per_order, 10);
    if (Number.isNaN(maxPer) || maxPer < 1) return setError("Max per order must be at least 1.");
    const startIso = fromLocalInput(draft.sale_starts_at);
    const endIso = fromLocalInput(draft.sale_ends_at);
    if (startIso && endIso && new Date(endIso) < new Date(startIso))
      return setError("Sales end date can't be before the start date.");

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price,
        currency: draft.currency,
        quantity,
        max_per_order: maxPer,
        sale_starts_at: startIso,
        sale_ends_at: endIso,
        is_active: draft.is_active,
        design: draft.design,
      };

      if (editingId) {
        const { error: upErr } = await supabase
          .from("ticket_types")
          .update(payload)
          .eq("id", editingId);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("ticket_types").insert({
          ...payload,
          event_id: eventId,
          sort_order: ticketTypes.length,
        });
        if (insErr) throw insErr;
      }
      closeEditor();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the ticket type.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this ticket type? This can't be undone.")) return;
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase.from("ticket_types").delete().eq("id", id);
      if (delErr) throw delErr;
      if (editingId === id) closeEditor();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the ticket type.");
    }
  }

  const previewPrice = Number(draft.price);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Ticket studio</h2>
          <p className="text-sm text-slate-500">
            Create ticket tiers and design how they look. Changes preview live on the right.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
        {/* Left column: list + editor */}
        <div className="space-y-4">
          {/* Existing ticket types */}
          <div className="space-y-2">
            {ticketTypes.length === 0 && !creating && (
              <div className="card flex flex-col items-center px-6 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
                  <TicketIcon className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-700">No ticket types yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first ticket tier to start selling.
                </p>
              </div>
            )}

            {ticketTypes.map((t) => {
              const active = editingId === t.id;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "card flex items-center gap-3 p-4 transition",
                    active && "ring-2 ring-brand-400"
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${
                        t.design?.primaryColor || "#7C3AED"
                      }, ${t.design?.accentColor || "#EC4899"})`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{t.name}</p>
                      {!t.is_active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatMoney(t.price, t.currency)} · {t.sold}/{t.quantity} sold
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      aria-label={`Edit ${t.name}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      aria-label={`Delete ${t.name}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {!editorOpen && (
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" /> Add ticket type
              </button>
            )}
          </div>

          {/* Editor */}
          {editorOpen && (
            <div className="card space-y-6 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {editingId ? "Edit ticket type" : "New ticket type"}
                </h3>
                <button
                  type="button"
                  onClick={closeEditor}
                  aria-label="Close editor"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Pricing & inventory */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <Tag className="h-3.5 w-3.5" /> Pricing &amp; inventory
                </h4>

                <div>
                  <label className="label">Name *</label>
                  <input
                    className="input"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. General Admission"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input min-h-[70px]"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="What's included with this ticket?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select
                      className="input"
                      value={draft.currency}
                      onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={draft.quantity}
                      onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Max per order</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={draft.max_per_order}
                      onChange={(e) => setDraft({ ...draft, max_per_order: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Sales start</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={draft.sale_starts_at}
                      onChange={(e) => setDraft({ ...draft, sale_starts_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Expiry (sales end)</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={draft.sale_ends_at}
                      onChange={(e) => setDraft({ ...draft, sale_ends_at: e.target.value })}
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <span className="text-sm font-medium text-slate-700">
                    Active
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      (visible &amp; on sale)
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={draft.is_active}
                    onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                  />
                </label>
              </section>

              {/* Design */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <Palette className="h-3.5 w-3.5" /> Ticket design
                </h4>

                <div>
                  <label className="label">Layout</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TICKET_LAYOUTS.map((l) => {
                      const selected = (draft.design.layout ?? "modern") === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setDesign("layout", l.id)}
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm font-semibold transition",
                            selected
                              ? "bg-brand-gradient text-white shadow-glow"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorField
                    label="Primary"
                    value={draft.design.primaryColor ?? "#7C3AED"}
                    onChange={(v) => setDesign("primaryColor", v)}
                  />
                  <ColorField
                    label="Accent"
                    value={draft.design.accentColor ?? "#EC4899"}
                    onChange={(v) => setDesign("accentColor", v)}
                  />
                  <ColorField
                    label="Background"
                    value={draft.design.bgColor ?? "#0B0A1A"}
                    onChange={(v) => setDesign("bgColor", v)}
                  />
                  <ColorField
                    label="Text"
                    value={draft.design.textColor ?? "#FFFFFF"}
                    onChange={(v) => setDesign("textColor", v)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ImageUpload
                    bucket="ticket-assets"
                    value={draft.design.logoUrl}
                    onChange={(url) => setDesign("logoUrl", url ?? undefined)}
                    label="Logo"
                    aspect="square"
                    hint="Shown on the ticket header."
                  />
                  <ImageUpload
                    bucket="ticket-assets"
                    value={draft.design.bannerUrl}
                    onChange={(url) => setDesign("bannerUrl", url ?? undefined)}
                    label="Banner"
                    aspect="wide"
                    hint="Behind the header gradient."
                  />
                </div>

                <div>
                  <label className="label">Perks</label>
                  <div className="flex gap-2">
                    <input
                      className="input"
                      value={perkInput}
                      onChange={(e) => setPerkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPerk();
                        }
                      }}
                      placeholder="e.g. Free welcome drink"
                    />
                    <button type="button" onClick={addPerk} className="btn-secondary shrink-0">
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>
                  {(draft.design.perks?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {draft.design.perks?.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700"
                        >
                          {p}
                          <button
                            type="button"
                            onClick={() => removePerk(p)}
                            aria-label={`Remove ${p}`}
                            className="text-brand-500 hover:text-brand-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Terms &amp; conditions</label>
                  <textarea
                    className="input min-h-[70px]"
                    value={draft.design.terms ?? ""}
                    onChange={(e) => setDesign("terms", e.target.value)}
                    placeholder="Printed in small text on the ticket."
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <span className="text-sm font-medium text-slate-700">Show QR code</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={draft.design.showQr !== false}
                    onChange={(e) => setDesign("showQr", e.target.checked)}
                  />
                </label>
              </section>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button type="button" variant="ghost" onClick={closeEditor} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" onClick={save} loading={saving}>
                  <Save className="h-4 w-4" />
                  {editingId ? "Save ticket" : "Create ticket"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-slate-100 p-4 ring-1 ring-slate-200">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              <Eye className="h-3.5 w-3.5" /> Live preview
            </p>
            <TicketPreview
              data={{
                eventTitle: event.title,
                ticketTypeName: draft.name || "General",
                venue: event.venue_name,
                city: event.city,
                country: event.country,
                startsAt: event.starts_at,
                holderName: "Sample Attendee",
                reference: "EVK-7F3A-91KD",
                price: Number.isNaN(previewPrice) ? 0 : previewPrice,
                currency: draft.currency,
                design: draft.design,
                organizer: event.title,
              }}
            />
            <p className="mt-3 text-center text-xs text-slate-400">
              This is how buyers will see this ticket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={`${label} colour`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-0 bg-transparent p-0 font-mono text-sm uppercase text-slate-700 focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}
