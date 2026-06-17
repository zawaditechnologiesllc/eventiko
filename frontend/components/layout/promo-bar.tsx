import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { Broadcast } from "@/lib/types";

/**
 * Hero promo / broadcast bar. Admins post promotions and announcements that
 * render here at the very top of the site.
 */
export function PromoBar({ broadcasts }: { broadcasts: Broadcast[] }) {
  const active = broadcasts.filter((b) => b.is_active);
  if (!active.length) return null;
  const top = active[0];

  return (
    <div
      className="relative overflow-hidden text-center text-sm font-medium"
      style={{ background: top.bg_color || "#7C3AED", color: top.text_color || "#FFFFFF" }}
    >
      <div className="container-page flex items-center justify-center gap-2 py-2">
        <Megaphone className="h-4 w-4 shrink-0" />
        <span className="truncate">
          <span className="font-bold">{top.title}</span>
          {top.message ? <span className="hidden opacity-90 sm:inline"> — {top.message}</span> : null}
        </span>
        {top.link_url && (
          <Link href={top.link_url} className="ml-1 shrink-0 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold hover:bg-white/30">
            {top.cta_text || "Learn more"}
          </Link>
        )}
      </div>
    </div>
  );
}
