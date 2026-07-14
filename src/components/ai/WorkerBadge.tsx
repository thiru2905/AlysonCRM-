import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

type Status = "idle" | "working" | "waiting" | "error";

const STATUS: Record<Status, { label: string; dot: string; text: string }> = {
  idle: { label: "Idle", dot: "bg-muted-foreground/60", text: "text-muted-foreground" },
  working: { label: "Working", dot: "bg-ai", text: "text-ai" },
  waiting: { label: "Needs approval", dot: "bg-warning", text: "text-warning" },
  error: { label: "Error", dot: "bg-destructive", text: "text-destructive" },
};

export function WorkerBadge({
  name,
  status,
  compact,
}: {
  name: string;
  status: Status;
  compact?: boolean;
}) {
  const s = STATUS[status];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1",
        compact && "px-2 py-0.5",
      )}
    >
      <Bot className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs font-medium">{name}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, status === "working" && "animate-pulse")} />
      <span className={cn("text-mono text-[10px] uppercase tracking-wider", s.text)}>
        {s.label}
      </span>
    </div>
  );
}
