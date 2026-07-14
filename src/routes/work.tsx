import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/shell/Page";
import { notifySoon } from "@/lib/actions";
import { formatRelative } from "@/components/entity/EntityPanel";
import { TaskRow } from "@/components/projects/TaskRow";
import { PhaseBoard } from "@/components/projects/PhaseBoard";
import { DependencyGraph } from "@/components/projects/DependencyGraph";
import { ExecutorBadge } from "@/components/projects/ExecutorBadge";
import { StatusIcon, PriorityIcon } from "@/components/projects/StatusIcon";
import { WorkTree } from "@/components/projects/WorkTree";
import {
  DEMO_PROJECT,
  EXECUTORS,
  PROJECT_KIND_LABEL,
  PROJECT_LIST,
  executorMeta,
  type ExecutorKind,
  type Task,
  type TaskStatus,
} from "@/lib/projects/data";
import { cn } from "@/lib/utils";
import {
  Target,
  Layers,
  ListTodo,
  Bot,
  FlaskConical,
  Sparkles,
  BookOpen,
  Clock,
  GitBranch,
  ChevronRight,
  Plus,
  Circle,
  CircleDot,
  CircleDashed,
  CircleAlert,
  CircleCheck,
} from "lucide-react";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Work — Alyson Agentic CRM+" },
      {
        name: "description",
        content:
          "Everything is a project. Project › Phase › Task › Subtask — executed by humans, AI workers, browsers, APIs, and tools.",
      },
    ],
  }),
  component: ProjectsRoute,
});

/* ---------- routing between list + detail (internal state) ---------- */

function ProjectsRoute() {
  const [activeId, setActiveId] = useState<string>(DEMO_PROJECT.id);
  const active = activeId === DEMO_PROJECT.id ? DEMO_PROJECT : null;

  if (!active) {
    return <ProjectsIndex onOpen={setActiveId} />;
  }
  return <ProjectDetail onBack={() => setActiveId("__list__")} />;
}

/* ---------- Index (Linear-style compact list) ---------- */

function ProjectsIndex({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <PageContainer className="max-w-[1200px]">
      <header className="pb-5 border-b border-border/60 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
            Work
          </div>
          <h1 className="text-display text-2xl md:text-[28px] leading-tight">
            Everything is a project.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Leads, candidates, quotes, listings, campaigns, partnerships — they
            all share the same shape. Objectives, phases, tasks, workers,
            experiments, predictions, knowledge, and a timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => notifySoon("New project", "Project templates coming soon")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          New project
        </button>
      </header>

      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-3 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="w-20">Type</span>
          <span className="flex-1">Project</span>
          <span className="hidden md:inline w-24">Health</span>
          <span className="hidden md:inline w-32">Progress</span>
          <span className="w-16 text-right">Tasks</span>
          <span className="hidden md:inline w-16 text-right">Workers</span>
          <span className="w-16 text-right">Updated</span>
        </div>
        <ul>
          {PROJECT_LIST.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onOpen(p.id)}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0 hover:bg-accent/60 transition"
              >
                <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-20 truncate">
                  {PROJECT_KIND_LABEL[p.kind]}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
                    {p.code}
                  </span>
                  <span className="text-sm truncate">{p.name}</span>
                </div>
                <HealthDot health={p.health} />
                <div className="hidden md:block w-32">
                  <ProgressBar value={p.progress} />
                </div>
                <span className="text-mono text-[11px] text-muted-foreground w-16 text-right">
                  {p.openTasks}
                </span>
                <span className="hidden md:inline text-mono text-[11px] text-muted-foreground w-16 text-right">
                  {p.workers}
                </span>
                <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-16 text-right">
                  {formatRelative(p.updatedAt)}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 -mr-1" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );
}

function HealthDot({ health }: { health: "on_track" | "warn" | "off_track" }) {
  const tone =
    health === "on_track" ? "bg-emerald-400" :
    health === "warn" ? "bg-amber-400" : "bg-destructive";
  const label =
    health === "on_track" ? "On track" :
    health === "warn" ? "At risk" : "Off track";
  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 w-24 text-[11px] text-muted-foreground"
      title={label}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone)} />
      {label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full ai-gradient-bg rounded-full"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-mono text-[10px] text-muted-foreground w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

/* ---------- Detail (project engine) ---------- */

type View =
  | "tree"
  | "overview"
  | "workers"
  | "experiments"
  | "predictions"
  | "knowledge"
  | "timeline"
  | "dependencies";

const VIEWS: { id: View; label: string; icon: typeof Target }[] = [
  { id: "tree", label: "Tree", icon: Layers },
  { id: "overview", label: "Overview", icon: Target },
  { id: "dependencies", label: "Dependencies", icon: GitBranch },
  { id: "workers", label: "Workers", icon: Bot },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
  { id: "predictions", label: "Predictions", icon: Sparkles },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "timeline", label: "Timeline", icon: Clock },
];

function ProjectDetail({ onBack }: { onBack: () => void }) {
  const p = DEMO_PROJECT;
  const [view, setView] = useState<View>("tree");

  return (
    <PageContainer className="max-w-[1200px]">
      {/* Breadcrumb / header */}
      <header className="pb-5 border-b border-border/60">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-foreground transition"
          >
            Work
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-mono text-[10px] uppercase tracking-wider">
            {PROJECT_KIND_LABEL[p.kind]}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-mono text-[10px] uppercase tracking-wider text-foreground">
            {p.code}
          </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-display text-2xl leading-tight">{p.name}</h1>
              <StatusPill status={p.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{p.subtitle}</p>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <MiniStat label="Progress" value={`${Math.round(p.progress * 100)}%`} />
            <MiniStat label="Open tasks" value={String(p.tasks.filter(t => t.status !== "done").length)} />
            <MiniStat label="Workers" value={String(p.workers.length)} />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-0 z-10 -mx-5 md:-mx-8 mt-2 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="px-5 md:px-8 flex items-center gap-0.5 overflow-x-auto">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const on = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 h-11 px-3 text-sm transition whitespace-nowrap",
                  on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
                {on && <span className="absolute left-2 right-2 -bottom-px h-px bg-foreground" />}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="pt-6">
        {view === "tree" && <WorkTree project={p} defaultOpen="active" />}
        {view === "overview" && <Overview />}
        {view === "dependencies" && <DependencyGraph tasks={p.tasks} />}
        {view === "workers" && <WorkersView />}
        {view === "experiments" && <ExperimentsView />}
        {view === "predictions" && <PredictionsView />}
        {view === "knowledge" && <KnowledgeView />}
        {view === "timeline" && <TimelineView />}
      </div>
    </PageContainer>
  );
}

/* ---------- Views ---------- */

function Overview() {
  const p = DEMO_PROJECT;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
      <div className="space-y-5">
        {/* Objectives */}
        <Section title="Objectives" hint="What we're trying to achieve.">
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {p.objectives.map((o) => {
              const pct = Math.min(1, o.current / o.target);
              return (
                <li
                  key={o.id}
                  className="rounded-lg border border-border bg-card px-3.5 py-3"
                >
                  <div className="flex items-start gap-2">
                    <Target className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">{o.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {o.current}{o.unit ?? ""} / {o.target}{o.unit ?? ""} · {o.metric}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full ai-gradient-bg rounded-full"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* Phases mini */}
        <Section title="Phases" hint="Where we are, where we're going.">
          <ol className="rounded-xl border border-border bg-card overflow-hidden">
            {p.phases.map((phase, i) => {
              const Icon =
                phase.status === "complete" ? CircleCheck :
                phase.status === "active" ? CircleDot : Circle;
              const tone =
                phase.status === "complete" ? "text-emerald-400" :
                phase.status === "active" ? "text-ai" : "text-muted-foreground";
              return (
                <li
                  key={phase.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0"
                >
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-4">
                    {i + 1}
                  </span>
                  <Icon className={cn("h-3.5 w-3.5", tone)} />
                  <span className="text-sm font-medium">{phase.label}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    · {phase.goal}
                  </span>
                  <div className="flex-1" />
                  <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        phase.status === "complete" ? "bg-emerald-400/70" : "ai-gradient-bg",
                      )}
                      style={{ width: `${phase.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-mono text-[10px] text-muted-foreground w-8 text-right">
                    {Math.round(phase.progress * 100)}%
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>

        {/* Recent tasks */}
        <Section title="Recent activity">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {[...p.tasks]
              .sort((a, b) => (a.activityAt < b.activityAt ? 1 : -1))
              .slice(0, 5)
              .map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
          </div>
        </Section>
      </div>

      {/* Right rail */}
      <aside className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-ai" />
            Alyson · brief
          </div>
          <p className="text-sm mt-2 leading-relaxed">
            Renewal is inside the window but the SOC2 gap is compressing the
            timeline. Recommend routing the evidence bundle to Ori by EOD.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Synthesized from {p.knowledge.length} sources · {p.timeline.length} events
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Predictions
          </div>
          <ul className="space-y-2.5">
            {p.predictions.map((pr) => (
              <li key={pr.id}>
                <div className="text-[11px] text-muted-foreground">{pr.question}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-display text-lg ai-gradient-text">{pr.answer}</div>
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {Math.round(pr.confidence * 100)}%{pr.horizon ? ` · ${pr.horizon}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Team
          </div>
          <ul className="space-y-1.5">
            {p.workers.slice(0, 5).map((w) => (
              <li key={w.id} className="flex items-center gap-2 text-sm">
                <ExecutorBadge kind={w.kind} size="xs" />
                <span className="truncate flex-1">{w.name}</span>
                <span className="text-mono text-[10px] text-muted-foreground">
                  {w.tasksOpen}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function TasksView() {
  const p = DEMO_PROJECT;
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [executor, setExecutor] = useState<ExecutorKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      p.tasks.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (executor === "all" || t.executor === executor),
      ),
    [p.tasks, status, executor],
  );

  const open = openId ? p.tasks.find((t) => t.id === openId) ?? null : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,340px)]">
      <div>
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <FilterChip label="All" active={status === "all"} onClick={() => setStatus("all")} />
          {(["todo","doing","review","blocked","done"] as TaskStatus[]).map((s) => (
            <FilterChip
              key={s}
              label={s}
              active={status === s}
              onClick={() => setStatus(s)}
              icon={<StatusIcon status={s} />}
            />
          ))}
          <div className="mx-2 h-4 w-px bg-border" />
          <FilterChip label="Any executor" active={executor === "all"} onClick={() => setExecutor("all")} />
          {EXECUTORS.map((e) => (
            <FilterChip
              key={e.kind}
              label={e.label}
              active={executor === e.kind}
              onClick={() => setExecutor(e.kind)}
              icon={<ExecutorBadge kind={e.kind} size="xs" />}
            />
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {filtered.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={setOpenId} />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              No tasks match these filters.
            </p>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-16 h-fit">
        {open ? <TaskPanel task={open} /> : <TaskPanelEmpty />}
      </aside>
    </div>
  );
}

function TaskPanel({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <header className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>{task.ref}</span>
          <div className="flex-1" />
          <PriorityIcon priority={task.priority} />
          <StatusIcon status={task.status} />
        </div>
        <h3 className="text-sm font-medium mt-1.5 leading-snug">{task.title}</h3>
      </header>
      <div className="px-4 py-3 space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-20">Executor</span>
          <ExecutorBadge kind={task.executor} withLabel />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-20">Assignee</span>
          <span>{task.assignee.name}</span>
        </div>
        {typeof task.confidence === "number" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-20">Confidence</span>
            <span className="text-ai text-mono text-xs">
              {Math.round(task.confidence * 100)}%
            </span>
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Subtasks</div>
            <ul className="space-y-1">
              {task.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-sm border grid place-items-center",
                      s.done ? "bg-emerald-400/20 border-emerald-400/60" : "border-border",
                    )}
                  >
                    {s.done && <CircleCheck className="h-2 w-2 text-emerald-400" />}
                  </span>
                  <span className={cn("flex-1", s.done && "line-through text-muted-foreground")}>
                    {s.title}
                  </span>
                  <ExecutorBadge kind={s.executor} size="xs" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <footer className="px-4 py-2.5 border-t border-border/60 flex items-center gap-2">
        <button className="text-xs h-7 px-2 rounded-md border border-border hover:bg-accent transition">
          Reassign
        </button>
        <button className="text-xs h-7 px-2 rounded-md border border-border hover:bg-accent transition">
          Delegate to AI
        </button>
        <div className="flex-1" />
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {formatRelative(task.activityAt)}
        </span>
      </footer>
    </div>
  );
}

function TaskPanelEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <ListTodo className="h-5 w-5 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground mt-2">
        Select a task to see details, subtasks, and delegation options.
      </p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-md border text-[11px] capitalize transition",
        active
          ? "border-border-strong bg-accent text-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/60",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function WorkersView() {
  const p = DEMO_PROJECT;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/60 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-3">
        <span className="flex-1">Worker</span>
        <span className="w-24">Type</span>
        <span className="hidden md:inline w-32">Utilization</span>
        <span className="w-16 text-right">Open</span>
      </div>
      <ul>
        {p.workers.map((w) => (
          <li
            key={w.id}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0"
          >
            <ExecutorBadge kind={w.kind} />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{w.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{w.role}</div>
            </div>
            <span className="w-24 text-[11px] text-muted-foreground truncate">
              {executorMeta(w.kind).label}
            </span>
            <div className="hidden md:flex items-center gap-2 w-32">
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full ai-gradient-bg rounded-full"
                  style={{ width: `${w.utilization * 100}%` }}
                />
              </div>
              <span className="text-mono text-[10px] text-muted-foreground w-8 text-right">
                {Math.round(w.utilization * 100)}%
              </span>
            </div>
            <span className="text-mono text-[11px] text-muted-foreground w-16 text-right">
              {w.tasksOpen}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExperimentsView() {
  const p = DEMO_PROJECT;
  return (
    <ul className="space-y-2.5">
      {p.experiments.map((x) => {
        const tone =
          x.status === "shipped" ? "text-emerald-400 border-emerald-400/40" :
          x.status === "running" ? "text-ai border-ai/40" :
          "text-muted-foreground border-border";
        return (
          <li key={x.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <FlaskConical className="h-3 w-3" />
              <span className={cn("px-1.5 h-4 inline-flex items-center rounded border", tone)}>
                {x.status}
              </span>
              <div className="flex-1" />
              <span>{Math.round(x.confidence * 100)}% conf</span>
            </div>
            <h4 className="text-sm mt-2 leading-snug">{x.hypothesis}</h4>
            {typeof x.lift === "number" && (
              <div className="text-xs text-muted-foreground mt-1.5">
                Observed lift:{" "}
                <span className={cn("text-mono", x.lift >= 0 ? "text-emerald-400" : "text-destructive")}>
                  {x.lift >= 0 ? "+" : ""}{Math.round(x.lift * 100)}%
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PredictionsView() {
  const p = DEMO_PROJECT;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {p.predictions.map((pr) => (
        <li key={pr.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-ai" />
            Prediction
            <div className="flex-1" />
            <span>{Math.round(pr.confidence * 100)}%{pr.horizon ? ` · ${pr.horizon}` : ""}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{pr.question}</div>
          <div className="text-display text-2xl mt-1 ai-gradient-text">{pr.answer}</div>
        </li>
      ))}
    </ul>
  );
}

function KnowledgeView() {
  const p = DEMO_PROJECT;
  return (
    <ul className="rounded-xl border border-border bg-card overflow-hidden">
      {p.knowledge.map((k) => (
        <li key={k.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm truncate flex-1">{k.title}</span>
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {k.source}
          </span>
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-16 text-right">
            {formatRelative(k.updatedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TimelineView() {
  const p = DEMO_PROJECT;
  return (
    <ol className="relative">
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {p.timeline.map((ev) => (
        <li key={ev.id} className="relative pl-8 py-2.5">
          <span className="absolute left-0 top-3.5 h-[22px] w-[22px] rounded-full grid place-items-center border border-border bg-card">
            <ExecutorBadge kind={ev.actorKind} size="xs" className="!gap-0" />
          </span>
          <div className="text-sm">
            <span className="font-medium">{ev.actorName}</span>
            <span className="text-muted-foreground"> {ev.verb} </span>
            {ev.target && <span>{ev.target}</span>}
          </div>
          <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            {formatRelative(ev.at)}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- shared bits ---------- */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-display text-lg leading-none">{value}</div>
      <div className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "at_risk" | "paused" | "won" | "lost" }) {
  const map: Record<typeof status, { label: string; tone: string; icon: typeof Circle }> = {
    active:  { label: "Active",   tone: "text-ai border-ai/40",           icon: CircleDot },
    at_risk: { label: "At risk",  tone: "text-amber-400 border-amber-400/40", icon: CircleAlert },
    paused:  { label: "Paused",   tone: "text-muted-foreground border-border", icon: CircleDashed },
    won:     { label: "Won",      tone: "text-emerald-400 border-emerald-400/40", icon: CircleCheck },
    lost:    { label: "Lost",     tone: "text-destructive border-destructive/40", icon: CircleAlert },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 h-5 px-1.5 rounded border text-[10px] text-mono uppercase tracking-wider", s.tone)}>
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </span>
  );
}
