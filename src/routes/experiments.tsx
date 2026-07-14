import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/shell/Page";
import { ExperimentCard } from "@/components/experiments/ExperimentCard";
import { ExperimentDetail } from "@/components/experiments/ExperimentDetail";
import { KindIcon } from "@/components/experiments/KindIcon";
import {
  EXPERIMENTS,
  EXPERIMENT_KINDS,
  STATUS_TONE,
  getExperiment,
  type ExperimentKind,
  type ExperimentStatus,
} from "@/lib/experiments/data";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/experiments")({
  component: ExperimentsView,
});

const KIND_ORDER: ExperimentKind[] = [
  "prompt",
  "model",
  "audience",
  "worker",
  "sequence",
  "timing",
  "budget",
  "campaign",
  "workflow",
];

const STATUS_ORDER: ExperimentStatus[] = [
  "running",
  "paused",
  "shipped",
  "inconclusive",
  "rolled_back",
  "draft",
];

function ExperimentsView() {
  const [kind, setKind] = useState<ExperimentKind | "all">("all");
  const [status, setStatus] = useState<ExperimentStatus | "all">("all");
  const [focusId, setFocusId] = useState<string>("x_prompt_tone");

  const filtered = useMemo(
    () =>
      EXPERIMENTS.filter(
        (x) =>
          (kind === "all" || x.kind === kind) &&
          (status === "all" || x.status === status),
      ),
    [kind, status],
  );

  const focused = getExperiment(focusId) ?? filtered[0] ?? EXPERIMENTS[0];

  const kindCounts = useMemo(() => {
    const m = new Map<ExperimentKind, number>();
    for (const x of EXPERIMENTS) m.set(x.kind, (m.get(x.kind) ?? 0) + 1);
    return m;
  }, []);

  return (
    <PageContainer className="max-w-[1280px]">
      {/* Header */}
      <header className="pb-6 border-b border-border/60">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
              Experiments
            </div>
            <h1 className="text-display text-2xl md:text-[28px] leading-tight">
              Everything is experimentable.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Test prompts, models, audiences, workers, sequences, timing,
              budget, campaigns and whole workflows on real traffic. Alyson
              writes the hypothesis, runs the test, and connects every
              learning back to the projects, tasks, workers, predictions and
              knowledge that produced it.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Stat label="Total" value={EXPERIMENTS.length.toString()} />
            <Stat
              label="Running"
              value={EXPERIMENTS.filter((x) => x.status === "running")
                .length.toString()}
            />
            <Stat
              label="Shipped"
              value={EXPERIMENTS.filter((x) => x.status === "shipped")
                .length.toString()}
            />
          </div>
        </div>

        {/* Kind strip */}
        <div className="mt-5 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setKind("all")}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-md border text-xs transition",
              kind === "all"
                ? "border-border-strong bg-accent"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <LayoutGrid className="h-3 w-3" />
            <span>All kinds</span>
            <span className="text-mono text-[10px] text-muted-foreground">
              {EXPERIMENTS.length}
            </span>
          </button>
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-md border text-xs transition",
                kind === k
                  ? "border-border-strong bg-accent"
                  : "border-border bg-card hover:bg-accent",
              )}
              title={EXPERIMENT_KINDS[k].description}
            >
              <KindIcon kind={k} size="xs" />
              <span>{EXPERIMENT_KINDS[k].label}</span>
              <span className="text-mono text-[10px] text-muted-foreground">
                {kindCounts.get(k) ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Status strip */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatus("all")}
            className={cn(
              "inline-flex items-center h-6 px-2 rounded-md border text-[11px] transition",
              status === "all"
                ? "border-border-strong bg-accent"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            Any status
          </button>
          {STATUS_ORDER.map((s) => {
            const tone = STATUS_TONE[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "inline-flex items-center h-6 px-2 rounded-md border text-[11px] transition",
                  status === s
                    ? "border-border-strong bg-accent"
                    : "border-border bg-card hover:bg-accent",
                  tone.className,
                )}
              >
                {tone.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="pt-6 grid lg:grid-cols-[minmax(0,380px)_1fr] gap-5">
        <aside className="space-y-2.5">
          <div className="flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Experiments</span>
            <span>{filtered.length}</span>
          </div>
          {filtered.map((x) => (
            <ExperimentCard
              key={x.id}
              experiment={x}
              active={x.id === focused.id}
              onOpen={setFocusId}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No experiments match. Clear a filter.
            </p>
          )}
        </aside>
        <div>{focused && <ExperimentDetail experiment={focused} />}</div>
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
