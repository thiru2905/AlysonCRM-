import type { PredictionKind } from "@/lib/predictions/data";
import {
  DollarSign,
  Percent,
  TrendingUp,
  Clock,
  ShieldAlert,
  Target,
  UserMinus,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<PredictionKind, typeof DollarSign> = {
  revenue: DollarSign,
  probability: Percent,
  roi: TrendingUp,
  time: Clock,
  risk: ShieldAlert,
  conversion: Target,
  churn: UserMinus,
  retention: UserCheck,
};

export function PredictionIcon({
  kind,
  size = "sm",
  className,
}: {
  kind: PredictionKind;
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
        "inline-flex items-center justify-center border border-border bg-ai-soft text-ai",
        box,
        className,
      )}
    >
      <Icon className={icon} />
    </span>
  );
}
