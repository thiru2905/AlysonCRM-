import { Bot, Globe, Plug, Workflow, Wrench, User } from "lucide-react";
import type { WorkerType } from "@/lib/workers/data";
import { cn } from "@/lib/utils";

const ICONS: Record<WorkerType, typeof Bot> = {
  human: User,
  ai_agent: Bot,
  browser: Globe,
  api: Plug,
  automation: Workflow,
  tool: Wrench,
};

const TONES: Record<WorkerType, string> = {
  human: "text-foreground bg-accent",
  ai_agent: "text-ai bg-ai-soft",
  browser: "text-foreground bg-accent",
  api: "text-foreground bg-accent",
  automation: "text-foreground bg-accent",
  tool: "text-foreground bg-accent",
};

export function WorkerIcon({
  type,
  size = "md",
  className,
}: {
  type: WorkerType;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = ICONS[type];
  const box = {
    xs: "h-5 w-5 rounded-[5px]",
    sm: "h-6 w-6 rounded-md",
    md: "h-8 w-8 rounded-md",
    lg: "h-10 w-10 rounded-lg",
  }[size];
  const icon = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border border-border",
        box,
        TONES[type],
        className,
      )}
    >
      <Icon className={icon} />
    </span>
  );
}
