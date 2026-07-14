import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/shell/Page";
import { IfYouFollowPanel } from "@/components/predictions/IfYouFollowPanel";
import { PredictionCard } from "@/components/predictions/PredictionCard";
import { PredictionDetail } from "@/components/predictions/PredictionDetail";
import { PredictionIcon } from "@/components/predictions/PredictionIcon";
import {
  KIND_META,
  PREDICTIONS,
  getPrediction,
  type PredictionKind,
} from "@/lib/predictions/data";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/predictions")({
  component: PredictionsView,
});

const KIND_ORDER: PredictionKind[] = [
  "revenue",
  "probability",
  "roi",
  "time",
  "risk",
  "conversion",
  "churn",
  "retention",
];

function PredictionsView() {
  const [kind, setKind] = useState<PredictionKind | "all">("all");
  const [focusId, setFocusId] = useState<string>("pr_nw_renewal");

  const filtered = useMemo(
    () => (kind === "all" ? PREDICTIONS : PREDICTIONS.filter((p) => p.kind === kind)),
    [kind],
  );

  const focused = getPrediction(focusId) ?? filtered[0] ?? PREDICTIONS[0];

  const counts = useMemo(() => {
    const m = new Map<PredictionKind, number>();
    for (const p of PREDICTIONS) m.set(p.kind, (m.get(p.kind) ?? 0) + 1);
    return m;
  }, []);

  return (
    <PageContainer className="max-w-[1280px]">
      <header className="pb-6 border-b border-border/60">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
              Prediction Center
            </div>
            <h1 className="text-display text-2xl md:text-[28px] leading-tight">
              Forward-looking, not backward-looking.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Every object on Alyson gets predictions: revenue, probability,
              ROI, time, risk, and the recommended next action. Every number
              ships with the evidence that produced it and the counterfactuals
              that would move it.
            </p>
          </div>
        </div>
      </header>

      {/* Portfolio forecast lives at the top so this reads like a briefing */}
      <div className="pt-6">
        <IfYouFollowPanel />
      </div>

      {/* Kind strip */}
      <div className="mt-8 flex items-center gap-1.5 flex-wrap">
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
          <span>All</span>
          <span className="text-mono text-[10px] text-muted-foreground">
            {PREDICTIONS.length}
          </span>
        </button>
        {KIND_ORDER.map((k) => {
          const n = counts.get(k) ?? 0;
          if (n === 0) return null;
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-md border text-xs transition",
                kind === k
                  ? "border-border-strong bg-accent"
                  : "border-border bg-card hover:bg-accent",
              )}
              title={KIND_META[k].description}
            >
              <PredictionIcon kind={k} size="xs" />
              <span>{KIND_META[k].label}</span>
              <span className="text-mono text-[10px] text-muted-foreground">
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-5 grid lg:grid-cols-[minmax(0,380px)_1fr] gap-5">
        <aside className="space-y-2.5">
          <div className="flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Live predictions</span>
            <span>{filtered.length}</span>
          </div>
          {filtered.map((p) => (
            <PredictionCard
              key={p.id}
              prediction={p}
              active={p.id === focused.id}
              onOpen={setFocusId}
            />
          ))}
        </aside>
        <div>{focused && <PredictionDetail prediction={focused} />}</div>
      </div>
    </PageContainer>
  );
}
