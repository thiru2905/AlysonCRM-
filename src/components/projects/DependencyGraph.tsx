import type { Task } from "@/lib/projects/data";
import { cn } from "@/lib/utils";
import { StatusIcon } from "./StatusIcon";
import { ExecutorBadge } from "./ExecutorBadge";

/*
  Dependency lanes: for each task with dependencies, draw a compact
  left-rail column of predecessors -> task. This avoids a general-purpose
  DAG layout (which reads noisy in small views) while still surfacing the
  critical-path shape.
*/

export function DependencyGraph({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen?: (id: string) => void;
}) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const chained = tasks.filter((t) => (t.dependsOn?.length ?? 0) > 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Dependencies · {chained.length} chained
        </div>
        <div className="flex-1" />
        <Legend />
      </header>
      <ul className="divide-y divide-border/60">
        {chained.map((t) => {
          const deps = (t.dependsOn ?? []).map((id) => byId.get(id)).filter(Boolean) as Task[];
          return (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] gap-3 items-center px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1.5">
                {deps.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onOpen?.(d.id)}
                    className="flex items-center gap-2 text-left hover:text-ai transition"
                  >
                    <StatusIcon status={d.status} />
                    <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
                      {d.ref}
                    </span>
                    <span className="text-xs truncate">{d.title}</span>
                    <ExecutorBadge kind={d.executor} size="xs" />
                  </button>
                ))}
              </div>
              <Arrow />
              <button
                onClick={() => onOpen?.(t.id)}
                className={cn(
                  "flex items-center gap-2 text-left rounded-md px-2 py-1.5",
                  "bg-accent/40 border border-border hover:border-border-strong hover:bg-accent transition",
                )}
              >
                <StatusIcon status={t.status} />
                <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
                  {t.ref}
                </span>
                <span className="text-xs truncate">{t.title}</span>
                <div className="flex-1" />
                <ExecutorBadge kind={t.executor} size="xs" />
              </button>
            </li>
          );
        })}
        {chained.length === 0 && (
          <li className="px-4 py-8 text-sm text-muted-foreground text-center">
            No dependencies declared yet.
          </li>
        )}
      </ul>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 8" className="w-5 h-2 text-muted-foreground">
      <path d="M0 4 H16 M12 1 L16 4 L12 7" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Legend() {
  return (
    <div className="hidden md:flex items-center gap-3 text-[10px] text-mono uppercase tracking-wider text-muted-foreground">
      <span>predecessors</span>
      <Arrow />
      <span>successor</span>
    </div>
  );
}
