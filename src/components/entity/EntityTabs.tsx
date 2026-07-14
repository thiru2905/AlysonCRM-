import { cn } from "@/lib/utils";
import type { EntitySection, Entity } from "@/lib/entities/types";
import {
  Activity,
  BookOpen,
  Clock,
  File,
  FlaskConical,
  FolderKanban,
  Gauge,
  History,
  Link2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface TabDef {
  id: EntitySection;
  label: string;
  icon: LucideIcon;
  count?: (e: Entity) => number | undefined;
}

const TABS: TabDef[] = [
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "timeline", label: "Timeline", icon: Clock, count: (e) => e.timeline.length },
  { id: "relationships", label: "Relationships", icon: Link2, count: (e) => e.relationships.length },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, count: (e) => e.knowledge.length },
  { id: "scores", label: "Scores", icon: Gauge, count: (e) => e.scores.length },
  { id: "predictions", label: "Predictions", icon: Sparkles, count: (e) => e.predictions.length },
  { id: "files", label: "Files", icon: File, count: (e) => e.files.length },
  { id: "activity", label: "Activity", icon: Activity, count: (e) => e.activity.length },
  { id: "history", label: "History", icon: History, count: (e) => e.history.length },
  { id: "work", label: "Work", icon: FolderKanban, count: (e) => e.projects.length + e.tasks.length },
  { id: "experiments", label: "Experiments", icon: FlaskConical, count: (e) => e.experiments.length },
];


export function EntityTabs({
  entity,
  active,
  onChange,
}: {
  entity: Entity;
  active: EntitySection;
  onChange: (s: EntitySection) => void;
}) {
  return (
    <div className="border-b border-border/60 -mx-5 md:-mx-8 px-5 md:px-8 sticky top-0 z-10 bg-background/85 backdrop-blur-xl">
      <div
        role="tablist"
        aria-label="Entity sections"
        className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const count = tab.count?.(entity);
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "group relative flex items-center gap-1.5 h-10 px-3 text-xs whitespace-nowrap transition",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive && "text-ai")} />
              <span>{tab.label}</span>
              {typeof count === "number" && count > 0 && (
                <span
                  className={cn(
                    "text-mono text-[10px] px-1 h-4 min-w-4 rounded grid place-items-center",
                    isActive ? "bg-accent text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {count}
                </span>
              )}
              <span
                className={cn(
                  "absolute left-2 right-2 -bottom-px h-[2px] rounded-full transition",
                  isActive ? "ai-gradient-bg" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
