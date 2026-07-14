import { cn } from "@/lib/utils";

export function ConfidenceMeter({
  value,
  className,
  showLabel = true,
}: {
  value: number; // 0..1
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const label = pct >= 0.8 ? "High" : pct >= 0.5 ? "Medium" : "Low";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-1 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 ai-gradient-bg rounded-full"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          {label} · {Math.round(pct * 100)}%
        </span>
      )}
    </div>
  );
}
