import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/lib/projects/data";
import {
  Circle,
  CircleDot,
  CircleDashed,
  CircleCheck,
  CircleAlert,
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
} from "lucide-react";

const STATUS: Record<
  TaskStatus,
  { label: string; icon: typeof Circle; color: string }
> = {
  todo:    { label: "Todo",     icon: Circle,        color: "text-muted-foreground" },
  doing:   { label: "Doing",    icon: CircleDot,     color: "text-sky-400" },
  review:  { label: "Review",   icon: CircleDashed,  color: "text-violet-400" },
  blocked: { label: "Blocked",  icon: CircleAlert,   color: "text-destructive" },
  done:    { label: "Done",     icon: CircleCheck,   color: "text-emerald-400" },
};

export function StatusIcon({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <Icon
      className={cn("h-3.5 w-3.5 shrink-0", s.color, className)}
      aria-label={s.label}
    />
  );
}

const PRIORITY: Record<
  Priority,
  { label: string; icon: typeof ChevronUp; color: string }
> = {
  urgent: { label: "Urgent", icon: ChevronsUp, color: "text-destructive" },
  high:   { label: "High",   icon: ChevronUp,  color: "text-amber-400" },
  med:    { label: "Med",    icon: Equal,      color: "text-muted-foreground" },
  low:    { label: "Low",    icon: ChevronDown, color: "text-muted-foreground/60" },
};

export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const p = PRIORITY[priority];
  const Icon = p.icon;
  return (
    <Icon
      className={cn("h-3.5 w-3.5 shrink-0", p.color, className)}
      aria-label={p.label}
    />
  );
}
