import { TableStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  number,
  { label: string; className: string; dot: string; description?: string }
> = {
  0: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  1: {
    label: "In service",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500"
  },
  2: {
    label: "Closing",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500"
  }
};

type StatusBadgeProps = {
  status?: TableStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = typeof status === "number" ? Number(status) : undefined;
  const config =
    (normalized != null ? STATUS_STYLES[normalized] : null) ?? {
      label: normalized != null ? `Status ${normalized}` : "Updating...",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-500"
    };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        config.className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}
