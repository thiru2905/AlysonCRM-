import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApprovalCard } from "@/components/ai/ApprovalCard";
import { RuntimeHero } from "@/components/runtime/RuntimeHero";
import { useDesktopAgent } from "@/hooks/use-desktop-agent";
import {
  getAutomationRunFn,
  getHermesEngineStatusFn,
  listApprovalsFn,
  listAutomationRunsFn,
  resolveApprovalFn,
  startAutomationFn,
} from "@/lib/agent/server";
import { Bot, Play, RefreshCcw, Rocket, ShieldAlert } from "lucide-react";
import { notifyDone } from "@/lib/actions";

export const Route = createFileRoute("/automation")({
  component: AutomationView,
});

function AutomationView() {
  const [prompt, setPrompt] = useState("");
  const [starting, setStarting] = useState(false);
  const { crmStatus, runtimeOnline } = useDesktopAgent();
  const qc = useQueryClient();

  const runs = useQuery({
    queryKey: ["automation-runs"],
    queryFn: () => listAutomationRunsFn(),
    refetchInterval: 5000,
  });

  const approvals = useQuery({
    queryKey: ["automation-approvals"],
    queryFn: () => listApprovalsFn({ data: {} }),
    refetchInterval: 5000,
  });

  const engineStatus = useQuery({
    queryKey: ["hermes-engine-status"],
    queryFn: () => getHermesEngineStatusFn(),
  });

  const outreachEnabled = engineStatus.data?.outreachEnabled ?? false;

  async function handleStart() {
    if (!prompt.trim()) return;
    setStarting(true);
    try {
      const runId = await startAutomationFn({ data: { prompt: prompt.trim() } });
      notifyDone("Automation started", runId);
      setPrompt("");
      await qc.invalidateQueries({ queryKey: ["automation-runs"] });
    } catch (err) {
      notifyDone("Automation failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setStarting(false);
    }
  }

  return (
    <PageContainer
      title="Automation"
      description="Give Alyson tasks in natural language. Plans, executes one action at a time, and requests approval for sensitive steps."
    >
      <div className="space-y-6">
        <div
          className={`rounded-xl border p-4 flex gap-3 ${
            outreachEnabled
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          {outreachEnabled ? (
            <Rocket className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {outreachEnabled ? "Live LinkedIn outreach" : "LinkedIn account safety"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {outreachEnabled ? (
                <>
                  Hermes sends connection requests in Chrome after you approve each person. Actions use
                  human-paced delays (scroll, pause, ~45s between profiles) to mimic manual browsing.
                  Daily cap: <strong>{engineStatus.data?.maxConnectionsPerDay ?? 10}</strong>.
                </>
              ) : (
                <>
                  Automated connection requests violate LinkedIn&apos;s terms and commonly trigger
                  account restrictions. Set{" "}
                  <code className="text-xs">LINKEDIN_SEND_ON_APPROVE=true</code> in{" "}
                  <code className="text-xs">.env</code> and restart services to enable live outreach.
                </>
              )}
            </p>
          </div>
        </div>

        <RuntimeHero />

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <h2 className="text-sm font-medium">New task</h2>
            <Badge variant="outline" className="ml-auto capitalize">
              {crmStatus.replace(/_/g, " ")}
            </Badge>
            <Badge className={runtimeOnline ? "bg-emerald-600" : ""}>
              {runtimeOnline ? "Desktop online" : "Desktop offline"}
            </Badge>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Open Chrome and find today's leads in CRM"
            rows={3}
          />
          <Button onClick={handleStart} disabled={starting || !prompt.trim()}>
            <Play className="h-4 w-4" />
            {starting ? "Starting…" : "Run task"}
          </Button>
        </div>

        {approvals.data?.length ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Pending approvals</h2>
            {approvals.data.map((approval) => (
              <ApprovalCard
                key={approval.id}
                worker="Alyson"
                title={approval.title}
                rationale={approval.description}
                confidence={approval.riskLevel === "critical" ? 0.4 : 0.75}
                onApprove={async () => {
                  await resolveApprovalFn({
                    data: { approvalId: approval.id, status: "approved" },
                  });
                  await qc.invalidateQueries({ queryKey: ["automation-approvals"] });
                }}
                onReject={async () => {
                  await resolveApprovalFn({
                    data: { approvalId: approval.id, status: "rejected" },
                  });
                  await qc.invalidateQueries({ queryKey: ["automation-approvals"] });
                }}
              >
                <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                  {JSON.stringify(approval.payload, null, 2)}
                </pre>
              </ApprovalCard>
            ))}
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Recent runs</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => qc.invalidateQueries({ queryKey: ["automation-runs"] })}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {(runs.data ?? []).map((run) => (
              <RunRow key={run.id} runId={run.id} />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function RunRow({
  runId,
}: {
  runId: string;
}) {
  const run = useQuery({
    queryKey: ["automation-run", runId],
    queryFn: () => getAutomationRunFn({ data: { runId } }),
    refetchInterval: 5000,
  });

  if (!run.data) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate">{run.data.userPrompt}</p>
        <Badge variant="outline">{run.data.status}</Badge>
      </div>
      {run.data.plan?.summary && (
        <p className="text-xs text-muted-foreground mt-1">{run.data.plan.summary}</p>
      )}
      {run.data.resultSummary && (
        <p className="text-xs mt-2">{run.data.resultSummary}</p>
      )}
      {run.data.error && (
        <p className="text-xs text-destructive mt-1">{run.data.error}</p>
      )}
    </div>
  );
}
