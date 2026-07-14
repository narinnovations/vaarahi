import { cn } from "@/lib/utils";

const PRESETS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  success: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  paid: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  published: "bg-emerald-100 text-emerald-700",

  pending: "bg-amber-100 text-amber-700",
  processing: "bg-amber-100 text-amber-700",
  draft: "bg-amber-100 text-amber-700",

  shipped: "bg-sky-100 text-sky-700",
  confirmed: "bg-sky-100 text-sky-700",
  info: "bg-sky-100 text-sky-700",

  cancelled: "bg-ruby/20 text-ruby",
  rejected: "bg-ruby/20 text-ruby",
  blocked: "bg-ruby/20 text-ruby",
  failed: "bg-ruby/20 text-ruby",
  danger: "bg-ruby/20 text-ruby",

  inactive: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const key = (status ?? "").toLowerCase();
  const preset = PRESETS[key] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
        preset,
        className,
      )}
    >
      {children ?? status}
    </span>
  );
}
