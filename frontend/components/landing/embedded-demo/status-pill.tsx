import type { TableStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusConfig = {
  label: string;
  dot: string;
};

const STATUS_CONFIG: Record<number, StatusConfig> = {
  0: { label: "Free", dot: "bg-emerald-400/80" },
  1: { label: "Open", dot: "bg-amber-400/80" },
  2: { label: "Closing", dot: "bg-sky-400/80" }
};

type StatusPillProps = {
  status?: TableStatus;
  className?: string;
};

export function StatusPill({ status, className }: StatusPillProps) {
  const normalized = typeof status === "number" ? Number(status) : undefined;
  const config =
    (normalized != null ? STATUS_CONFIG[normalized] : undefined) ?? {
      label: normalized != null ? `Status ${normalized}` : "Updating",
      dot: "bg-white/30"
    };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-xs text-muted-foreground",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}
