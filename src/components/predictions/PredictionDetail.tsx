import type { Prediction } from "@/lib/predictions/data";
import { KIND_META, formatValue, signedPct } from "@/lib/predictions/data";
import { PredictionIcon } from "./PredictionIcon";
import { UncertaintyBand } from "./UncertaintyBand";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Beaker,
  Bot,
  Briefcase,
  CheckSquare,
  CircleAlert,
  DollarSign,
  GitFork,
  Lightbulb,
  Sparkles,
} from "lucide-react";

export function PredictionDetail({ prediction: p }: { prediction: Prediction }) {
  const delta =
    typeof p.baseline === "number"
      ? (p.value - p.baseline) / (p.baseline || 1)
      : 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <header className="p-5 border-b border-border/60 flex items-start gap-4">
        <PredictionIcon kind={p.kind} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {p.subject.kind} · {p.subject.label} · updated{" "}
            {new Date(p.updatedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
          <h2 className="text-lg font-medium mt-1 leading-snug">{p.statement}</h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">
              {KIND_META[p.kind].label}
            </span>
            <span className="text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">
              {p.horizonDays}-day horizon
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-display text-3xl leading-none">
            {formatValue(p.unit, p.value)}
          </div>
          {typeof p.baseline === "number" && (
            <div
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-mono text-xs",
                p.direction === "up" && "text-emerald-500",
                p.direction === "down" && "text-destructive",
              )}
            >
              {p.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : p.direction === "down" ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              {signedPct(delta)} vs baseline
            </div>
          )}
        </div>
      </header>

      {/* Headline strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-border/60">
        <Metric
          label="Confidence"
          value={`${Math.round(p.confidence * 100)}%`}
          bar={p.confidence}
          barTone="ai"
        />
        <Metric
          label="Risk"
          value={`${Math.round(p.risk * 100)}%`}
          bar={p.risk}
          barTone={p.risk >= 0.5 ? "danger" : p.risk >= 0.25 ? "warn" : "ok"}
        />
        {typeof p.expectedRoi === "number" ? (
          <Metric
            label="Expected ROI"
            value={`${p.expectedRoi.toFixed(1)}×`}
            hint="return on effort"
          />
        ) : typeof p.expectedTimeSavedHours === "number" ? (
          <Metric
            label="Time saved"
            value={`${p.expectedTimeSavedHours}h`}
            hint={`over ${p.horizonDays}d`}
          />
        ) : (
          <Metric label="Horizon" value={`${p.horizonDays} days`} />
        )}
        <Metric
          label="Opportunity cost"
          value={`$${(p.opportunityCostUsd / 1000).toFixed(0)}k`}
          hint="if we do nothing"
        />
      </section>

      {/* Uncertainty band */}
      <section className="p-5 border-b border-border/60">
        <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
          Uncertainty band · P10 → point → P90
        </div>
        <UncertaintyBand
          low={p.range.low}
          value={p.value}
          high={p.range.high}
          format={(n) => formatValue(p.unit, n)}
        />
      </section>

      <div className="grid md:grid-cols-2 gap-5 p-5">
        {/* Why */}
        <Panel title="Why this prediction" icon={Lightbulb} className="md:col-span-2">
          <p className="text-sm leading-relaxed">{p.why}</p>
          <ul className="mt-4 space-y-2">
            {p.evidence.map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <div className="w-8 shrink-0 text-mono text-[10px] text-muted-foreground text-right">
                  {Math.round(e.weight * 100)}%
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden">
                  <div
                    className="h-full bg-ai"
                    style={{ width: `${e.weight * 100}%` }}
                  />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="truncate">{e.label}</div>
                  <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {e.source}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Counterfactuals */}
        <Panel title="Counterfactuals" icon={GitFork}>
          <ul className="space-y-2.5">
            {p.counterfactuals.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border/60 bg-background p-3"
              >
                <div className="text-sm">
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-2">
                    If
                  </span>
                  {c.ifText}
                </div>
                <div className="text-sm mt-1">
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-2">
                    Then
                  </span>
                  {c.thenText}
                </div>
                <div
                  className={cn(
                    "mt-2 text-mono text-[10px] inline-flex items-center gap-1",
                    c.tone === "up" ? "text-emerald-500" : "text-destructive",
                  )}
                >
                  {c.tone === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {c.deltaLabel}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Recommended next action */}
        <Panel title="Recommended next action" icon={Sparkles}>
          <div className="rounded-lg border border-ai/40 bg-ai-soft/30 p-3">
            <div className="text-sm font-medium">{p.recommendedNextAction.title}</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {p.recommendedNextAction.detail}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-mono text-[10px]">
              <MiniStat
                label="Lift"
                value={signedPct(p.recommendedNextAction.expectedLift)}
              />
              <MiniStat
                label="Effort"
                value={`${p.recommendedNextAction.effortMinutes}m`}
              />
              <MiniStat
                label="Cost"
                value={
                  p.recommendedNextAction.costUsd < 0.01
                    ? "free"
                    : `$${p.recommendedNextAction.costUsd.toFixed(2)}`
                }
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>
                by {p.recommendedNextAction.worker.name} ·{" "}
                {p.recommendedNextAction.worker.type}
              </span>
              <span
                className={cn(
                  p.recommendedNextAction.needsApproval
                    ? "text-warning"
                    : "text-emerald-500",
                )}
              >
                {p.recommendedNextAction.needsApproval
                  ? "needs approval"
                  : "auto-run"}
              </span>
            </div>
          </div>
        </Panel>

        {/* Opportunity + risk framing */}
        <Panel title="If we do nothing" icon={CircleAlert} className="md:col-span-2">
          <div className="grid md:grid-cols-3 gap-3">
            <RiskFrame
              icon={DollarSign}
              label="Opportunity cost"
              value={`$${p.opportunityCostUsd.toLocaleString()}`}
              tone="warn"
            />
            <RiskFrame
              icon={CircleAlert}
              label="Downside risk"
              value={`${Math.round(p.risk * 100)}%`}
              tone={p.risk >= 0.5 ? "danger" : "warn"}
            />
            <RiskFrame
              icon={Sparkles}
              label="Confidence"
              value={`${Math.round(p.confidence * 100)}%`}
              tone="ai"
            />
          </div>
        </Panel>

        {/* Links */}
        <Panel title="Connected" icon={Bot} className="md:col-span-2">
          <div className="grid md:grid-cols-5 gap-3">
            <LinkList
              icon={Briefcase}
              title="Projects"
              items={p.links.projects}
            />
            <LinkList icon={CheckSquare} title="Tasks" items={p.links.tasks} />
            <LinkList icon={Bot} title="Workers" items={p.links.workers} />
            <LinkList
              icon={Beaker}
              title="Experiments"
              items={p.links.experiments}
            />
            <LinkList
              icon={BookOpen}
              title="Knowledge"
              items={p.links.knowledge}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  bar,
  barTone,
}: {
  label: string;
  value: string;
  hint?: string;
  bar?: number;
  barTone?: "ai" | "ok" | "warn" | "danger";
}) {
  const barClass =
    barTone === "danger"
      ? "bg-destructive"
      : barTone === "warn"
        ? "bg-amber-500"
        : barTone === "ok"
          ? "bg-emerald-500"
          : "bg-ai";
  return (
    <div>
      <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-display text-xl leading-none mt-1">{value}</div>
      {typeof bar === "number" && (
        <div className="mt-2 h-1 rounded-full bg-accent overflow-hidden">
          <div className={cn("h-full", barClass)} style={{ width: `${bar * 100}%` }} />
        </div>
      )}
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
  icon: typeof Bot;
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

function RiskFrame({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bot;
  label: string;
  value: string;
  tone: "warn" | "danger" | "ai";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "danger" && "border-destructive/40 bg-destructive/5",
        tone === "warn" && "border-amber-500/30 bg-amber-500/5",
        tone === "ai" && "border-ai/40 bg-ai-soft/30",
      )}
    >
      <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-display text-lg leading-none mt-1">{value}</div>
    </div>
  );
}

function LinkList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Bot;
  title: string;
  items: { id: string; label: string }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className="h-3 w-3" />
        {title}
        <span>· {items.length}</span>
      </div>
      <ul className="space-y-1">
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground">—</li>
        )}
        {items.map((i) => (
          <li
            key={i.id}
            className="text-sm py-1 border-b border-border/40 last:border-0 truncate"
          >
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
