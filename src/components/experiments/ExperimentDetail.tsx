import type { Experiment } from "@/lib/experiments/data";
import {
  EXPERIMENT_KINDS,
  STATUS_TONE,
  formatValue,
  signedPct,
} from "@/lib/experiments/data";
import { KindIcon } from "./KindIcon";
import { AllocationBar } from "./AllocationBar";
import { ConfidenceStrip } from "./ConfidenceStrip";
import { cn } from "@/lib/utils";
import {
  Beaker,
  Briefcase,
  CheckSquare,
  Bot,
  Sparkles,
  BookOpen,
  Target,
  Trophy,
  Lightbulb,
} from "lucide-react";

export function ExperimentDetail({ experiment: x }: { experiment: Experiment }) {
  const status = STATUS_TONE[x.status];
  const winner = x.variants.find((v) => v.isWinner);
  const control = x.variants.find((v) => v.isControl) ?? x.variants[0];
  const primary = x.metrics.find((m) => m.id === x.primaryMetricId);
  const totalSamples = x.variants.reduce((s, v) => s + v.samples, 0);
  const powerPct = Math.min(
    1,
    x.variants[0].samples / x.minSamplesPerVariant,
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <header className="p-5 border-b border-border/60">
        <div className="flex items-start gap-4">
          <KindIcon kind={x.kind} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-medium">{x.name}</h2>
              <span
                className={cn(
                  "text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border",
                  status.className,
                )}
              >
                {status.label}
              </span>
              <span className="text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                {EXPERIMENT_KINDS[x.kind].label}
              </span>
            </div>
            <div className="mt-2 text-sm leading-relaxed max-w-2xl">
              <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-2">
                Hypothesis
              </span>
              {x.hypothesis}
            </div>
            <div className="mt-2 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Owner {x.owner} · started {new Date(x.startedAt).toLocaleDateString()}
              {x.endedAt && ` · ended ${new Date(x.endedAt).toLocaleDateString()}`}
            </div>
          </div>
        </div>
      </header>

      {/* Headline strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-border/60">
        <Headline
          label="Primary lift"
          value={signedPct(x.lift)}
          tone={x.lift > 0 ? "up" : x.lift < 0 ? "down" : "flat"}
          hint={primary?.name}
        />
        <div>
          <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Confidence
          </div>
          <div className="mt-1.5">
            <ConfidenceStrip
              confidence={x.confidence}
              significance={x.significance}
            />
          </div>
          <div className="text-mono text-[10px] text-muted-foreground mt-1">
            p ≈ {x.significance.toFixed(3)}
          </div>
        </div>
        <Headline
          label="Samples"
          value={totalSamples.toLocaleString()}
          hint={`min ${x.minSamplesPerVariant.toLocaleString()} / variant`}
        />
        <div>
          <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Statistical power
          </div>
          <div className="text-display text-xl leading-none mt-1">
            {Math.round(powerPct * 100)}%
          </div>
          <div className="mt-2 h-1 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full bg-foreground/70"
              style={{ width: `${powerPct * 100}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-5 p-5">
        {/* Variants */}
        <Panel title="Variants" icon={Beaker}>
          <div className="space-y-3">
            <AllocationBar
              parts={x.variants.map((v) => ({
                id: v.id,
                label: v.name,
                value: v.allocation,
                winner: v.isWinner,
              }))}
            />
            <ul className="space-y-2">
              {x.variants.map((v) => (
                <li
                  key={v.id}
                  className={cn(
                    "rounded-lg border p-3 transition",
                    v.isWinner
                      ? "border-ai/60 bg-ai-soft/40"
                      : "border-border/60 bg-background",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                        v.isControl
                          ? "border-border text-muted-foreground"
                          : "border-border text-foreground",
                      )}
                    >
                      {v.label}
                      {v.isControl && " · control"}
                    </span>
                    <span className="text-sm font-medium">{v.name}</span>
                    {v.isWinner && (
                      <Trophy className="h-3.5 w-3.5 text-ai ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {v.description}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-mono text-[10px]">
                    <MiniStat
                      label="Alloc"
                      value={`${Math.round(v.allocation * 100)}%`}
                    />
                    <MiniStat
                      label="Samples"
                      value={v.samples.toLocaleString()}
                    />
                    <MiniStat
                      label="Rate"
                      value={`${(v.conversionRate * 100).toFixed(1)}%`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* Metrics */}
        <Panel title="Success metrics" icon={Target}>
          <ul className="space-y-2.5">
            {x.metrics.map((m) => {
              const delta = (m.observed - m.baseline) / (m.baseline || 1);
              const isPrimary = m.id === x.primaryMetricId;
              return (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-lg border p-3 flex items-center gap-3",
                    isPrimary
                      ? "border-border-strong bg-background"
                      : "border-border/60 bg-background",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.name}</span>
                      <span
                        className={cn(
                          "text-mono text-[9px] uppercase tracking-wider px-1 py-0.5 rounded border",
                          m.kind === "primary" &&
                            "border-border text-foreground",
                          m.kind === "guardrail" &&
                            "border-border text-amber-500",
                          m.kind === "secondary" &&
                            "border-border text-muted-foreground",
                        )}
                      >
                        {m.kind}
                      </span>
                    </div>
                    <div className="text-mono text-[10px] text-muted-foreground mt-0.5">
                      baseline {formatValue(m.unit, m.baseline)} →{" "}
                      {formatValue(m.unit, m.observed)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-mono text-sm shrink-0",
                      delta > 0
                        ? "text-emerald-500"
                        : delta < 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {signedPct(delta)}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Winner + learning summary */}
        <Panel
          title="Winner & learning"
          icon={Lightbulb}
          className="md:col-span-2"
        >
          <div className="grid md:grid-cols-[minmax(0,240px)_1fr] gap-4">
            <div className="rounded-lg border border-border/60 p-3 bg-background">
              <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Recommended winner
              </div>
              {winner ? (
                <>
                  <div className="text-display text-lg mt-1">{winner.name}</div>
                  <div className="text-mono text-[10px] text-muted-foreground mt-1">
                    beats {control.name} by {signedPct(x.lift)} on{" "}
                    {primary?.name}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground mt-2">
                  No winner declared yet.
                </div>
              )}
            </div>
            <div className="rounded-lg border border-ai/40 bg-ai-soft/30 p-3">
              <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-wider text-ai">
                <Sparkles className="h-3 w-3" /> Alyson · learning summary
              </div>
              <p className="text-sm mt-2 leading-relaxed">{x.learningSummary}</p>
            </div>
          </div>
        </Panel>

        {/* Links back into the graph */}
        <Panel
          title="Connected"
          icon={Bot}
          className="md:col-span-2"
        >
          <div className="grid md:grid-cols-5 gap-3">
            <LinkList
              icon={Briefcase}
              title="Projects"
              items={x.links.projects.map((p) => ({ id: p.id, label: p.label }))}
            />
            <LinkList
              icon={CheckSquare}
              title="Tasks"
              items={x.links.tasks.map((t) => ({ id: t.id, label: t.label }))}
            />
            <LinkList
              icon={Bot}
              title="Workers"
              items={x.links.workers.map((w) => ({ id: w.id, label: w.name }))}
            />
            <LinkList
              icon={Sparkles}
              title="Predictions"
              items={x.links.predictions.map((p) => ({
                id: p.id,
                label: p.statement,
                meta: `${Math.round(p.confidence * 100)}%`,
              }))}
            />
            <LinkList
              icon={BookOpen}
              title="Knowledge"
              items={x.links.knowledge.map((k) => ({
                id: k.id,
                label: k.title,
                meta: k.source,
              }))}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Headline({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "flat";
  hint?: string;
}) {
  return (
    <div>
      <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-display text-xl leading-none mt-1",
          tone === "up" && "text-emerald-500",
          tone === "down" && "text-destructive",
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="text-mono text-[10px] text-muted-foreground mt-1 truncate">
          {hint}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof Beaker;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-background p-4",
        className,
      )}
    >
      <header className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </header>
      {children}
    </section>
  );
}

function LinkList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Beaker;
  title: string;
  items: { id: string; label: string; meta?: string }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className="h-3 w-3" />
        {title}
        <span className="text-muted-foreground">· {items.length}</span>
      </div>
      <ul className="space-y-1">
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground">—</li>
        )}
        {items.map((i) => (
          <li
            key={i.id}
            className="text-sm py-1 border-b border-border/40 last:border-0 flex items-center gap-2"
          >
            <span className="flex-1 truncate">{i.label}</span>
            {i.meta && (
              <span className="text-mono text-[10px] text-muted-foreground shrink-0">
                {i.meta}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
