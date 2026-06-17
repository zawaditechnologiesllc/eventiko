"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventStatus } from "@/lib/types";

interface PublishToggleProps {
  eventId: string;
  status: EventStatus;
  /** True when the event has at least one active ticket type. */
  canPublish: boolean;
}

/**
 * Toggles an event between 'draft' and 'published'. Locked events
 * (cancelled / completed) are shown read-only.
 */
export function PublishToggle({ eventId, status, canPublish }: PublishToggleProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<EventStatus>(status);

  const isPublished = current === "published";
  const locked = current === "cancelled" || current === "completed";

  async function toggle() {
    if (locked) return;
    if (!isPublished && !canPublish) {
      setError("Add at least one active ticket type before publishing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const next: EventStatus = isPublished ? "draft" : "published";
      const { error: upErr } = await supabase
        .from("events")
        .update({ status: next })
        .eq("id", eventId);
      if (upErr) throw upErr;
      setCurrent(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the event.");
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold capitalize text-slate-500">
        {current}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={
          isPublished
            ? "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
            : "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95 disabled:opacity-50"
        }
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPublished ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        {isPublished ? "Unpublish" : "Publish event"}
      </button>
      {error && <p className="text-xs font-medium text-red-600 sm:text-right">{error}</p>}
    </div>
  );
}
