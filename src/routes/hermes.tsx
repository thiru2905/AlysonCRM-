import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApprovalCard } from "@/components/ai/ApprovalCard";
import { RuntimeHero } from "@/components/runtime/RuntimeHero";
import { useDesktopAgent } from "@/hooks/use-desktop-agent";
import { useBranchPlanStore } from "@/lib/recruiting/branch-plan-store";
import { buildBranchSearches } from "@/lib/recruiting/linkedin/branch-builder";
import { kindLabel } from "@/lib/hermes/prompt-builder";
import type { HermesMissionKind, HermesMissionRecord } from "@/lib/hermes/types";
import type { HermesLiveStatus } from "@/lib/agent/services/hermes-live";
import {
  createAndStartHermesMissionFn,
  getAutomationRunFn,
  getHermesEngineStatusFn,
  getHermesLiveStatusFn,
  getRunToolCallsFn,
  listApprovalsFn,
  listHermesMissionsFn,
  resolveApprovalFn,
} from "@/lib/agent/server";
import {
  ExternalLink,
  Monitor,
  Play,
  RefreshCcw,
  Rocket,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  inviteStatusFromProspect,
  inviteStatusLabel,
  inviteStatusTone,
  type InviteStatus,
} from "@/lib/agent/connection-status";
import { notifyDone } from "@/lib/actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hermes")({
  component: HermesEngineView,
});

const MISSION_KINDS: HermesMissionKind[] = [
  "connect",
  "message",
  "connect_and_message",
  "search_only",
];

function HermesEngineView() {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<HermesMissionKind>("connect");
  const [audience, setAudience] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [count, setCount] = useState(2);
  const [connectionNote, setConnectionNote] = useState("");
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {{name}}, I noticed your work at {{company}} and would love to connect."
  );
  const [starting, setStarting] = useState(false);
  const { crmStatus, runtimeOnline } = useDesktopAgent();
  const branchPlan = useBranchPlanStore();
  const qc = useQueryClient();

  const engineStatus = useQuery({
    queryKey: ["hermes-engine-status"],
    queryFn: () => getHermesEngineStatusFn(),
  });

  const live = useQuery({
    queryKey: ["hermes-live-status"],
    queryFn: () => getHermesLiveStatusFn(),
    refetchInterval: 3000,
  });

  const maxConnections =
    engineStatus.data?.maxConnectionsPerMission ?? 25;

  const missions = useQuery({
    queryKey: ["hermes-missions"],
    queryFn: () => listHermesMissionsFn(),
    refetchInterval: 5000,
  });

  const approvals = useQuery({
    queryKey: ["hermes-approvals"],
    queryFn: () => listApprovalsFn({ data: {} }),
    refetchInterval: 5000,
  });

  const branchSuggestions = useMemo(() => {
    const { plan, config, mode, target, includeLowSignal } = branchPlan;
    if (!plan?.branches?.length) return [];
    const built = buildBranchSearches(
      { config, mode, target, includeLowSignal },
      plan
    );
    return built.slice(0, 12).map((b) => ({
      label: b.label,
      audience: b.label,
      url: b.urls.people,
    }));
  }, [branchPlan]);

  function applyBranchSuggestion(s: { label: string; audience: string; url: string }) {
    setAudience(s.audience);
    if (s.url) setSearchUrl(s.url);
    if (!name.trim()) setName(`Connect — ${s.label}`);
    setCount(2);
  }

  async function handleLaunch() {
    if (!name.trim() || !audience.trim()) {
      notifyDone("Missing fields", "Name and audience are required.");
      return;
    }
    setStarting(true);
    try {
      const result = await createAndStartHermesMissionFn({
        data: {
          name: name.trim(),
          kind,
          config: {
            audience: audience.trim(),
            searchUrl: searchUrl.trim() || undefined,
            count,
            connectionNote: connectionNote.trim() || undefined,
            messageTemplate:
              kind === "message" || kind === "connect_and_message"
                ? messageTemplate.trim()
                : undefined,
          },
        },
      });
      notifyDone("Hermes mission launched", result.runId);
      setName("");
      await qc.invalidateQueries({ queryKey: ["hermes-missions"] });
      await qc.invalidateQueries({ queryKey: ["hermes-live-status"] });
      await qc.invalidateQueries({ queryKey: ["automation-runs"] });
      await qc.invalidateQueries({ queryKey: ["browser-workers-dashboard"] });
    } catch (err) {
      notifyDone(
        "Hermes failed to start",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setStarting(false);
    }
  }

  const outreachEnabled = engineStatus.data?.outreachEnabled ?? false;
  const liveData = live.data;
  const isActive =
    liveData?.activeMission &&
    ["running", "queued", "awaiting_approval"].includes(liveData.activeMission.status);

  return (
    <PageContainer
      title="Hermes Engine"
      description="Structured LinkedIn missions. DeepSeek plans each run (same key as branch map), then Hermes opens Chrome and executes step-by-step."
    >
      <div className="space-y-6">
        <HermesLiveBanner live={liveData} outreachEnabled={outreachEnabled} isLoading={live.isLoading} />

        <RuntimeHero />

        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">How to know it&apos;s working</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-foreground">Browser Workers</strong> → Recent browser actions
              should tick up (navigate, search, screenshot).
            </li>
            <li>
              Chrome opens as a <strong className="text-foreground">normal window</strong> in the
              Alyson profile — no &quot;controlled by test software&quot; banner. Log into LinkedIn
              once in that window; sessions persist.
            </li>
            <li>
              Status must be <strong className="text-foreground">Connected</strong>, not
              &quot;Waiting for pairing&quot; — pair via the Desktop Agent panel above.
            </li>
            <li>
              First launch can take 15–30s while Hermes starts Chrome and attaches the browser worker.
            </li>
          </ul>
          <Link to="/browser-workers" className="inline-flex items-center gap-1 text-xs text-primary underline">
            Open Browser Workers live feed
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Rocket className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">New mission</h2>
            <Badge variant="outline" className="ml-auto capitalize">
              {crmStatus.replace(/_/g, " ")}
            </Badge>
            <Badge className={runtimeOnline ? "bg-emerald-600" : ""}>
              {runtimeOnline ? "Desktop online" : "Desktop offline"}
            </Badge>
            {engineStatus.data?.deepSeekConfigured ? (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                DeepSeek planner
              </Badge>
            ) : (
              <Badge variant="outline">Add DEEPSEEK_API_KEY to .env</Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mission-name">Mission name</Label>
              <Input
                id="mission-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 4 connections — Senior React engineers"
              />
            </div>
            <div className="space-y-2">
              <Label>Mission type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as HermesMissionKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MISSION_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {kindLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audience / category</Label>
            <Input
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Senior frontend engineers in Bangalore with React experience"
            />
          </div>

          {branchSuggestions.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-muted-foreground">From branch map</Label>
              <div className="flex flex-wrap gap-2">
                {branchSuggestions.map((s) => (
                  <Button
                    key={s.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyBranchSuggestion(s)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Tip: generate a{" "}
              <Link to="/recruiting/linkedin/branches" className="underline">
                branch map
              </Link>{" "}
              to quick-fill audience URLs.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search-url">LinkedIn search URL (optional)</Label>
              <Input
                id="search-url"
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                placeholder="https://www.linkedin.com/search/results/people/?..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">
                {kind === "connect" || kind === "connect_and_message"
                  ? "Connection requests to send"
                  : "Profiles to process"}
              </Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={maxConnections}
                value={count}
                onChange={(e) =>
                  setCount(Math.min(maxConnections, Math.max(1, Number(e.target.value) || 1)))
                }
              />
              <p className="text-xs text-muted-foreground">
                Recommended 1–2 per mission for safety · max {maxConnections}
                {outreachEnabled && engineStatus.data?.maxConnectionsPerDay
                  ? ` · daily cap ${engineStatus.data.maxConnectionsPerDay} in .env`
                  : ""}
              </p>
            </div>
          </div>

          {(kind === "connect" || kind === "connect_and_message") && (
            <div className="space-y-2">
              <Label htmlFor="connection-note">Connection note (optional)</Label>
              <Textarea
                id="connection-note"
                value={connectionNote}
                onChange={(e) => setConnectionNote(e.target.value)}
                rows={2}
                placeholder="Short note for the connection request"
              />
            </div>
          )}

          {(kind === "message" || kind === "connect_and_message") && (
            <div className="space-y-2">
              <Label htmlFor="message-template">Message template</Label>
              <Textarea
                id="message-template"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Variables: {"{{name}}"}, {"{{company}}"}, {"{{title}}"}
              </p>
            </div>
          )}

          <Button
            onClick={handleLaunch}
            disabled={starting || !runtimeOnline || !name.trim() || !audience.trim()}
          >
            <Play className="h-4 w-4" />
            {starting ? "Launching Hermes…" : "Launch mission"}
          </Button>
          {!runtimeOnline && (
            <p className="text-xs text-destructive">
              Start the desktop agent and browser worker before launching.
            </p>
          )}
        </div>

        {approvals.data?.length ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Pending approvals</h2>
            {approvals.data.map((approval) => (
              <ApprovalCard
                key={approval.id}
                worker="Hermes"
                title={approval.title}
                rationale={approval.description}
                confidence={approval.riskLevel === "critical" ? 0.4 : 0.75}
                onApprove={async () => {
                  await resolveApprovalFn({
                    data: { approvalId: approval.id, status: "approved" },
                  });
                  await qc.invalidateQueries({ queryKey: ["hermes-approvals"] });
                  await qc.invalidateQueries({ queryKey: ["hermes-live-status"] });
                  await qc.invalidateQueries({ queryKey: ["browser-workers-dashboard"] });
                }}
                onReject={async () => {
                  await resolveApprovalFn({
                    data: { approvalId: approval.id, status: "rejected" },
                  });
                  await qc.invalidateQueries({ queryKey: ["hermes-approvals"] });
                  await qc.invalidateQueries({ queryKey: ["hermes-live-status"] });
                  await qc.invalidateQueries({ queryKey: ["browser-workers-dashboard"] });
                }}
              >
                <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                  {JSON.stringify(approval.payload, null, 2)}
                </pre>
              </ApprovalCard>
            ))}
          </section>
        ) : null}

        {isActive && (liveData?.recentConnections?.length ?? 0) > 0 && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h2 className="text-sm font-medium">People Hermes reached this mission</h2>
            <div className="divide-y divide-border/60">
              {liveData!.recentConnections.map((c) => (
                <div key={c.prospectId} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <div>
                    <a href={c.profileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {c.name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {c.title ?? "—"} · {c.company ?? "—"}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "capitalize shrink-0 border-0",
                      inviteStatusTone(c.status as InviteStatus)
                    )}
                  >
                    {inviteStatusLabel(inviteStatusFromProspect(c.status))}
                  </Badge>
                </div>
              ))}
            </div>
            <Link to="/browser-workers" className="text-xs text-primary underline">
              View all in Browser Workers →
            </Link>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Recent missions</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => qc.invalidateQueries({ queryKey: ["hermes-missions"] })}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {(missions.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No missions yet.</p>
            ) : (
              (missions.data ?? []).map((mission) => (
                <MissionRow key={mission.id} mission={mission} />
              ))
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function HermesLiveBanner({
  live,
  outreachEnabled,
  isLoading,
}: {
  live?: HermesLiveStatus;
  outreachEnabled: boolean;
  isLoading: boolean;
}) {
  const phaseColor: Record<string, string> = {
    idle: "border-amber-500/40 bg-amber-500/10",
    starting: "border-amber-500/40 bg-amber-500/10",
    chrome: "border-blue-500/40 bg-blue-500/10",
    search: "border-blue-500/40 bg-blue-500/10",
    profiles: "border-violet-500/40 bg-violet-500/10",
    connect: "border-emerald-500/40 bg-emerald-500/10",
    approval: "border-amber-500/50 bg-amber-500/15",
    running: "border-blue-500/40 bg-blue-500/10",
    completed: "border-emerald-500/40 bg-emerald-500/10",
    failed: "border-destructive/40 bg-destructive/10",
  };

  const phase = live?.phase ?? "idle";
  const border = phaseColor[phase] ?? phaseColor.idle;

  return (
    <div className={`rounded-xl border p-4 flex gap-3 ${border}`}>
      {outreachEnabled ? (
        <Rocket className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      )}
      <div className="text-sm flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">
            {outreachEnabled ? "Live outreach" : "Draft-only mode"}
          </p>
          {live?.activeMission && (
            <Badge variant="secondary" className="capitalize">
              {live.activeMission.status.replace(/_/g, " ")}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {isLoading ? "Updating…" : live?.updatedAt ? `Live · ${new Date(live.updatedAt).toLocaleTimeString()}` : ""}
          </span>
        </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {live?.message ??
                (outreachEnabled
                  ? "Live outreach — approve each person and Hermes sends with human-paced timing. Track sent/accepted in Browser Workers."
                  : "Set LINKEDIN_SEND_ON_APPROVE=true in .env, restart browser worker, then approve each draft to send.")}
            </p>
        {live?.activeMission && (
          <div className="flex flex-wrap gap-3 text-xs">
            <span>
              <strong className="text-foreground">{live.browserActions}</strong> browser actions
            </span>
            <span>
              <strong className="text-foreground">{live.connectionsPrepared}</strong>/
              {live.targetCount} prepared
            </span>
            <span>
              <strong className="text-foreground">{live.connectionsSent}</strong> sent
            </span>
            {live.pendingApprovals > 0 && (
              <span className="text-amber-700 dark:text-amber-300">
                {live.pendingApprovals} awaiting approval
              </span>
            )}
            {live.lastTool && (
              <span className="font-mono text-muted-foreground">last: {live.lastTool}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionRow({ mission: m }: { mission: HermesMissionRecord }) {
  const run = useQuery({
    queryKey: ["hermes-run", m.automationRunId],
    queryFn: () =>
      m.automationRunId
        ? getAutomationRunFn({ data: { runId: m.automationRunId } })
        : null,
    enabled: Boolean(m.automationRunId),
    refetchInterval: 5000,
  });

  const toolCalls = useQuery({
    queryKey: ["hermes-tool-calls", m.automationRunId],
    queryFn: () =>
      m.automationRunId
        ? getRunToolCallsFn({ data: { runId: m.automationRunId } })
        : [],
    enabled: Boolean(m.automationRunId),
    refetchInterval: 4000,
  });

  const isStaleRunning =
    (m.status === "running" || run.data?.status === "running") &&
    (toolCalls.data?.length ?? 0) === 0;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-medium">{m.name}</p>
          <p className="text-xs text-muted-foreground">
            {kindLabel(m.kind)} · {m.config.count} profiles · {m.config.audience}
          </p>
        </div>
        <Badge variant="outline">{m.status}</Badge>
      </div>
      {run.data?.plan?.summary && (
        <p className="text-xs text-muted-foreground">{run.data.plan.summary}</p>
      )}
      {m.resultSummary && <p className="text-xs">{m.resultSummary}</p>}
      {m.error && <p className="text-xs text-destructive">{m.error}</p>}
      {isStaleRunning && (
        <p className="text-xs text-amber-700 dark:text-amber-300 rounded-md bg-amber-500/10 border border-amber-500/30 p-2">
          Queued in CRM but no browser actions yet. Pair the desktop agent (Connected), ensure
          browser worker is on port 8820, then launch again. Check{" "}
          <Link to="/browser-workers" className="underline">
            Browser Workers
          </Link>{" "}
          for live steps.
        </p>
      )}
      {(toolCalls.data?.length ?? 0) > 0 && (
        <div className="rounded-md bg-muted/40 p-2 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Live activity</p>
          {toolCalls.data!.slice(0, 6).map((call) => (
            <p key={call.id} className="text-xs font-mono truncate">
              {call.tool} · {call.status}
              {call.error ? ` · ${call.error}` : ""}
            </p>
          ))}
        </div>
      )}
      {m.automationRunId && (
        <Link
          to="/automation"
          className="inline-flex items-center gap-1 text-xs text-primary underline"
        >
          View automation run
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
