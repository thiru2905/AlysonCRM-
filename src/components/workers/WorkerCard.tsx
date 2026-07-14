import type { Worker } from "@/lib/workers/data";
import {
  WORKER_TYPES,
  formatCost,
  formatCount,
  formatLatency,
} from "@/lib/workers/data";
import { WorkerIcon } from "./WorkerIcon";
import { StatusDot } from "./StatusDot";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

export function WorkerCard({
  worker,
  onOpen,
  active,
}: {
  worker: Worker;
  onOpen?: (id: string) => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={() => onOpen?.(worker.id)}
      className={cn(
        "group text-left w-full rounded-xl border bg-card p-4 transition",
        active
          ? "border-border-strong shadow-inset-hairline"
          : "border-border hover:border-border-strong hover:bg-accent/40",
      )}
    >
      <div className="flex items-start gap-3">
        <WorkerIcon type={worker.type} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">{worker.name}</h3>
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {worker.handle}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              {worker.title}
            </span>
          </div>
        </div>
        <StatusDot status={worker.status} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {WORKER_TYPES[worker.type].label}
        </span>
        {worker.version && (
          <span className="text-mono text-[10px] text-muted-foreground">
            · {worker.version}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 items-end">
        <Stat label="Success" value={`${Math.round(worker.performance.successRate * 100)}%`} />
        <Stat label="Tasks" value={formatCount(worker.performance.tasksCompleted)} />
        <Stat label="Speed" value={formatLatency(worker.performance.avgLatencyMs)} />
        <Stat label="Cost" value={formatCost(worker.performance.costPerTaskUsd)} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Sparkline points={worker.performance.trend7d} width={120} height={20} />
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          7d
        </span>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm truncate">{value}</div>
    </div>
  );
}
