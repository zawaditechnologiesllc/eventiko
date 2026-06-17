import * as React from "react";
import { cn } from "@/lib/utils";

export interface Column {
  /** Header label. */
  label: React.ReactNode;
  /** Optional alignment. */
  align?: "left" | "right" | "center";
  /** Hide this column below the lg breakpoint. */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
}

const hideClass: Record<NonNullable<Column["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

const alignClass: Record<NonNullable<Column["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Responsive table shell with a consistent header, horizontal scroll on small
 * screens, and an empty state. Pass <DataTableRow>/<DataTableCell> as children,
 * or any <tr>/<td> markup.
 */
export function DataTable({
  columns,
  children,
  empty,
  isEmpty,
  className,
}: {
  columns: Column[];
  children: React.ReactNode;
  empty?: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                    alignClass[col.align ?? "left"],
                    col.hideBelow && hideClass[col.hideBelow],
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-sm text-sm text-slate-500">
                    {empty ?? "Nothing here yet."}
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTableRow({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition hover:bg-slate-50/70",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  align = "left",
  hideBelow,
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-slate-700",
        alignClass[align],
        hideBelow && hideClass[hideBelow],
        className
      )}
    >
      {children}
    </td>
  );
}
