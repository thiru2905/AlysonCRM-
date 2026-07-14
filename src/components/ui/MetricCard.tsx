import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

/**
 * MetricCard — canonical KPI tile for dashboard headers.
 * Matches Alyson brand guidelines: white card, hairline border, 12px radius,
 * 16–20px padding, muted label, bold metric (24–32px), single blue accent.
 */
export interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  icon?: LucideIcon;
  sparkline?: number[];
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  trend,
  hint,
  icon: Icon,
  sparkline,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex flex-col gap-2 transition-shadow hover:shadow-pop",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-display text-[28px] leading-none font-semibold tabular-nums truncate">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "text-mono text-xs tabular-nums inline-flex items-center gap-0.5 shrink-0",
              trend === "down" ? "text-destructive" : "text-success",
              trend === "flat" && "text-muted-foreground",
            )}
          >
            {trend === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : null}
            {delta}
          </span>
        )}
      </div>
      {sparkline && sparkline.length > 1 && <MiniSpark points={sparkline} />}
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function MiniSpark({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h] as const);
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0]},${c[1]}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-7 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="msg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#msg)" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
