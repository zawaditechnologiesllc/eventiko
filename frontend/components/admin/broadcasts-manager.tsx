"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, cn } from "@/lib/utils";
import type { Broadcast } from "@/lib/types";

const TYPES = [
  { value: "promotion", label: "Promotion" },
  { value: "broadcast", label: "Broadcast" },
  { value: "announcement", label: "Announcement" },
];

interface FormState {
  title: string;
  message: string;
  type: string;
  cta_text: string;
  link_url: string;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  priority: number;
  starts_at: string;
  ends_at: string;
  image_url: string;
}

function emptyForm(): FormState {
  return {
    title: "",
    message: "",
    type: "promotion",
    cta_text: "",
    link_url: "",
    bg_color: "#7C3AED",
    text_color: "#FFFFFF",
    is_active: true,
    priority: 0,
    starts_at: "",
    ends_at: "",
    image_url: "",
  };
}

/** Convert an ISO timestamp to a value usable by <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formFrom(b: Broadcast): FormState {
  return {
    title: b.title ?? "",
    message: b.message ?? "",
    type: b.type ?? "promotion",
    cta_text: b.cta_text ?? "",
    link_url: b.link_url ?? "",
    bg_color: b.bg_color ?? "#7C3AED",
    text_color: b.text_color ?? "#FFFFFF",
    is_active: b.is_active,
    priority: b.priority ?? 0,
    starts_at: toLocalInput(b.starts_at),
    ends_at: toLocalInput(b.ends_at),
    image_url: b.image_url ?? "",
  };
}

export function BroadcastsManager({
  initialBroadcasts,
}: {
  initialBroadcasts: Broadcast[];
}) {
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [editing, setEditing] = useState<Broadcast | "new" | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(b: Broadcast) {
    setTogglingId(b.id);
    setError(null);
    const next = !b.is_active;
    const prev = broadcasts;
    setBroadcasts((list) =>
      list.map((x) => (x.id === b.id ? { ...x, is_active: next } : x))
    );
    const supabase = createClient();
    const { error: err } = await supabase
      .from("broadcasts")
      .update({ is_active: next })
      .eq("id", b.id);
    setTogglingId(null);
    if (err) {
      setBroadcasts(prev);
      setError(err.message);
    }
  }

  async function remove(b: Broadcast) {
    if (!window.confirm(`Delete promotion "${b.title}"?`)) return;
    setDeletingId(b.id);
    setError(null);
    const prev = broadcasts;
    setBroadcasts((list) => list.filter((x) => x.id !== b.id));
    const supabase = createClient();
    const { error: err } = await supabase.from("broadcasts").delete().eq("id", b.id);
    setDeletingId(null);
    if (err) {
      setBroadcasts(prev);
      setError(err.message);
    }
  }

  function handleSaved(saved: Broadcast) {
    setBroadcasts((list) => {
      const exists = list.some((b) => b.id === saved.id);
      const next = exists
        ? list.map((b) => (b.id === saved.id ? saved : b))
        : [saved, ...list];
      return next.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    });
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {broadcasts.length} promotion{broadcasts.length === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setEditing("new")} size="sm">
          <Plus className="h-4 w-4" /> New promotion
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {broadcasts.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Megaphone className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-slate-600">No promotions yet.</p>
          <p className="max-w-sm text-xs text-slate-400">
            Create one to display an announcement bar at the top of the site.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              {/* Live preview strip */}
              <PromoPreview broadcast={b} />
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{b.title}</p>
                    <Badge tone={b.is_active ? "green" : "slate"}>
                      {b.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge tone="brand" className="capitalize">
                      {b.type}
                    </Badge>
                    <span className="text-xs text-slate-400">Priority {b.priority}</span>
                  </div>
                  {b.message && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">{b.message}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {b.starts_at ? `From ${formatDateTime(b.starts_at)}` : "No start"}
                    {b.ends_at ? ` · until ${formatDateTime(b.ends_at)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <span className="text-slate-500">Active</span>
                    <span className="relative inline-flex">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={b.is_active}
                        disabled={togglingId === b.id}
                        onChange={() => toggleActive(b)}
                      />
                      <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-600 peer-disabled:opacity-50" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditing(b)}
                    aria-label="Edit"
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b)}
                    disabled={deletingId === b.id}
                    aria-label="Delete"
                    className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BroadcastForm
          broadcast={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function PromoPreview({ broadcast }: { broadcast: Pick<Broadcast, "title" | "message" | "cta_text" | "link_url" | "bg_color" | "text_color"> }) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium"
      style={{
        background: broadcast.bg_color || "#7C3AED",
        color: broadcast.text_color || "#FFFFFF",
      }}
    >
      <Megaphone className="h-4 w-4 shrink-0" />
      <span className="truncate">
        <span className="font-bold">{broadcast.title || "Promotion title"}</span>
        {broadcast.message ? (
          <span className="hidden opacity-90 sm:inline"> — {broadcast.message}</span>
        ) : null}
      </span>
      {(broadcast.cta_text || broadcast.link_url) && (
        <span className="ml-1 shrink-0 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold">
          {broadcast.cta_text || "Learn more"}
        </span>
      )}
    </div>
  );
}

function BroadcastForm({
  broadcast,
  onClose,
  onSaved,
}: {
  broadcast: Broadcast | null;
  onClose: () => void;
  onSaved: (b: Broadcast) => void;
}) {
  const [form, setForm] = useState<FormState>(
    broadcast ? formFrom(broadcast) : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      message: form.message.trim() || null,
      type: form.type,
      cta_text: form.cta_text.trim() || null,
      link_url: form.link_url.trim() || null,
      bg_color: form.bg_color || null,
      text_color: form.text_color || null,
      is_active: form.is_active,
      priority: Number.isFinite(form.priority) ? form.priority : 0,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      image_url: form.image_url.trim() || null,
    };

    const supabase = createClient();
    const query = broadcast
      ? supabase.from("broadcasts").update(payload).eq("id", broadcast.id).select().single()
      : supabase.from("broadcasts").insert(payload).select().single();

    const { data, error: err } = await query;
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved(data as Broadcast);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
      />
      <div className="card relative w-full max-w-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {broadcast ? "Edit promotion" : "New promotion"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Live preview */}
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
            <PromoPreview broadcast={form} />
          </div>

          <div>
            <label htmlFor="b-title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="b-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="input"
              placeholder="Summer sale — 20% off"
            />
          </div>

          <div>
            <label htmlFor="b-message" className="label">
              Message
            </label>
            <textarea
              id="b-message"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Use code SUMMER at checkout."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-type" className="label">
                Type
              </label>
              <select
                id="b-type"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="input"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b-priority" className="label">
                Priority
              </label>
              <input
                id="b-priority"
                type="number"
                value={form.priority}
                onChange={(e) => set("priority", parseInt(e.target.value, 10) || 0)}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-cta" className="label">
                CTA text
              </label>
              <input
                id="b-cta"
                value={form.cta_text}
                onChange={(e) => set("cta_text", e.target.value)}
                className="input"
                placeholder="Shop now"
              />
            </div>
            <div>
              <label htmlFor="b-link" className="label">
                Link URL
              </label>
              <input
                id="b-link"
                value={form.link_url}
                onChange={(e) => set("link_url", e.target.value)}
                className="input"
                placeholder="/events"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField
              id="b-bg"
              label="Background color"
              value={form.bg_color}
              onChange={(v) => set("bg_color", v)}
            />
            <ColorField
              id="b-text"
              label="Text color"
              value={form.text_color}
              onChange={(v) => set("text_color", v)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-start" className="label">
                Starts at
              </label>
              <input
                id="b-start"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="b-end" className="label">
                Ends at
              </label>
              <input
                id="b-end"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="b-image" className="label">
              Image URL <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="b-image"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              className="input"
              placeholder="https://…"
            />
            {form.image_url && (
              <a
                href={form.image_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
              >
                Preview image <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-600" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
            <span className="text-sm font-medium text-slate-700">
              Active (visible on the site)
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {broadcast ? "Save changes" : "Create promotion"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("input font-mono text-xs uppercase")}
          placeholder="#7C3AED"
        />
      </div>
    </div>
  );
}
