import { sourceMeta, type SourceKind } from "@/lib/knowledge/data";
import { cn } from "@/lib/utils";

export function SourceIcon({
  kind,
  size = "sm",
  withLabel,
  className,
}: {
  kind: SourceKind;
  size?: "xs" | "sm" | "md";
  withLabel?: boolean;
  className?: string;
}) {
  const m = sourceMeta(kind);
  const Icon = m.icon;
  const box = size === "xs" ? "h-5 w-5" : size === "md" ? "h-8 w-8" : "h-6 w-6";
  const icon = size === "xs" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-md border border-border bg-card",
          box,
        )}
      >
        <Icon className={cn(icon, m.color)} />
      </span>
      {withLabel && (
        <span className="text-xs text-muted-foreground">{m.label}</span>
      )}
    </span>
  );
}
