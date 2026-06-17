"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { EVENT_CATEGORIES, COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialQ = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const country = searchParams.get("country") ?? "";

  const [q, setQ] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the local search box in sync when the URL changes externally.
  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  const pushParams = useCallback(
    (next: { q?: string; category?: string; country?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/events?${query}` : "/events", { scroll: false });
      });
    },
    [router, searchParams]
  );

  function onSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ q: value.trim() });
    }, 350);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushParams({ q: q.trim() });
  }

  const hasFilters = Boolean(q || category || country);

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-slate-100 bg-white/85 px-4 py-4 backdrop-blur-lg sm:mx-0 sm:rounded-2xl sm:border sm:border-slate-100 sm:px-5 sm:shadow-card">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, artists, venues…"
            aria-label="Search events"
            className="input pl-11"
          />
          {isPending && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-500" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-slate-400 sm:flex">
            <SlidersHorizontal className="h-4 w-4" />
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(value) => pushParams({ category: value })}
            placeholder="All categories"
            options={EVENT_CATEGORIES as readonly string[]}
          />

          <Select
            label="Country"
            value={country}
            onChange={(value) => pushParams({ country: value })}
            placeholder="All countries"
            options={COUNTRIES as readonly string[]}
          />

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                startTransition(() => router.push("/events", { scroll: false }));
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <div className="relative flex-1 lg:flex-none">
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "input w-full appearance-none pr-9 lg:w-44",
          value ? "font-semibold text-slate-900" : "text-slate-500"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
