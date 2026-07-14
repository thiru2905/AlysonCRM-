import type { Phase, Task } from "@/lib/projects/data";
import { cn } from "@/lib/utils";
import { TaskRow } from "./TaskRow";
import { Check, CircleDot, Clock } from "lucide-react";

export function PhaseBoard({
  phases,
  tasks,
  onOpen,
}: {
  phases: Phase[];
  tasks: Task[];
  onOpen?: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {phases.map((phase) => {
        const items = tasks.filter((t) => t.phaseId === phase.id);
        const Icon =
          phase.status === "complete" ? Check :
          phase.status === "active" ? CircleDot : Clock;
        const tone =
          phase.status === "complete" ? "text-emerald-400" :
          phase.status === "active" ? "text-ai" : "text-muted-foreground";
        return (
          <section
            key={phase.id}
            className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
          >
            <header className="px-3.5 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-3.5 w-3.5", tone)} />
                <h3 className="text-sm font-medium">{phase.label}</h3>
                <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {items.length}
                </span>
                <div className="flex-1" />
                <span className="text-mono text-[10px] text-muted-foreground">
                  {Math.round(phase.progress * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {phase.goal}
              </p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    phase.status === "complete"
                      ? "bg-emerald-400/70"
                      : "ai-gradient-bg",
                  )}
                  style={{ width: `${phase.progress * 100}%` }}
                />
              </div>
            </header>
            <div className="flex-1">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3.5 py-6 text-center">
                  No tasks in this phase.
                </p>
              ) : (
                items.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} compact />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
