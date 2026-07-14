import { executorMeta, type ExecutorKind } from "@/lib/projects/data";
import { cn } from "@/lib/utils";

export function ExecutorBadge({
  kind,
  size = "sm",
  withLabel,
  className,
}: {
  kind: ExecutorKind;
  size?: "xs" | "sm" | "md";
  withLabel?: boolean;
  className?: string;
}) {
  const m = executorMeta(kind);
  const Icon = m.icon;
  const box = size === "xs" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-5 w-5";
  const icon = size === "xs" ? "h-2.5 w-2.5" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={m.label}
    >
      <span
        className={cn(
          "grid place-items-center rounded border border-border bg-card",
          box,
        )}
      >
        <Icon className={cn(icon, m.tint)} />
      </span>
      {withLabel && (
        <span className="text-[11px] text-muted-foreground">{m.label}</span>
      )}
    </span>
  );
}
