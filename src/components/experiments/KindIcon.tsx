import type { ExperimentKind } from "@/lib/experiments/data";
import {
  MessageSquare,
  Cpu,
  Users,
  Bot,
  ListOrdered,
  Clock,
  DollarSign,
  Megaphone,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<ExperimentKind, typeof MessageSquare> = {
  prompt: MessageSquare,
  model: Cpu,
  audience: Users,
  worker: Bot,
  sequence: ListOrdered,
  timing: Clock,
  budget: DollarSign,
  campaign: Megaphone,
  workflow: Workflow,
};

export function KindIcon({
  kind,
  size = "sm",
  className,
}: {
  kind: ExperimentKind;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const Icon = ICONS[kind];
  const box = {
    xs: "h-5 w-5 rounded-[5px]",
    sm: "h-6 w-6 rounded-md",
    md: "h-8 w-8 rounded-md",
  }[size];
  const icon = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  }[size];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border border-border bg-accent text-foreground",
        box,
        className,
      )}
    >
      <Icon className={icon} />
    </span>
  );
}
