import { cn } from "@/lib/utils";

/**
 * Uncertainty band visualisation:
 *   |------[####|########]------|
 *   low        val         high
 */
export function UncertaintyBand({
  low,
  value,
  high,
  format,
  className,
}: {
  low: number;
  value: number;
  high: number;
  format: (n: number) => string;
  className?: string;
}) {
  const span = Math.max(high - low, 0.0001);
  const pos = ((value - low) / span) * 100;
  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2 rounded-full bg-accent border border-border overflow-hidden">
        <div className="absolute inset-y-0 left-2 right-2 rounded-full bg-ai/30" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-[2px] bg-ai"
          style={{ left: `calc(${pos}% - 1px)` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-mono text-[10px] text-muted-foreground">
        <span>{format(low)}</span>
        <span className="text-foreground">{format(value)}</span>
        <span>{format(high)}</span>
      </div>
    </div>
  );
}
