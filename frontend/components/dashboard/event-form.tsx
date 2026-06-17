"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { createClient } from "@/lib/supabase/client";
import { EVENT_CATEGORIES, COUNTRIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { EventRecord } from "@/lib/types";

interface EventFormProps {
  event?: EventRecord;
  sellerId: string;
  /** Optional cancel handler (e.g. to collapse an inline edit panel). */
  onCancel?: () => void;
}

/** Convert an ISO/timestamp string to a value usable by <input type="datetime-local">. */
function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function EventForm({ event, sellerId, onCancel }: EventFormProps) {
  const router = useRouter();
  const isEdit = Boolean(event);

  const [title, setTitle] = useState(event?.title ?? "");
  const [category, setCategory] = useState(event?.category ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [venueName, setVenueName] = useState(event?.venue_name ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [city, setCity] = useState(event?.city ?? "");
  const [country, setCountry] = useState(event?.country ?? COUNTRIES[0]);
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.ends_at));
  const [timezone, setTimezone] = useState(event?.timezone ?? "Europe/Paris");
  const [coverUrl, setCoverUrl] = useState<string | null>(event?.cover_image_url ?? null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!title.trim()) return setError("Event title is required.");
    if (!startsAt) return setError("Please set a start date and time.");
    const startIso = fromLocalInput(startsAt);
    const endIso = fromLocalInput(endsAt);
    if (endIso && startIso && new Date(endIso) < new Date(startIso))
      return setError("End time can't be before the start time.");

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        title: title.trim(),
        category: category || null,
        description: description.trim() || null,
        venue_name: venueName.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country || null,
        starts_at: startIso,
        ends_at: endIso,
        timezone: timezone || "Europe/Paris",
        cover_image_url: coverUrl,
      };

      if (isEdit && event) {
        const { error: upErr } = await supabase
          .from("events")
          .update(payload)
          .eq("id", event.id);
        if (upErr) throw upErr;
        setSaved(true);
        router.refresh();
        setSaving(false);
      } else {
        const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
        const { data, error: insErr } = await supabase
          .from("events")
          .insert({ ...payload, seller_id: sellerId, slug, status: "draft" })
          .select("id")
          .single();
        if (insErr) throw insErr;
        router.push(`/dashboard/events/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Event details saved.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Event title *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunset Rooftop Festival 2026"
          />
        </div>

        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Timezone</label>
          <input
            className="input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Europe/Paris"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the line-up, what to expect, age limits, etc."
          />
        </div>

        <div>
          <label className="label">Start date &amp; time *</label>
          <input
            type="datetime-local"
            className="input"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label">End date &amp; time</label>
          <input
            type="datetime-local"
            className="input"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Venue name</label>
          <input
            className="input"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="e.g. Le Rooftop, La Défense"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street and postal code"
          />
        </div>
        <div>
          <label className="label">City</label>
          <input
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris"
          />
        </div>
        <div>
          <label className="label">Country</label>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <ImageUpload
            bucket="event-images"
            value={coverUrl}
            onChange={setCoverUrl}
            label="Cover image"
            aspect="video"
            hint="16:9 recommended. Shown on the marketplace and your event page."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {(onCancel || !isEdit) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => (onCancel ? onCancel() : router.push("/dashboard/events"))}
            disabled={saving}
          >
            <X className="h-4 w-4" /> Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" />
          {isEdit ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
