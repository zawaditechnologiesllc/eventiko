import { cn } from "@/lib/utils";

type Tone = "brand" | "accent" | "green" | "amber" | "red" | "slate" | "blue";

const tones: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-700",
  accent: "bg-accent-100 text-accent-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  published: "green",
  draft: "slate",
  cancelled: "red",
  completed: "blue",
  pending: "amber",
  approved: "green",
  rejected: "red",
  suspended: "red",
  paid: "green",
  valid: "green",
  used: "slate",
  expired: "amber",
  failed: "red",
  refunded: "amber",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone[status] ?? "slate"} className="capitalize">
      {status}
    </Badge>
  );
}
