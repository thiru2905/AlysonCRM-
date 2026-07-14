import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExecutorBadge } from "./ExecutorBadge";
import { StatusIcon } from "./StatusIcon";
import { formatRelative } from "@/components/entity/EntityPanel";
import type { Phase, Project, Task } from "@/lib/projects/data";
import {
  ChevronRight,
  Circle,
  CircleCheck,
  CircleDot,
  Layers,
} from "lucide-react";

/**
 * WorkTree — the canonical Project › Phase › Task › Subtask spine.
 *
 * Renders one project as an expandable tree. Every task and subtask row
 * shows the executor (human / AI / browser / API / tool) so the work
 * hierarchy AND who executes each unit are visible in one view.
 *
 * When `focusAssignees` is provided, tasks/subtasks whose assignee matches
 * are highlighted — used by the entity Work tab to scope the tree to a
 * person without hiding surrounding structure.
 */
export function WorkTree({
  project,
  focusAssignees,
  defaultOpen = "active",
}: {
  project: Project;
  focusAssignees?: string[];
  defaultOpen?: "all" | "active" | "none";
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Layers className="h-3 w-3 text-ai" />
        <span className="text-foreground">{project.code}</span>
        <span className="text-muted-foreground/60">·</span>
        <span>Project › Phase › Task › Subtask</span>
        <div className="flex-1" />
        <span>{Math.round(project.progress * 100)}%</span>
      </div>

      <ol>
        {project.phases.map((phase, i) => (
          <PhaseNode
            key={phase.id}
            phase={phase}
            index={i}
            tasks={project.tasks.filter((t) => t.phaseId === phase.id)}
            focusAssignees={focusAssignees}
            defaultOpen={defaultOpen}
          />
        ))}
      </ol>
    </div>
  );
}

function PhaseNode({
  phase,
  index,
  tasks,
  focusAssignees,
  defaultOpen,
}: {
  phase: Phase;
  index: number;
  tasks: Task[];
  focusAssignees?: string[];
  defaultOpen: "all" | "active" | "none";
}) {
  const shouldOpen =
    defaultOpen === "all" ||
    (defaultOpen === "active" && phase.status !== "complete" && tasks.length > 0);
  const [open, setOpen] = useState(shouldOpen);

  const Icon =
    phase.status === "complete" ? CircleCheck :
    phase.status === "active" ? CircleDot : Circle;
  const tone =
    phase.status === "complete" ? "text-emerald-400" :
    phase.status === "active" ? "text-ai" : "text-muted-foreground";

  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60 transition text-left"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-6">
          P{index + 1}
        </span>
        <Icon className={cn("h-3.5 w-3.5", tone)} />
        <span className="text-sm font-medium">{phase.label}</span>
        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
          · {phase.goal}
        </span>
        <div className="flex-1" />
        <span className="text-mono text-[10px] text-muted-foreground">
          {tasks.length} tasks
        </span>
        <div className="w-16 md:w-24 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              phase.status === "complete" ? "bg-emerald-400/70" : "ai-gradient-bg",
            )}
            style={{ width: `${phase.progress * 100}%` }}
          />
        </div>
        <span className="text-mono text-[10px] text-muted-foreground w-8 text-right">
          {Math.round(phase.progress * 100)}%
        </span>
      </button>

      {open && (
        <ul className="bg-background/40">
          {tasks.length === 0 && (
            <li className="pl-12 pr-4 py-2 text-xs text-muted-foreground">
              No tasks in this phase yet.
            </li>
          )}
          {tasks.map((t) => (
            <TaskNode
              key={t.id}
              task={t}
              focusAssignees={focusAssignees}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function TaskNode({
  task,
  focusAssignees,
}: {
  task: Task;
  focusAssignees?: string[];
}) {
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;
  const [open, setOpen] = useState(false);
  const highlighted =
    focusAssignees?.includes(task.assignee.name) ?? false;

  return (
    <li className="border-t border-border/40 first:border-t-0">
      <div
        className={cn(
          "flex items-center gap-2 pl-10 pr-4 py-2 hover:bg-accent/40 transition",
          highlighted && "bg-ai/[0.04]",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid place-items-center h-4 w-4 shrink-0"
          aria-label={hasSubtasks ? (open ? "Collapse" : "Expand") : "No subtasks"}
        >
          {hasSubtasks ? (
            <ChevronRight
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
          ) : (
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          )}
        </button>
        <StatusIcon status={task.status} />
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
          {task.ref}
        </span>
        <span className={cn("text-sm truncate flex-1 min-w-0", highlighted && "font-medium")}>
          {task.title}
        </span>
        <ExecutorBadge kind={task.executor} />
        <span className="hidden md:inline text-[11px] text-muted-foreground truncate max-w-[140px] shrink-0">
          {task.assignee.name}
        </span>
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-12 text-right shrink-0">
          {formatRelative(task.activityAt)}
        </span>
      </div>

      {open && hasSubtasks && (
        <ul className="border-t border-border/40">
          {task.subtasks!.map((s) => {
            const subHighlight =
              focusAssignees?.some((n) =>
                // subtasks don't carry assignee names, only executor kind;
                // highlight when the parent task is highlighted
                highlighted ? true : n === task.assignee.name,
              ) ?? false;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-2 pl-[76px] pr-4 py-1.5 border-t border-border/30 first:border-t-0 hover:bg-accent/30 transition",
                  subHighlight && "bg-ai/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border shrink-0",
                    s.done
                      ? "bg-emerald-400/70 border-emerald-400/70"
                      : "border-muted-foreground/40",
                  )}
                />
                <span
                  className={cn(
                    "text-[13px] truncate flex-1 min-w-0",
                    s.done && "text-muted-foreground line-through decoration-muted-foreground/40",
                  )}
                >
                  {s.title}
                </span>
                <ExecutorBadge kind={s.executor} size="xs" />
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
