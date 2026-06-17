import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  /** Tailwind classes for the icon chip, e.g. "bg-brand-100 text-brand-700". */
  iconClassName?: string;
  /** Highlights the card (e.g. when something needs attention). */
  highlight?: boolean;
  className?: string;
}

/**
 * Presentational metric card used across the admin overview & summaries.
 */
export function AdminStatCard({
  icon,
  label,
  value,
  sublabel,
  iconClassName = "bg-brand-100 text-brand-700",
  highlight = false,
  className,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "card flex flex-col gap-3 p-5",
        highlight && "ring-2 ring-amber-300",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", iconClassName)}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-slate-900">
          {value}
        </p>
        {sublabel && <div className="mt-1 text-xs text-slate-400">{sublabel}</div>}
      </div>
    </div>
  );
}
