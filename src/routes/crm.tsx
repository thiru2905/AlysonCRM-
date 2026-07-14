import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { cn } from "@/lib/utils";
import { notifyDone, notifySoon } from "@/lib/actions";
import {
  EXPERIMENTS,
  LEADS,
  MOMENTS,
  STAGES,
  WORKERS,
  formatMoney,
  pipelineTotals,
  type CrmLead,
  type PipelineStage,
} from "@/lib/crm/data";
import {
  ArrowRight,
  Bot,
  Chrome,
  FlaskConical,
  Mail,
  Phone,
  Sparkles,
  User,
  Video,
  Waypoints,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/crm")({
  component: CrmView,
});

const TEMP_TONE: Record<CrmLead["temperature"], string> = {
  hot: "text-destructive",
  warm: "text-warning",
  cold: "text-muted-foreground",
};

function KindGlyph({
  kind,
  className,
}: {
  kind: "human" | "ai" | "browser" | "api";
  className?: string;
}) {
  const Icon =
    kind === "ai" ? Bot : kind === "browser" ? Chrome : kind === "api" ? Zap : User;
  return <Icon className={cn("h-3.5 w-3.5", className)} />;
}

function MomentIcon({ kind }: { kind: string }) {
  const map: Record<string, typeof Mail> = {
    email: Mail,
    call: Phone,
    meeting: Video,
    browser: Chrome,
    ai: Sparkles,
    signal: Waypoints,
  };
  const Icon = map[kind] ?? Sparkles;
  return <Icon className="h-3.5 w-3.5" />;
}

function CrmView() {
  const [activeStage, setActiveStage] = useState<PipelineStage | "all">("all");
  const [focusId, setFocusId] = useState<string>(LEADS[0].id);

  const filtered = useMemo(
    () => (activeStage === "all" ? LEADS : LEADS.filter((l) => l.stage === activeStage)),
    [activeStage],
  );
  const totals = useMemo(() => pipelineTotals(LEADS), []);
  const focus = LEADS.find((l) => l.id === focusId) ?? LEADS[0];
  const focusMoments = MOMENTS.filter((m) => m.leadId === focus.id);

  const stageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of LEADS) m[l.stage] = (m[l.stage] ?? 0) + 1;
    return m;
  }, []);

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATION · CRM"
        title="Revenue, driven by Alyson"
        description="Leads are Projects. Customers are Entities. Every follow-up is a task the OS can run itself."
        actions={
          <div className="flex items-center gap-2">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Weighted pipeline
            </div>
            <div className="text-display text-lg">{formatMoney(totals.weighted)}</div>
            <div className="text-xs text-muted-foreground">
              / {formatMoney(totals.total)}
            </div>
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
            confidence 0.86
          </span>
        </div>
        <div className="grid md:grid-cols-3 divide-x divide-border">
          <BriefCell
            label="If you approve 3 actions"
            value={`+${formatMoney(63000)}`}
            hint="expected weighted lift in the next 7 days"
          />
          <BriefCell
            label="Cycle time compression"
            value="−9 days"
            hint="if security review is booked for Halden today"
          />
          <BriefCell
            label="At risk"
            value="1 deal · $92k"
            hint="Halden — response window closes in 6h"
          />
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Recommended:</span>{" "}
            <span className="text-foreground">
              approve Atlas's redline v3 for Northwind, let Scout enrich Sable, and
              have Nova book Halden's security review.
            </span>
          </p>
          <button
            type="button"
            onClick={() => notifyDone("Approved all recommendations")}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition flex items-center gap-1.5"
          >
            Approve all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stage strip */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto">
        <StageChip
          label="All"
          count={LEADS.length}
          active={activeStage === "all"}
          onClick={() => setActiveStage("all")}
        />
        {STAGES.map((s) => (
          <StageChip
            key={s.id}
            label={s.label}
            count={stageCounts[s.id] ?? 0}
            active={activeStage === s.id}
            onClick={() => setActiveStage(s.id)}
          />
        ))}
      </div>

      {/* Body: lead stream + focus */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4">
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border/60 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <div>Lead · Alyson's next move</div>
            <div className="text-right">Value</div>
            <div className="text-right">P(win)</div>
            <div className="text-right">Close</div>
          </div>
          {filtered.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setFocusId(lead.id)}
              className={cn(
                "w-full text-left grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border/40 hover:bg-accent/40 transition-colors",
                focus.id === lead.id && "bg-accent/60",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-1.5 w-1.5 rounded-full", {
                    "bg-destructive": lead.temperature === "hot",
                    "bg-warning": lead.temperature === "warm",
                    "bg-muted-foreground/50": lead.temperature === "cold",
                  })} />
                  <span className="text-sm truncate">{lead.company}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    · {lead.contact}
                  </span>
                  <span className="ml-auto text-mono text-[10px] text-muted-foreground shrink-0">
                    {lead.lastTouch}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 bg-[var(--color-ai-soft)]/60 text-[var(--color-ai)]">
                    <KindGlyph kind={lead.nextActionKind} />
                    <span className="text-mono text-[10px] uppercase tracking-wider">
                      {lead.nextActionKind}
                    </span>
                  </span>
                  <span className="text-foreground truncate">{lead.nextAction}</span>
                </div>
              </div>
              <div className="text-right text-sm tabular-nums self-center">
                {formatMoney(lead.value)}
              </div>
              <div className="text-right text-mono text-xs tabular-nums self-center text-muted-foreground">
                {Math.round(lead.probability * 100)}%
              </div>
              <div className="text-right text-mono text-xs tabular-nums self-center text-muted-foreground">
                {lead.projectedCloseDays}d
              </div>
            </button>
          ))}
        </div>

        {/* Focus panel */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/60">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {focus.id} · {STAGES.find((s) => s.id === focus.stage)?.label ?? focus.stage}
            </div>
            <div className="mt-1 text-display text-lg leading-tight">
              {focus.company}
            </div>
            <div className="text-xs text-muted-foreground">
              {focus.contact} · {focus.title}
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
            <MiniStat label="Value" value={formatMoney(focus.value)} />
            <MiniStat
              label="P(win)"
              value={`${Math.round(focus.probability * 100)}%`}
              tone={TEMP_TONE[focus.temperature]}
            />
            <MiniStat label="Close" value={`${focus.projectedCloseDays}d`} />
          </div>

          {/* Recommended action */}
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-ai)]" />
              <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Alyson recommends
              </span>
            </div>
            <p className="mt-2 text-sm">{focus.nextAction}</p>
            <p className="mt-2 text-xs text-muted-foreground italic">
              {focus.aiRationale}
            </p>
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
                <KindGlyph kind={focus.nextActionKind} /> {focus.ownerWorkerName}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4 border-b border-border/60 flex-1 min-h-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Conversation → Knowledge
            </div>
            <ol className="space-y-2.5">
              {focusMoments.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  No moments captured yet. Alyson is listening.
                </li>
              )}
              {focusMoments.map((m) => (
                <li key={m.id} className="flex gap-2.5">
                  <div className="h-6 w-6 shrink-0 rounded-md border border-border/60 grid place-items-center text-muted-foreground">
                    <MomentIcon kind={m.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs truncate">{m.who}</span>
                      <span className="text-mono text-[10px] text-muted-foreground ml-auto shrink-0">
                        {m.at}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.summary}
                    </p>
                    {m.extracted && (
                      <div className="mt-1 text-mono text-[10px] text-[var(--color-ai)] truncate">
                        → {m.extracted}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Cross-links */}
          <div className="grid grid-cols-3 divide-x divide-border/60 text-xs">
            <CrossLink label="Tasks" value={focus.taskCount} />
            <CrossLink label="Knowledge" value={focus.knowledgeCount} />
            <CrossLink
              label="Experiment"
              value={focus.liftFromExperiment ?? "—"}
              small
            />
          </div>
        </div>
      </div>

      {/* Bottom: workers + experiments */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Salespeople · Workers
            </span>
          </div>
          <ul>
            {WORKERS.map((w) => (
              <li
                key={w.id}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-border/40 last:border-b-0 items-center"
              >
                <KindGlyph kind={w.kind} className="text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-sm truncate">
                    {w.name}{" "}
                    <span className="text-xs text-muted-foreground">· {w.role}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Working on {w.workingOn}
                  </div>
                </div>
                <div className="text-mono text-xs tabular-nums text-muted-foreground">
                  {w.activeLeads} leads
                </div>
                <div className="text-mono text-xs tabular-nums">
                  {Math.round(w.winRate * 100)}%
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Experiments optimizing conversion
            </span>
          </div>
          <ul>
            {EXPERIMENTS.map((x) => (
              <li
                key={x.id}
                className="px-4 py-3 border-b border-border/40 last:border-b-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{x.name}</span>
                  <span className="ml-auto text-mono text-sm text-success tabular-nums">
                    +{x.lift}%
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

function BriefCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="p-4">
      <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="text-display text-xl mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function StageChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors",
        active
          ? "border-border-strong bg-accent"
          : "border-border/60 hover:bg-accent/60",
      )}
    >
      <span>{label}</span>
      <span className="text-mono text-[10px] text-muted-foreground tabular-nums">
        {count}
      </span>
    </button>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="p-3 text-center">
      <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-display text-sm mt-1 tabular-nums", tone)}>
        {value}
      </div>
    </div>
  );
}

function CrossLink({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 flex items-center justify-between hover:bg-accent/40 transition-colors cursor-pointer">
      <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("tabular-nums", small ? "text-mono text-[10px]" : "text-sm")}>
        {value}
      </span>
    </div>
  );
}
