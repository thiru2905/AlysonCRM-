import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/shell/Page";
import { notifyDone } from "@/lib/actions";
import { SessionCard } from "@/components/browser-workers/SessionCard";
import { ExecutionTimeline } from "@/components/browser-workers/ExecutionTimeline";
import { RuntimeHero } from "@/components/runtime/RuntimeHero";
import { RuntimeOverview } from "@/components/runtime/RuntimeOverview";
import { RuntimeExtensionPanel } from "@/components/runtime/RuntimeExtensionPanel";
import { RuntimeMcpPanel } from "@/components/runtime/RuntimeMcpPanel";
import { RuntimeLogsPanel } from "@/components/runtime/RuntimeLogsPanel";
import {
  ACTIONS,
  CAPABILITIES,
  DOWNLOADS,
  FAILURES,
  SESSIONS,
  STATUS_TONE,
  TASKS,
  actionsForTask,
  relTime,
  tasksForSession,
  type BrowserTask,
  type TaskStatus,
} from "@/lib/browser-workers/data";
import { cn } from "@/lib/utils";
import {
  Camera,
  ChevronRight,
  CloudCog,
  Download,
  KeyRound,
  Pause,
  Play,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepUnusedRefs = ACTIONS;

type RuntimeTab = "overview" | "sessions" | "queue" | "extension" | "mcp" | "logs";

const TABS: { id: RuntimeTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "queue", label: "Queue" },
  { id: "extension", label: "Extension" },
  { id: "mcp", label: "MCP Server" },
  { id: "logs", label: "Activity" },
];

export const Route = createFileRoute("/browser-workers")({
  head: () => ({
    meta: [
      { title: "Alyson Runtime — your co-worker, installed on your machine" },
      {
        name: "description",
        content:
          "Alyson Runtime is a local co-worker: a Chrome extension that harvests context and an MCP server that drives your browser. Install once and every worker gets hands and eyes.",
      },
      { property: "og:title", content: "Alyson Runtime" },
      {
        property: "og:description",
        content:
          "Your co-worker, installed on your machine. Local browser extension + MCP server for Alyson.",
      },
    ],
  }),
  component: BrowserWorkersView,
});

const STATUS_LABEL: Record<TaskStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting_auth: "Needs human",
  succeeded: "Succeeded",
  failed: "Failed",
  recovered: "Recovered",
};

function BrowserWorkersView() {
  const [tab, setTab] = useState<RuntimeTab>("overview");
  const [sessionId, setSessionId] = useState<string>(SESSIONS[0].id);
  const [taskId, setTaskId] = useState<string>("bt_scrape_pricing");

  const session = SESSIONS.find((s) => s.id === sessionId)!;
  const task = TASKS.find((t) => t.id === taskId) ?? null;
  const actions = useMemo(() => (task ? actionsForTask(task.id) : []), [task]);
  const sessionTasks = tasksForSession(sessionId);

  const queued = TASKS.filter((t) => t.status === "queued");
  const running = TASKS.filter(
    (t) => t.status === "running" || t.status === "waiting_auth",
  );
  const recent = TASKS.filter((t) =>
    ["succeeded", "failed", "recovered"].includes(t.status),
  );

  const counts = {
    active: SESSIONS.filter((s) => String(s.status) === "active").length,
    running: running.length,
    queued: queued.length,
    failed: TASKS.filter((t) => t.status === "failed").length,
  };

  return (
    <PageContainer className="max-w-[1400px]">
      <RuntimeHero />

      {/* Tabs */}
      <div className="mt-5 border-b border-border/60 flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 h-9 px-3 text-sm border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-5">
          <RuntimeOverview />
        </div>
      )}

      {tab === "extension" && (
        <div className="mt-5">
          <RuntimeExtensionPanel />
        </div>
      )}

      {tab === "mcp" && (
        <div className="mt-5">
          <RuntimeMcpPanel />
        </div>
      )}

      {tab === "logs" && (
        <div className="mt-5">
          <RuntimeLogsPanel />
        </div>
      )}

      {(tab === "sessions" || tab === "queue") && (
        <>
          {/* stat strip */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="Active sessions" value={counts.active} tone="text-success" />
            <Stat label="Running tasks" value={counts.running} tone="text-ai" />
            <Stat label="Queued" value={counts.queued} tone="text-foreground" />
            <Stat label="Failed today" value={counts.failed} tone="text-destructive" />
          </div>

          {/* three-pane control center */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px] gap-3 min-h-[640px]">
            {/* Sessions */}
            <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0">
              <PaneHeader
                title="Sessions"
                eyebrow={`${SESSIONS.length} runners`}
                right={<CloudCog className="h-3 w-3 text-muted-foreground" />}
              />
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
                {SESSIONS.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    active={s.id === sessionId}
                    onClick={() => {
                      setSessionId(s.id);
                      if (s.activeTaskId) setTaskId(s.activeTaskId);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Queue + timeline */}
            <div className="flex flex-col gap-3 min-h-0">
              <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0">
                <PaneHeader
                  title="Task queue"
                  eyebrow={`${running.length} running · ${queued.length} queued · ${recent.length} recent`}
                />
                <div className="max-h-[300px] overflow-y-auto scrollbar-thin divide-y divide-border/60">
                  <QueueGroup label="Running" tasks={running} active={taskId} onSelect={setTaskId} />
                  <QueueGroup label="Queued" tasks={queued} active={taskId} onSelect={setTaskId} />
                  <QueueGroup label="Recent" tasks={recent} active={taskId} onSelect={setTaskId} muted />
                </div>
              </div>

              <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0 flex-1">
                <PaneHeader
                  title="Execution timeline"
                  eyebrow={task ? task.title : "Select a task"}
                  right={
                    task && (
                      <div className="flex items-center gap-1.5">
                        <TaskAction icon={Pause} label="Pause" />
                        <TaskAction icon={RefreshCcw} label="Rerun" />
                        <TaskAction icon={XCircle} label="Cancel" />
                      </div>
                    )
                  }
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] min-h-0">
                  <div className="p-3 overflow-y-auto scrollbar-thin">
                    <ExecutionTimeline actions={actions} />
                  </div>
                  <div className="border-l border-border/60 p-2 overflow-y-auto scrollbar-thin">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-mono text-muted-foreground px-1 pb-1.5">
                      Screenshots
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {actions
                        .filter((a) => a.screenshotUrl)
                        .slice(0, 8)
                        .map((a) => (
                          <div
                            key={a.id}
                            className="aspect-video rounded-sm surface-hairline bg-gradient-to-br from-muted via-muted/60 to-muted/30 relative overflow-hidden group"
                            title={a.target}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Camera className="h-3 w-3 text-muted-foreground/60" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 text-[9px] text-mono uppercase tracking-[0.1em] px-1 py-0.5 bg-background/60 backdrop-blur-sm text-muted-foreground truncate">
                              {a.kind}
                            </div>
                          </div>
                        ))}
                      {actions.filter((a) => a.screenshotUrl).length === 0 && (
                        <div className="col-span-2 text-[11px] text-muted-foreground p-2">
                          No screenshots for this task.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: session detail */}
            <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0">
              <PaneHeader title={session.label} eyebrow={session.host} />
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <Section title="Capabilities">
                  <div className="grid grid-cols-2 gap-1">
                    {CAPABILITIES.map((c) => (
                      <div
                        key={c.key}
                        className="flex items-start gap-1.5 rounded-sm px-1.5 py-1 hover:bg-accent/50 transition"
                        title={c.desc}
                      >
                        <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-ai/70 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] truncate">{c.label}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {c.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Assigned tasks" eyebrow={`${sessionTasks.length}`}>
                  {sessionTasks.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Idle — no tasks assigned.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {sessionTasks.map((t) => (
                        <TaskRow key={t.id} task={t} active={t.id === taskId} onClick={() => setTaskId(t.id)} />
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="Downloads" eyebrow={`${DOWNLOADS.length}`}>
                  <ul className="space-y-1">
                    {DOWNLOADS.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-accent/50 transition"
                      >
                        <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] truncate">{d.filename}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {d.sizeMb.toFixed(2)} MB · {relTime(d.at)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title="Failures & recoveries" eyebrow={`${FAILURES.length}`}>
                  <ul className="space-y-1.5">
                    {FAILURES.map((f) => (
                      <li
                        key={f.id}
                        className="rounded-sm surface-hairline px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-mono uppercase tracking-[0.12em]">
                          {f.recovered ? (
                            <RefreshCcw className="h-3 w-3 text-ai" />
                          ) : (
                            <ShieldAlert className="h-3 w-3 text-destructive" />
                          )}
                          <span className={f.recovered ? "text-ai" : "text-destructive"}>
                            {f.recovered ? "Recovered" : "Failed"}
                          </span>
                          <span className="text-muted-foreground">· {relTime(f.at)}</span>
                        </div>
                        <div className="text-[11px] mt-0.5">{f.reason}</div>
                        {f.recovery && (
                          <div className="text-[10px] text-muted-foreground">
                            → {f.recovery}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>

                <div className="p-3 mt-2 border-t border-border/60">
                  <div className="flex items-start gap-2 rounded-md surface-hairline p-2.5 bg-ai/5">
                    <Sparkles className="h-3.5 w-3.5 text-ai mt-0.5 shrink-0" />
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      Alyson can retry <span className="text-foreground">3 failed actions</span> with alternate selectors.
                    </div>
                    <button
                      type="button"
                      onClick={() => notifyDone("Retrying failed actions", "3 actions queued with alternate selectors")}
                      className="inline-flex items-center gap-1 text-[11px] text-ai hover:brightness-110 shrink-0"
                    >
                      Run <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-md surface-hairline bg-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.12em] text-mono text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-display text-xl leading-tight mt-0.5", tone)}>
        {value}
      </div>
    </div>
  );
}

function PaneHeader({
  title,
  eyebrow,
  right,
}: {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 shrink-0">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-mono text-muted-foreground">
          {title}
        </div>
        {eyebrow && (
          <div className="text-xs text-foreground truncate">{eyebrow}</div>
        )}
      </div>
      {right}
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 py-3 border-b border-border/60">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-mono text-muted-foreground">
          {title}
        </div>
        {eyebrow && (
          <div className="text-[10px] text-muted-foreground/70">{eyebrow}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function QueueGroup({
  label,
  tasks,
  active,
  onSelect,
  muted,
}: {
  label: string;
  tasks: BrowserTask[];
  active: string;
  onSelect: (id: string) => void;
  muted?: boolean;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className={cn("py-1", muted && "opacity-90")}>
      <div className="px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-mono text-muted-foreground/70">
        {label} · {tasks.length}
      </div>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} active={t.id === active} onClick={() => onSelect(t.id)} inline />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  active,
  onClick,
  inline,
}: {
  task: BrowserTask;
  active: boolean;
  onClick: () => void;
  inline?: boolean;
}) {
  const tone = STATUS_TONE[task.status];
  const StatusIcon = statusIcon(task.status);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-2 transition",
        inline ? "px-3 py-1.5" : "px-1.5 py-1 rounded-sm",
        active
          ? "bg-accent text-foreground"
          : "hover:bg-accent/60 text-foreground/90",
      )}
    >
      <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", tone)} />
      <div className="min-w-0 flex-1">
        <div className="text-xs truncate">{task.title}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={cn("uppercase tracking-[0.1em] text-mono", tone)}>
            {STATUS_LABEL[task.status]}
          </span>
          {task.sessionId && (
            <>
              <span>·</span>
              <span className="truncate">
                {SESSIONS.find((s) => s.id === task.sessionId)?.label ?? "—"}
              </span>
            </>
          )}
          {task.attempts > 1 && (
            <>
              <span>·</span>
              <span>{task.attempts} attempts</span>
            </>
          )}
        </div>
        {task.status === "running" && (
          <div className="mt-1 h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-ai/70 transition-all"
              style={{ width: `${Math.round(task.progress * 100)}%` }}
            />
          </div>
        )}
      </div>
      {task.eta && (
        <span className="text-[10px] text-muted-foreground text-mono shrink-0">
          {task.eta}
        </span>
      )}
    </button>
  );
}

function statusIcon(status: TaskStatus) {
  if (status === "waiting_auth") return KeyRound;
  if (status === "failed") return XCircle;
  if (status === "recovered") return RefreshCcw;
  if (status === "running") return Play;
  return ChevronRight;
}

function TaskAction({
  icon: Icon,
  label,
}: {
  icon: typeof Pause;
  label: string;
}) {
  return (
    <button
      title={label}
      className="h-6 w-6 rounded-sm surface-hairline hover:bg-accent transition flex items-center justify-center text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}
