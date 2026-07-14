import { formatRelative } from "@/components/entity/EntityPanel";
import { ExecutorBadge } from "./ExecutorBadge";
import { PriorityIcon, StatusIcon } from "./StatusIcon";
import type { Task } from "@/lib/projects/data";
import { cn } from "@/lib/utils";
import { GitBranch, ListTodo, Sparkles } from "lucide-react";

export function TaskRow({
  task,
  onOpen,
  compact,
}: {
  task: Task;
  onOpen?: (id: string) => void;
  compact?: boolean;
}) {
  const doneCount = task.subtasks?.filter((s) => s.done).length ?? 0;
  const totalSub = task.subtasks?.length ?? 0;
  return (
    <button
      onClick={() => onOpen?.(task.id)}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0",
        "hover:bg-accent/60 transition",
      )}
    >
      <PriorityIcon priority={task.priority} />
      <StatusIcon status={task.status} />
      <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
        {task.ref}
      </span>
      <span className="text-sm truncate flex-1 min-w-0">{task.title}</span>

      {!compact && task.dependsOn && task.dependsOn.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0"
          title={`Depends on ${task.dependsOn.join(", ")}`}
        >
          <GitBranch className="h-3 w-3" />
          {task.dependsOn.length}
        </span>
      )}

      {!compact && totalSub > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <ListTodo className="h-3 w-3" />
          {doneCount}/{totalSub}
        </span>
      )}

      {typeof task.confidence === "number" && (
        <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-ai shrink-0">
          <Sparkles className="h-2.5 w-2.5" />
          {Math.round(task.confidence * 100)}%
        </span>
      )}

      <ExecutorBadge kind={task.executor} />

      <span className="hidden md:inline text-[11px] text-muted-foreground truncate max-w-[140px] shrink-0">
        {task.assignee.name}
      </span>

      <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 text-right shrink-0">
        {formatRelative(task.activityAt)}
      </span>
    </button>
  );
}
