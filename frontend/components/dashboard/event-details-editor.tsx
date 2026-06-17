"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { EventForm } from "@/components/dashboard/event-form";
import { cn } from "@/lib/utils";
import type { EventRecord } from "@/lib/types";

/**
 * Collapsible panel wrapping the EventForm in edit mode, for the manage page.
 */
export function EventDetailsEditor({
  event,
  sellerId,
}: {
  event: EventRecord;
  sellerId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <Pencil className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-display text-lg font-bold text-slate-900">
              Event details
            </span>
            <span className="block text-sm text-slate-500">
              Title, description, date, venue and cover image
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-slate-400 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <EventForm event={event} sellerId={sellerId} onCancel={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
