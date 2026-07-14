import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/shell/Page";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { WorkerDetail } from "@/components/workers/WorkerDetail";
import { CollaborationGraph } from "@/components/workers/CollaborationGraph";
import { WorkerIcon } from "@/components/workers/WorkerIcon";
import {
  WORKERS,
  WORKER_TYPES,
  getWorker,
  type WorkerType,
} from "@/lib/workers/data";
import { cn } from "@/lib/utils";
import { Grid3x3, Network, Users } from "lucide-react";

export const Route = createFileRoute("/workers")({
  component: WorkersView,
});

type View = "roster" | "graph";

const TYPE_ORDER: WorkerType[] = [
  "human",
  "ai_agent",
  "browser",
  "api",
  "automation",
  "tool",
];

function WorkersView() {
  const [view, setView] = useState<View>("roster");
  const [typeFilter, setTypeFilter] = useState<WorkerType | "all">("all");
  const [focusId, setFocusId] = useState<string>("w_atlas");

  const filtered = useMemo(
    () =>
      typeFilter === "all"
        ? WORKERS
        : WORKERS.filter((w) => w.type === typeFilter),
    [typeFilter],
  );

  const focused = getWorker(focusId) ?? WORKERS[0];

  const counts = useMemo(() => {
    const map = new Map<WorkerType, number>();
    for (const w of WORKERS) map.set(w.type, (map.get(w.type) ?? 0) + 1);
    return map;
  }, []);

  return (
    <PageContainer className="max-w-[1280px]">
      {/* Header */}
      <header className="pb-6 border-b border-border/60">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
              Workers
            </div>
            <h1 className="text-display text-2xl md:text-[28px] leading-tight">
              Your digital workforce.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Every worker executes tasks — humans, AI agents, browser sessions,
              APIs, automations, and tools. They collaborate, delegate to each
              other, and escalate to humans when the stakes cross a threshold.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Stat label="Workers" value={WORKERS.length.toString()} />
            <Stat
              label="Active"
              value={WORKERS.filter((w) => w.status === "active").length.toString()}
            />
            <Stat
              label="Learning"
              value={WORKERS.filter((w) => w.status === "learning").length.toString()}
            />
          </div>
        </div>

        {/* Type strip */}
        <div className="mt-5 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-md border text-xs transition",
              typeFilter === "all"
                ? "border-border-strong bg-accent"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <Users className="h-3 w-3" />
            <span>All</span>
            <span className="text-mono text-[10px] text-muted-foreground">
              {WORKERS.length}
            </span>
          </button>
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-md border text-xs transition",
                typeFilter === t
                  ? "border-border-strong bg-accent"
                  : "border-border bg-card hover:bg-accent",
              )}
              title={WORKER_TYPES[t].description}
            >
              <WorkerIcon type={t} size="xs" />
              <span>{WORKER_TYPES[t].label}</span>
              <span className="text-mono text-[10px] text-muted-foreground">
                {counts.get(t) ?? 0}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-0 z-10 -mx-5 md:-mx-8 mt-2 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="px-5 md:px-8 flex items-center gap-0.5 overflow-x-auto">
          {(
            [
              { id: "roster" as const, label: "Roster", icon: Grid3x3 },
              { id: "graph" as const, label: "Collaboration", icon: Network },
            ]
          ).map((v) => {
            const Icon = v.icon;
            const on = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 h-11 px-3 text-sm transition whitespace-nowrap",
                  on
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
                {on && (
                  <span className="absolute left-2 right-2 -bottom-px h-px bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="pt-6">
        {view === "roster" && (
          <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-5">
            <aside className="space-y-2.5">
              <div className="flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Roster</span>
                <span>{filtered.length}</span>
              </div>
              {filtered.map((w) => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  active={w.id === focusId}
                  onOpen={setFocusId}
                />
              ))}
            </aside>
            <div>
              <WorkerDetail worker={focused} onOpen={setFocusId} />
            </div>
          </div>
        )}

        {view === "graph" && (
          <div className="grid lg:grid-cols-[1fr_minmax(0,380px)] gap-5">
            <div className="space-y-3">
              <CollaborationGraph focusId={focusId} onFocus={setFocusId} />
              <p className="text-xs text-muted-foreground text-center">
                {WORKERS.length} workers · workers can delegate work to other
                workers and escalate to humans
              </p>
            </div>
            <div>
              <WorkerDetail worker={focused} onOpen={setFocusId} />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-1.5 min-w-16 text-center">
      <div className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-display text-sm leading-none mt-0.5">{value}</div>
    </div>
  );
}
