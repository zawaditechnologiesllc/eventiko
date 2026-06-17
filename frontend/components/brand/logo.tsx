import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  dark = false,
}: {
  className?: string;
  href?: string | null;
  dark?: boolean;
}) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-display font-extrabold tracking-tight", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
          <path d="M10 5v14" strokeDasharray="2 2.5" />
        </svg>
      </span>
      <span className={cn("text-xl", dark ? "text-white" : "text-slate-900")}>
        event<span className="text-brand-600">iko</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="Eventiko home">
      {inner}
    </Link>
  );
}
