import type { Experiment } from "@/lib/experiments/data";
import {
  EXPERIMENT_KINDS,
  STATUS_TONE,
  signedPct,
} from "@/lib/experiments/data";
import { KindIcon } from "./KindIcon";
import { AllocationBar } from "./AllocationBar";
import { ConfidenceStrip } from "./ConfidenceStrip";
import { cn } from "@/lib/utils";

export function ExperimentCard({
  experiment,
  active,
  onOpen,
}: {
  experiment: Experiment;
  active?: boolean;
  onOpen?: (id: string) => void;
}) {
  const winner = experiment.variants.find((v) => v.isWinner);
  const status = STATUS_TONE[experiment.status];
  return (
    <button
      onClick={() => onOpen?.(experiment.id)}
      className={cn(
        "group text-left w-full rounded-xl border bg-card p-4 transition",
        active
          ? "border-border-strong shadow-inset-hairline"
          : "border-border hover:border-border-strong hover:bg-accent/40",
      )}
    >
      <div className="flex items-start gap-3">
        <KindIcon kind={experiment.kind} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">{experiment.name}</h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{EXPERIMENT_KINDS[experiment.kind].label}</span>
            <span>·</span>
            <span className={status.className}>{status.label}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              "text-display text-lg leading-none",
              experiment.lift > 0
                ? "text-emerald-500"
                : experiment.lift < 0
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {signedPct(experiment.lift)}
          </div>
          <div className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
            lift
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {experiment.hypothesis}
      </p>

      <div className="mt-3">
        <AllocationBar
          parts={experiment.variants.map((v) => ({
            id: v.id,
            label: v.name,
            value: v.samples,
            winner: v.isWinner,
          }))}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <ConfidenceStrip
            confidence={experiment.confidence}
            significance={experiment.significance}
          />
          <span className="text-mono text-[10px] text-muted-foreground truncate">
            {winner ? `winner · ${winner.name}` : `${experiment.variants.length} variants`}
          </span>
        </div>
      </div>
    </button>
  );
}
