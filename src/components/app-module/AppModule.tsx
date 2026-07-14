import { useState, type ReactNode } from "react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { cn } from "@/lib/utils";
import { notifyDone, notifySoon } from "@/lib/actions";
import { ArrowRight, Bot, Chrome, FlaskConical, Sparkles, User, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ExecutorGlyph = "human" | "ai" | "browser" | "api";

export interface AppBriefStat {
  label: string;
  value: string;
  hint: string;
}

export interface AppRow {
  id: string;
  ref: string;
  primary: string;
  secondary: string;
  nextAction: string;
  nextActionKind: ExecutorGlyph;
  metrics: { label: string; value: string; tone?: "success" | "warning" | "danger" | "muted" }[];
  heat?: "hot" | "warm" | "cold";
  rationale: string;
  owner: string;
  meta?: string;
}

export interface AppWorker {
  id: string;
  name: string;
  role: string;
  kind: ExecutorGlyph;
  workingOn: string;
  primaryMetric: string;
  secondaryMetric: string;
}

export interface AppExperiment {
  id: string;
  name: string;
  hypothesis: string;
  lift: string;
  confidence: number;
  arm: string;
  appliesTo: string;
}

export interface AppFilter {
  id: string;
  label: string;
  count?: number;
}

export interface AppModuleProps {
  eyebrow: string;
  title: string;
  description: string;
  metric: { label: string; value: string; hint?: string };
  brief: {
    confidence: number;
    stats: AppBriefStat[];
    recommendation: string;
  };
  filters: AppFilter[];
  rows: AppRow[];
  filterRow: (row: AppRow, filter: string) => boolean;
  columnHeaders: [string, string, string, string];
  workersLabel: string;
  workers: AppWorker[];
  experiments: AppExperiment[];
  sidebarExtras?: ReactNode;
}

const HEAT_DOT = {
  hot: "bg-destructive",
  warm: "bg-warning",
  cold: "bg-muted-foreground/50",
} as const;

const TONE_TEXT = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  muted: "text-muted-foreground",
} as const;

function KindGlyph({ kind, className }: { kind: ExecutorGlyph; className?: string }) {
  const Icon: LucideIcon =
    kind === "ai" ? Bot : kind === "browser" ? Chrome : kind === "api" ? Zap : User;
  return <Icon className={cn("h-3.5 w-3.5", className)} />;
}

export function AppModule(props: AppModuleProps) {
  const [filter, setFilter] = useState<string>("all");
  const [focusId, setFocusId] = useState<string>(props.rows[0]?.id ?? "");

  const rows = filter === "all" ? props.rows : props.rows.filter((r) => props.filterRow(r, filter));
  const focus = props.rows.find((r) => r.id === focusId) ?? props.rows[0];

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow={props.eyebrow}
        title={props.title}
        description={props.description}
        actions={
          <div className="flex items-center gap-2">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {props.metric.label}
            </div>
            <div className="text-display text-lg">{props.metric.value}</div>
            {props.metric.hint && (
              <div className="text-xs text-muted-foreground">{props.metric.hint}</div>
            )}
          </div>
        }
      />

      {/* AI briefing */}
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Alyson · this hour
          </span>
          <span className="ml-auto text-mono text-[10px] text-muted-foreground">
            confidence {props.brief.confidence.toFixed(2)}
          </span>
        </div>
        <div className="grid md:grid-cols-3 divide-x divide-border">
          {props.brief.stats.map((s) => (
            <div key={s.label} className="p-5">
              <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </div>
              <div className="text-display text-2xl mt-1 tabular-nums font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Recommended:</span>{" "}
            <span className="text-foreground">{props.brief.recommendation}</span>
          </p>
          <button
            type="button"
            onClick={() => notifyDone("Approved all", props.brief.recommendation)}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition flex items-center gap-1.5 shrink-0"
          >
            Approve all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto">
        <FilterChip
          label="All"
          count={props.rows.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {props.filters.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            count={f.count}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      {/* Body: rows + focus */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4">
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border/60 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <div>{props.columnHeaders[0]}</div>
            <div className="text-right">{props.columnHeaders[1]}</div>
            <div className="text-right">{props.columnHeaders[2]}</div>
            <div className="text-right">{props.columnHeaders[3]}</div>
          </div>
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => setFocusId(row.id)}
              className={cn(
                "w-full text-left grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border/40 hover:bg-accent/40 transition-colors",
                focus?.id === row.id && "bg-accent/60",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {row.heat && (
                    <span className={cn("h-1.5 w-1.5 rounded-full", HEAT_DOT[row.heat])} />
                  )}
                  <span className="text-sm truncate">{row.primary}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    · {row.secondary}
                  </span>
                  {row.meta && (
                    <span className="ml-auto text-mono text-[10px] text-muted-foreground shrink-0">
                      {row.meta}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 bg-[var(--color-ai-soft)]/60 text-[var(--color-ai)]">
                    <KindGlyph kind={row.nextActionKind} />
                    <span className="text-mono text-[10px] uppercase tracking-wider">
                      {row.nextActionKind}
                    </span>
                  </span>
                  <span className="text-foreground truncate">{row.nextAction}</span>
                </div>
              </div>
              {row.metrics.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-right text-sm tabular-nums self-center",
                    m.tone && TONE_TEXT[m.tone],
                  )}
                >
                  {m.value}
                </div>
              ))}
            </button>
          ))}
        </div>

        {/* Focus panel */}
        {focus && (
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border/60">
              <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {focus.ref}
              </div>
              <div className="mt-1 text-display text-lg leading-tight">{focus.primary}</div>
              <div className="text-xs text-muted-foreground">{focus.secondary}</div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
              {focus.metrics.slice(0, 3).map((m, i) => (
                <div key={i} className="p-3 text-center">
                  <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {m.label}
                  </div>
                  <div
                    className={cn(
                      "text-display text-sm mt-1 tabular-nums",
                      m.tone && TONE_TEXT[m.tone],
                    )}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-ai)]" />
                <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Alyson recommends
                </span>
              </div>
              <p className="mt-2 text-sm">{focus.nextAction}</p>
              <p className="mt-2 text-xs text-muted-foreground italic">{focus.rationale}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => notifyDone("Approved", focus.nextAction)}
                  className="text-mono text-[11px] px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1.5"
                >
                  Approve <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => notifySoon("Modify", focus.nextAction)}
                  className="text-mono text-[11px] px-3 py-1.5 rounded-md border border-border hover:bg-accent"
                >
                  Modify
                </button>
                <span className="ml-auto text-mono text-[10px] text-muted-foreground flex items-center gap-1">
                  <KindGlyph kind={focus.nextActionKind} /> {focus.owner}
                </span>
              </div>
            </div>

            {props.sidebarExtras && (
              <div className="p-4 border-b border-border/60">{props.sidebarExtras}</div>
            )}
          </div>
        )}
      </div>

      {/* Workers + experiments */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {props.workersLabel}
            </span>
          </div>
          <ul>
            {props.workers.map((w) => (
              <li
                key={w.id}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-border/40 last:border-b-0 items-center"
              >
                <KindGlyph kind={w.kind} className="text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-sm truncate">
                    {w.name} <span className="text-xs text-muted-foreground">· {w.role}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Working on {w.workingOn}
                  </div>
                </div>
                <div className="text-mono text-xs tabular-nums text-muted-foreground">
                  {w.primaryMetric}
                </div>
                <div className="text-mono text-xs tabular-nums">{w.secondaryMetric}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Experiments optimizing outcomes
            </span>
          </div>
          <ul>
            {props.experiments.map((x) => (
              <li
                key={x.id}
                className="px-4 py-3 border-b border-border/40 last:border-b-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{x.name}</span>
                  <span className="ml-auto text-mono text-sm text-success tabular-nums">
                    {x.lift}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{x.hypothesis}</p>
                <div className="mt-1.5 flex items-center gap-2 text-mono text-[10px] text-muted-foreground">
                  <span>arm · {x.arm}</span>
                  <span>·</span>
                  <span>conf {x.confidence.toFixed(2)}</span>
                  <span className="ml-auto">{x.appliesTo}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors",
        active ? "border-border-strong bg-accent" : "border-border/60 hover:bg-accent/60",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className="text-mono text-[10px] text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}
