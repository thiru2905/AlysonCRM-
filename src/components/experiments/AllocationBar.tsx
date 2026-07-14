import { cn } from "@/lib/utils";

/** Horizontal traffic allocation bar. */
export function AllocationBar({
  parts,
  className,
}: {
  parts: { id: string; label: string; value: number; winner?: boolean }[];
  className?: string;
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-2 rounded-full overflow-hidden border border-border">
        {parts.map((p, i) => (
          <div
            key={p.id}
            style={{ width: `${(p.value / total) * 100}%` }}
            className={cn(
              p.winner
                ? "bg-ai"
                : i === 0
                  ? "bg-foreground/70"
                  : "bg-muted-foreground/40",
            )}
            title={`${p.label} · ${Math.round((p.value / total) * 100)}%`}
          />
        ))}
      </div>
    </div>
  );
}
