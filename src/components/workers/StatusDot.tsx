import type { WorkerStatus } from "@/lib/workers/data";
import { cn } from "@/lib/utils";

const TONE: Record<WorkerStatus, string> = {
  active: "bg-emerald-400",
  idle: "bg-muted-foreground/50",
  paused: "bg-amber-400",
  learning: "bg-ai",
  offline: "bg-muted-foreground/30",
};

const LABEL: Record<WorkerStatus, string> = {
  active: "Active",
  idle: "Idle",
  paused: "Paused",
  learning: "Learning",
  offline: "Offline",
};

export function StatusDot({
  status,
  withLabel = false,
  className,
}: {
  status: WorkerStatus;
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <span className="relative h-1.5 w-1.5">
        <span className={cn("absolute inset-0 rounded-full", TONE[status])} />
        {status === "active" && (
          <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
        )}
      </span>
      {withLabel && (
        <span className="text-mono uppercase tracking-wider text-[10px]">
          {LABEL[status]}
        </span>
      )}
    </span>
  );
}
