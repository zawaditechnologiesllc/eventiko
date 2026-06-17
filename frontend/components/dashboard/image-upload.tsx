"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Link2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  bucket: "event-images" | "seller-logos" | "ticket-assets";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  /** Visual aspect ratio of the preview frame. */
  aspect?: "video" | "square" | "wide";
  className?: string;
}

const aspectClass: Record<NonNullable<ImageUploadProps["aspect"]>, string> = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[3/1]",
};

/**
 * Reusable image picker: uploads to a public Supabase storage bucket and
 * returns the public URL, or lets the user paste an external URL directly.
 */
export function ImageUpload({
  bucket,
  value,
  onChange,
  label,
  hint,
  aspect = "video",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      {label && <span className="label">{label}</span>}

      {value ? (
        <div className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200">
          <div className={cn("w-full bg-slate-100", aspectClass[aspect])}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-white"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-white"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : urlMode ? (
        <div className="flex gap-2">
          <input
            type="url"
            inputMode="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="input"
          />
          <button
            type="button"
            onClick={() => {
              if (urlDraft.trim()) onChange(urlDraft.trim());
              setUrlMode(false);
              setUrlDraft("");
            }}
            className="btn-secondary shrink-0"
          >
            Use
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40",
            aspectClass[aspect]
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
              <span className="text-sm font-medium text-slate-500">Uploading…</span>
            </>
          ) : (
            <>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-brand-600">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-700">Click to upload</span>
              <span className="text-xs text-slate-400">PNG, JPG or WEBP · up to 5 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-xs text-slate-400">{hint}</p>
        {!value && (
          <button
            type="button"
            onClick={() => setUrlMode((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Link2 className="h-3.5 w-3.5" />
            {urlMode ? "Upload a file" : "Paste a URL"}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
