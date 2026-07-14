import type { Prediction } from "@/lib/predictions/data";
import { KIND_META, formatValue, signedPct } from "@/lib/predictions/data";
import { PredictionIcon } from "./PredictionIcon";
import { UncertaintyBand } from "./UncertaintyBand";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function PredictionCard({
  prediction: p,
  active,
  onOpen,
}: {
  prediction: Prediction;
  active?: boolean;
  onOpen?: (id: string) => void;
}) {
  const delta =
    typeof p.baseline === "number"
      ? (p.value - p.baseline) / (p.baseline || 1)
      : 0;
  const DirIcon =
    p.direction === "up"
      ? ArrowUpRight
      : p.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <button
      onClick={() => onOpen?.(p.id)}
      className={cn(
        "group text-left w-full rounded-xl border bg-card p-4 transition",
        active
          ? "border-border-strong shadow-inset-hairline"
          : "border-border hover:border-border-strong hover:bg-accent/40",
      )}
    >
      <div className="flex items-start gap-3">
        <PredictionIcon kind={p.kind} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {p.subject.kind} · {p.subject.label}
          </div>
          <div className="text-sm font-medium leading-snug mt-0.5">
            {p.statement}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-display text-lg leading-none">
            {formatValue(p.unit, p.value)}
          </div>
          {typeof p.baseline === "number" && (
            <div
              className={cn(
                "mt-1 text-mono text-[10px] flex items-center gap-0.5 justify-end",
                p.direction === "up" && "text-emerald-500",
                p.direction === "down" && "text-destructive",
                p.direction === "flat" && "text-muted-foreground",
              )}
            >
              <DirIcon className="h-3 w-3" />
              {signedPct(delta)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <UncertaintyBand
          low={p.range.low}
          value={p.value}
          high={p.range.high}
          format={(n) => formatValue(p.unit, n)}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{KIND_META[p.kind].label}</span>
        <span>·</span>
        <span>{p.horizonDays}d horizon</span>
        <span>·</span>
        <span>conf {Math.round(p.confidence * 100)}%</span>
        <span className="flex-1" />
        <span
          className={cn(
            p.risk >= 0.5
              ? "text-destructive"
              : p.risk >= 0.25
                ? "text-amber-500"
                : "text-emerald-500",
          )}
        >
          risk {Math.round(p.risk * 100)}%
        </span>
      </div>
    </button>
  );
}
