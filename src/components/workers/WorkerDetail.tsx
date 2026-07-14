import {
  WORKER_TYPES,
  edgesFor,
  formatCost,
  formatCount,
  formatLatency,
  getWorker,
  type Worker,
} from "@/lib/workers/data";
import { WorkerIcon } from "./WorkerIcon";
import { StatusDot } from "./StatusDot";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Beaker,
  BookOpen,
  Briefcase,
  CircleCheck,
  GraduationCap,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react";

export function WorkerDetail({
  worker,
  onOpen,
}: {
  worker: Worker;
  onOpen?: (id: string) => void;
}) {
  const edges = edgesFor(worker.id);
  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <header className="p-5 border-b border-border/60 flex items-start gap-4">
        <WorkerIcon type={worker.type} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-medium">{worker.name}</h2>
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {worker.handle}
            </span>
            {worker.version && (
              <span className="text-mono text-[10px] text-muted-foreground">
                · {worker.version}
              </span>
            )}
            <span className="text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">
              {WORKER_TYPES[worker.type].label}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {worker.title}
          </div>
          <p className="text-sm mt-2 leading-relaxed max-w-2xl">{worker.bio}</p>
        </div>
        <StatusDot status={worker.status} withLabel />
      </header>

      {/* Performance strip */}
      <section className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-border/60">
        <Metric
          label="Success rate"
          value={`${Math.round(worker.performance.successRate * 100)}%`}
        >
          <Sparkline points={worker.performance.trend7d} width={100} height={22} />
        </Metric>
        <Metric label="Tasks" value={formatCount(worker.performance.tasksCompleted)} />
        <Metric label="Speed" value={formatLatency(worker.performance.avgLatencyMs)} />
        <Metric label="Cost / task" value={formatCost(worker.performance.costPerTaskUsd)} />
        <Metric
          label="Quality"
          value={`${Math.round(worker.performance.qualityScore * 100)}%`}
        />
      </section>

      {/* Two-column body */}
      <div className="grid md:grid-cols-2 gap-5 p-5">
        {/* Skills */}
        <Panel title="Skills" icon={GraduationCap}>
          <ul className="space-y-2.5">
            {worker.skills.map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-mono text-[10px] text-muted-foreground">
                    {Math.round(s.level * 100)}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-accent overflow-hidden">
                  <div
                    className="h-full bg-foreground/70"
                    style={{ width: `${s.level * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Authority */}
        <Panel title="Scope & authority" icon={Shield}>
          <ul className="space-y-1.5 text-sm">
            {worker.authorityScope.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <CircleCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Approval threshold
            </span>
            <span className="text-mono text-xs">
              {Math.round(worker.approvalThreshold * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Actions above this confidence run autonomously. Anything below is
            queued for a human.
          </p>
        </Panel>

        {/* Assignments */}
        <Panel
          title={`Assignments · ${worker.assignments.length}`}
          icon={Briefcase}
        >
          <ul className="space-y-1.5">
            {worker.assignments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 text-sm py-1.5 border-b border-border/40 last:border-0"
              >
                <span
                  className={cn(
                    "text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                    a.kind === "project"
                      ? "border-border bg-accent text-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {a.kind}
                </span>
                <span className="flex-1 truncate">{a.label}</span>
                {a.status && (
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {a.status.replace("_", " ")}
                  </span>
                )}
              </li>
            ))}
            {worker.assignments.length === 0 && (
              <li className="text-xs text-muted-foreground">No active assignments.</li>
            )}
          </ul>
        </Panel>

        {/* Collaboration */}
        <Panel title="Collaboration" icon={ArrowRight}>
          <ul className="space-y-1.5">
            {edges.map((e, i) => {
              const otherId = e.from === worker.id ? e.to : e.from;
              const other = getWorker(otherId);
              if (!other) return null;
              const outgoing = e.from === worker.id;
              return (
                <li key={i}>
                  <button
                    onClick={() => onOpen?.(other.id)}
                    className="w-full flex items-center gap-2 text-sm py-1.5 rounded hover:bg-accent/60 px-1 -mx-1 transition"
                  >
                    <span className="text-xs text-muted-foreground w-28 shrink-0">
                      {outgoing ? e.label : `${other.name} → ${e.label}`}
                    </span>
                    <WorkerIcon type={other.type} size="xs" />
                    <span className="flex-1 text-left truncate">{other.name}</span>
                    <span className="text-mono text-[10px] text-muted-foreground">
                      w={e.weight}
                    </span>
                  </button>
                </li>
              );
            })}
            {edges.length === 0 && (
              <li className="text-xs text-muted-foreground">
                No collaboration edges yet.
              </li>
            )}
          </ul>
        </Panel>

        {/* Learning */}
        <Panel title="Learning history" icon={BookOpen}>
          <ul className="space-y-2.5">
            {worker.learning.map((l) => (
              <li key={l.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {l.kind.replace("_", " ")}
                  </span>
                  <span className="text-mono text-[10px] text-muted-foreground">
                    {new Date(l.at).toLocaleDateString()}
                  </span>
                  {l.delta && (
                    <span className="text-mono text-[10px] text-ai ml-auto">
                      {l.delta}
                    </span>
                  )}
                </div>
                <div className="leading-relaxed mt-0.5">{l.summary}</div>
              </li>
            ))}
            {worker.learning.length === 0 && (
              <li className="text-xs text-muted-foreground">
                Fresh worker — no learning events yet.
              </li>
            )}
          </ul>
        </Panel>

        {/* Experiments */}
        <Panel title="Recent experiments" icon={Beaker}>
          <ul className="space-y-1.5">
            {worker.experiments.map((x) => (
              <li
                key={x.id}
                className="flex items-center gap-2 text-sm py-1.5 border-b border-border/40 last:border-0"
              >
                <span
                  className={cn(
                    "text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                    x.status === "running" &&
                      "border-border bg-ai-soft text-ai",
                    x.status === "won" &&
                      "border-border text-emerald-500",
                    x.status === "lost" &&
                      "border-border text-destructive",
                    x.status === "inconclusive" &&
                      "border-border text-muted-foreground",
                  )}
                >
                  {x.status}
                </span>
                <span className="flex-1 truncate">{x.name}</span>
                <span className="text-mono text-[10px] text-muted-foreground">
                  {x.metric}
                </span>
              </li>
            ))}
            {worker.experiments.length === 0 && (
              <li className="text-xs text-muted-foreground">
                No experiments running.
              </li>
            )}
          </ul>
        </Panel>

        {/* Predictions */}
        <Panel title="Predictions" icon={Sparkles}>
          <ul className="space-y-2.5">
            {worker.predictions.map((p) => (
              <li key={p.id} className="text-sm">
                <div className="leading-relaxed">{p.statement}</div>
                <div className="mt-1 flex items-center gap-2 text-mono text-[10px] text-muted-foreground">
                  <span>{Math.round(p.confidence * 100)}% confident</span>
                  <span>·</span>
                  <span>horizon {p.horizon}</span>
                </div>
              </li>
            ))}
            {worker.predictions.length === 0 && (
              <li className="text-xs text-muted-foreground">
                No standing predictions.
              </li>
            )}
          </ul>
        </Panel>

        {/* Tools */}
        <Panel title="Tools" icon={Wrench}>
          <div className="flex flex-wrap gap-1.5">
            {worker.tools.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-md border border-border bg-background"
              >
                {t}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-display text-xl leading-none">{value}</div>
        {children}
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/60 bg-background p-4">
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
