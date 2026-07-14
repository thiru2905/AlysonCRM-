import { cn } from "@/lib/utils";

/**
 * Compact confidence indicator: filled dots (5) + numeric label.
 * Also renders a tiny "significance" tick.
 */
export function ConfidenceStrip({
  confidence,
  significance,
  className,
}: {
  confidence: number;
  significance: number;
  className?: string;
}) {
  const filled = Math.round(confidence * 5);
  const significant = significance <= 0.05;
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < filled ? "bg-ai" : "bg-border",
            )}
          />
        ))}
      </div>
      <span className="text-mono text-[10px] text-muted-foreground">
        {Math.round(confidence * 100)}%
      </span>
      <span
        className={cn(
          "text-mono text-[10px] uppercase tracking-wider px-1 py-0.5 rounded border",
          significant
            ? "border-border text-emerald-500"
            : "border-border text-muted-foreground",
        )}
        title={`p ≈ ${significance.toFixed(3)}`}
      >
        {significant ? "sig" : "n.s."}
      </span>
    </div>
  );
}
