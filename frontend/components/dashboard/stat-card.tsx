import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  /** Positive (green) or negative (red) trend chip, e.g. "+12%". */
  trend?: { value: string; positive?: boolean };
  /** Tailwind classes for the icon chip background, e.g. "bg-brand-100 text-brand-700". */
  iconClassName?: string;
  className?: string;
}

/**
 * Presentational metric card used across the seller dashboard overview.
 */
export function StatCard({
  icon,
  label,
  value,
  sublabel,
  trend,
  iconClassName = "bg-brand-100 text-brand-700",
  className,
}: StatCardProps) {
  return (
    <div className={cn("card flex flex-col gap-3 p-5", className)}>
      <div className="flex items-center justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", iconClassName)}>
          {icon}
        </span>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              trend.positive === false
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-slate-900">
          {value}
        </p>
        {sublabel && <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
}
