import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { cn } from "@/lib/utils";
import {
  CANDIDATES,
  EXPERIMENTS,
  MOMENTS,
  PHASES,
  RECRUITERS,
  ROLES,
  sourceInitial,
  type Candidate,
  type PipelinePhase,
} from "@/lib/recruiting/data";
import {
  ArrowRight,
  Bot,
  Chrome,
  FlaskConical,
  Linkedin,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Video,
  Waypoints,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/recruiting")({
  component: RecruitingView,
});

const HEAT_DOT: Record<Candidate["heat"], string> = {
  hot: "bg-destructive",
  warm: "bg-warning",
  cold: "bg-muted-foreground/50",
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
  const map: Record<string, typeof MessageSquare> = {
    outreach: MessageSquare,
    reply: MessageSquare,
    interview: Video,
    browser: Chrome,
    ai: Sparkles,
    signal: Waypoints,
  };
  const Icon = map[kind] ?? Sparkles;
  return <Icon className="h-3.5 w-3.5" />;
}

function RecruitingView() {
  const [activeRoleId, setActiveRoleId] = useState<string | "all">(ROLES[0].id);
  const [activePhase, setActivePhase] = useState<PipelinePhase | "all">("all");
  const [focusId, setFocusId] = useState<string>(CANDIDATES[0].id);

  const filtered = useMemo(() => {
    return CANDIDATES.filter(
      (c) =>
        (activeRoleId === "all" || c.roleId === activeRoleId) &&
        (activePhase === "all" || c.phase === activePhase),
    );
  }, [activeRoleId, activePhase]);

  const focus = CANDIDATES.find((c) => c.id === focusId) ?? CANDIDATES[0];
  const focusRole = ROLES.find((r) => r.id === focus.roleId);
  const focusMoments = MOMENTS.filter((m) => m.candidateId === focus.id);

  const phaseCounts = useMemo(() => {
    const m: Record<string, number> = {};
    const scope =
      activeRoleId === "all"
        ? CANDIDATES
        : CANDIDATES.filter((c) => c.roleId === activeRoleId);
    for (const c of scope) m[c.phase] = (m[c.phase] ?? 0) + 1;
    return { map: m, total: scope.length };
  }, [activeRoleId]);

  const activeRole =
    activeRoleId === "all" ? undefined : ROLES.find((r) => r.id === activeRoleId);

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Hiring, driven by Alyson"
        description="Candidates are People. Roles are Projects. Every touchpoint is a task the OS can run itself."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Active pipeline
              </div>
              <div className="text-display text-lg">{CANDIDATES.length}</div>
              <div className="text-xs text-muted-foreground">
                across {ROLES.length} roles
              </div>
            </div>
            <Link
              to="/recruiting/linkedin"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-mono text-[11px] text-background transition-opacity hover:opacity-90"
            >
              <Linkedin className="h-3.5 w-3.5" /> Search builder
            </Link>
          </div>
        }
      />

      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {/* AI briefing */}
      <div className="mt-6 rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-[var(--color-ai-soft)]/40">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-ai)]" />
          <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Alyson · this hour
          </span>
          <span className="ml-auto text-mono text-[10px] text-muted-foreground">
            confidence 0.88
          </span>
        </div>
        <div className="grid md:grid-cols-3 divide-x divide-border/60">
          <BriefCell
            label="If you approve 4 actions"
            value="+2 offers"
            hint="predicted offers accepted in the next 14 days"
          />
          <BriefCell
            label="Time-to-fill compression"
            value="−11 days"
            hint="if Marc's comp is approved and Priya's prep pack ships today"
          />
          <BriefCell
            label="At risk"
            value="1 offer · Marc"
            hint="competing offer expected Thursday · window closes in 48h"
          />
        </div>
        <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Recommended:</span>{" "}
            <span className="text-foreground">
              approve Marc's 4B comp band, ship Priya's onsite pack, book Aya's
              technical, and launch OSS-hook outreach to Jules.
            </span>
          </p>
          <button className="text-mono text-[11px] px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-1.5">
            Approve all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Role strip */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto">
        <RoleChip
          label="All roles"
          sub={`${CANDIDATES.length} candidates`}
          active={activeRoleId === "all"}
          onClick={() => setActiveRoleId("all")}
        />
        {ROLES.map((r) => (
          <RoleChip
            key={r.id}
            label={r.title}
            sub={`${r.activeCandidates} · ${r.daysOpen}d open`}
            active={activeRoleId === r.id}
            onClick={() => setActiveRoleId(r.id)}
          />
        ))}
      </div>

      {activeRole && (
        <div className="mt-3 grid grid-cols-6 rounded-xl border border-border/60 bg-card overflow-hidden">
          {PHASES.map((p) => {
            const count = activeRole.phaseCounts[p.id] ?? 0;
            const pct = Math.min(100, count * 12);
            return (
              <button
                key={p.id}
                onClick={() =>
                  setActivePhase(activePhase === p.id ? "all" : p.id)
                }
                className={cn(
                  "px-3 py-3 text-left border-r last:border-r-0 border-border/60 hover:bg-accent/40 transition-colors",
                  activePhase === p.id && "bg-accent/60",
                )}
              >
                <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {p.label}
                </div>
                <div className="text-display text-lg mt-0.5 tabular-nums">
                  {count}
                </div>
                <div className="mt-1.5 h-0.5 bg-border/60 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-[var(--color-ai)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Body: candidate stream + focus */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4">
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border/60 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <div>Candidate · Alyson's next move</div>
            <div className="text-right">Fit</div>
            <div className="text-right">P(offer)</div>
            <div className="text-right">Phase</div>
          </div>
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No candidates match. Alyson is still sourcing.
            </div>
          )}
          {filtered.map((c) => {
            const role = ROLES.find((r) => r.id === c.roleId);
            return (
              <button
                key={c.id}
                onClick={() => setFocusId(c.id)}
                className={cn(
                  "w-full text-left grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border/40 hover:bg-accent/40 transition-colors",
                  focus.id === c.id && "bg-accent/60",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("h-1.5 w-1.5 rounded-full", HEAT_DOT[c.heat])} />
                    <span className="text-sm truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      · {c.headline}
                    </span>
                    <span className="ml-auto text-mono text-[10px] text-muted-foreground shrink-0">
                      {c.lastTouch}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 bg-[var(--color-ai-soft)]/60 text-[var(--color-ai)]">
                      <KindGlyph kind={c.nextActionKind} />
                      <span className="text-mono text-[10px] uppercase tracking-wider">
                        {c.nextActionKind}
                      </span>
                    </span>
                    <span className="text-foreground truncate">{c.nextAction}</span>
                    <span className="ml-auto text-mono text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider">
                      {sourceInitial(c.source)} · {role?.title.split(" ").slice(-2).join(" ")}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm tabular-nums self-center">
                  {Math.round(c.score * 100)}
                  <span
                    className={cn(
                      "ml-1 text-mono text-[10px]",
                      c.scoreDelta >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {c.scoreDelta >= 0 ? "+" : ""}
                    {(c.scoreDelta * 100).toFixed(0)}
                  </span>
                </div>
                <div className="text-right text-mono text-xs tabular-nums self-center text-muted-foreground">
                  {Math.round(c.offerProbability * 100)}%
                </div>
                <div className="text-right text-mono text-[10px] uppercase tracking-wider self-center text-muted-foreground">
                  {c.phase}
                </div>
              </button>
            );
          })}
        </div>

        {/* Focus panel */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/60">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {focus.id} · {focus.phase.toUpperCase()} · {focusRole?.title}
            </div>
            <div className="mt-1 text-display text-lg leading-tight">
              {focus.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {focus.headline} · {focus.location}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-mono text-[10px] text-muted-foreground">
              {focus.source === "linkedin" ? (
                <Linkedin className="h-3 w-3" />
              ) : focus.source === "browser" ? (
                <Chrome className="h-3 w-3" />
              ) : focus.source === "referral" ? (
                <Users className="h-3 w-3" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
              <span className="uppercase tracking-wider">Source · {focus.sourceLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
            <MiniStat
              label="Fit"
              value={`${Math.round(focus.score * 100)}`}
              tone={
                focus.scoreDelta >= 0 ? "text-success" : "text-destructive"
              }
            />
            <MiniStat
              label="P(offer)"
              value={`${Math.round(focus.offerProbability * 100)}%`}
            />
            <MiniStat label="Resume" value={`${focus.resumeSnippets} snips`} />
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
              <button className="text-mono text-[11px] px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1.5">
                Approve <ArrowRight className="h-3 w-3" />
              </button>
              <button className="text-mono text-[11px] px-3 py-1.5 rounded-md border border-border hover:bg-accent">
                Modify
              </button>
              <span className="ml-auto text-mono text-[10px] text-muted-foreground flex items-center gap-1">
                <KindGlyph kind={focus.nextActionKind} /> {focus.ownerWorkerName}
              </span>
            </div>
          </div>

          {/* Skills */}
          <div className="px-4 py-3 border-b border-border/60">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Resume signals
            </div>
            <div className="flex flex-wrap gap-1.5">
              {focus.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4 border-b border-border/60 flex-1 min-h-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Outreach → Knowledge
            </div>
            <ol className="space-y-2.5">
              {focusMoments.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  No moments yet. Alyson is watching.
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
            <CrossLink label="Role" value={focusRole?.id ?? "—"} small />
            <CrossLink label="Snippets" value={focus.resumeSnippets} />
            <CrossLink
              label="Experiment"
              value={focus.liftFromExperiment ?? "—"}
              small
            />
          </div>
        </div>
      </div>

      {/* Bottom: recruiters + experiments */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Recruiters · Workers
            </span>
          </div>
          <ul>
            {RECRUITERS.map((w) => (
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
                  {w.activeReqs} reqs
                </div>
                <div className="text-mono text-xs tabular-nums">
                  {Math.round(w.passRate * 100)}%
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Experiments optimizing outreach
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
                    +{x.replyLift}%
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

      {/* Sources footer */}
      <div className="mt-6 rounded-xl border border-border/60 bg-card px-4 py-3 flex flex-wrap items-center gap-3 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Waypoints className="h-3.5 w-3.5" />
        <span>Sources synced</span>
        <span className="flex items-center gap-1 text-foreground">
          <Linkedin className="h-3 w-3" /> LinkedIn · 412
        </span>
        <span className="flex items-center gap-1 text-foreground">
          <ArrowRight className="h-3 w-3" /> Ashby · 128
        </span>
        <span className="flex items-center gap-1 text-foreground">
          <Chrome className="h-3 w-3" /> Browser crawls · 63
        </span>
        <span className="flex items-center gap-1 text-foreground">
          <Users className="h-3 w-3" /> Referrals · 21
        </span>
        <span className="ml-auto">last sync · 4m ago</span>
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

function RoleChip({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex flex-col items-start px-3 py-1.5 rounded-md border text-sm transition-colors min-w-[140px]",
        active
          ? "border-border-strong bg-accent"
          : "border-border/60 hover:bg-accent/60",
      )}
    >
      <span className="truncate max-w-[220px]">{label}</span>
      <span className="text-mono text-[10px] text-muted-foreground">{sub}</span>
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
