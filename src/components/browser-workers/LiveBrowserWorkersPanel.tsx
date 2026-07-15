import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchBrowserWorkersDashboard } from "@/lib/agent/browser-workers-api";
import { refreshHermesConnectionStatusesFn } from "@/lib/agent/server";
import {
  inviteStatusLabel,
  inviteStatusTone,
  type InviteStatus,
} from "@/lib/agent/connection-status";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Link2, MousePointerClick, RefreshCcw, UserPlus } from "lucide-react";
import { notifyDone } from "@/lib/actions";

const STATUS_COLOR: Record<string, string> = {
  running: "bg-blue-600",
  completed: "bg-emerald-600",
  failed: "bg-destructive",
  awaiting_approval: "bg-amber-500",
  connection_sent: "bg-emerald-600",
  connected: "bg-emerald-600",
  pending: "bg-muted text-foreground",
  new: "bg-muted text-foreground",
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function LiveBrowserWorkersPanel() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const dash = useQuery({
    queryKey: ["browser-workers-dashboard"],
    queryFn: () => fetchBrowserWorkersDashboard(),
    refetchInterval: 3000,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const data = dash.data;
  const stats = data?.stats;
  const hermes = data?.hermesConnections ?? [];
  const sentCount = hermes.filter((c) => c.requestSent).length;
  const acceptedCount = hermes.filter((c) => c.inviteStatus === "accepted").length;
  const pendingAcceptCount = hermes.filter((c) => c.inviteStatus === "sent_pending").length;

  async function handleRefreshStatuses() {
    setRefreshing(true);
    try {
      const result = await refreshHermesConnectionStatusesFn();
      notifyDone(
        "LinkedIn statuses refreshed",
        `${result.checked} checked · ${result.accepted} accepted · ${result.stillPending} still pending`
      );
      await qc.invalidateQueries({ queryKey: ["browser-workers-dashboard"] });
      await qc.invalidateQueries({ queryKey: ["hermes-live-status"] });
    } catch (err) {
      notifyDone(
        "Refresh failed",
        err instanceof Error ? err.message : "Could not reach browser worker"
      );
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      {dash.isError && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          Could not load activity data. Hard-refresh the page or restart the CRM dev server.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Running tasks", value: stats?.runsByStatus?.running ?? 0, icon: Clock },
          { label: "Actions taken", value: stats?.totalToolCalls ?? 0, icon: MousePointerClick },
          { label: "Requests sent", value: sentCount, icon: UserPlus },
          { label: "Awaiting approval", value: stats?.pendingApprovals ?? 0, icon: Link2 },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <item.icon className="h-3.5 w-3.5" />
              <span className="text-xs">{item.label}</span>
            </div>
            <p className="text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-medium">Live task execution</h3>
          <p className="text-xs text-muted-foreground">Updates every few seconds</p>
        </div>
        <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
          {(data?.runs ?? []).map((run) => (
            <div key={run.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm truncate">{run.userPrompt}</p>
                <Badge className={cn("shrink-0 capitalize", STATUS_COLOR[run.status] ?? "")}>
                  {run.status.replace(/_/g, " ")}
                </Badge>
              </div>
              {run.resultSummary && (
                <p className="text-xs text-muted-foreground mt-1">{run.resultSummary}</p>
              )}
            </div>
          ))}
          {!data?.runs?.length && (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">No runs yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-medium">Recent browser actions</h3>
        </div>
        <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
          {(data?.toolCalls ?? []).map((call) => (
            <div key={call.id} className="px-4 py-2.5 flex items-start gap-3">
              <CheckCircle2
                className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  call.status === "success" ? "text-emerald-600" : "text-destructive"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs">{call.tool}</code>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(call.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {(call.tool === "linkedin.extract_search_profiles" ||
                  call.tool === "linkedin.search_people") &&
                  (call.result as { data?: { count?: number } }).data?.count != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Extracted {(call.result as { data?: { count?: number } }).data?.count} profile(s)
                    </p>
                  )}
                {(call.result as { data?: { name?: string } }).data?.name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(call.result as { data?: { name?: string; status?: string; company?: string } }).data?.name}
                    {(call.result as { data?: { company?: string } }).data?.company
                      ? ` · ${(call.result as { data?: { company?: string } }).data?.company}`
                      : null}
                    {(call.tool === "linkedin.send_connection_request" ||
                      call.tool === "linkedin.connect_from_search") &&
                    (call.result as { data?: { status?: string } }).data?.status
                      ? ` · ${(call.result as { data?: { status?: string } }).data?.status}`
                      : null}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!data?.toolCalls?.length && (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">No actions yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-primary/30 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-primary/5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Hermes connection outreach</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Who received a request, whether it was sent, and if they accepted · live every 3s
            </p>
            <p className="text-xs mt-1">
              <strong>{sentCount}</strong> sent · <strong>{acceptedCount}</strong> accepted ·{" "}
              <strong>{pendingAcceptCount}</strong> waiting on LinkedIn
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshStatuses}
            disabled={refreshing || hermes.length === 0}
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Checking LinkedIn…" : "Refresh accept status"}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Mission</th>
                <th className="text-left px-4 py-2">Request sent?</th>
                <th className="text-left px-4 py-2">LinkedIn response</th>
                <th className="text-left px-4 py-2">Sent at</th>
                <th className="text-left px-4 py-2">Accepted at</th>
              </tr>
            </thead>
            <tbody>
              {hermes.map((c) => (
                <HermesConnectionRow key={c.prospectId} connection={c} />
              ))}
            </tbody>
          </table>
          {!hermes.length && (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">
              No Hermes connections yet. Launch a mission, approve drafts, then people appear here
              with sent / accepted status.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-medium">All LinkedIn connections</h3>
          <p className="text-xs text-muted-foreground">Who Alyson reached out to and their status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Company</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.connections ?? []).map((c) => (
                <tr key={c.prospectId} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <a
                      href={c.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {c.name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{c.title ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.company ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Badge
                      className={cn(
                        "capitalize border-0",
                        inviteStatusTone(c.inviteStatus as InviteStatus)
                      )}
                    >
                      {inviteStatusLabel(c.inviteStatus as InviteStatus)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.connections?.length && (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">
              No connections recorded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function HermesConnectionRow({
  connection: c,
}: {
  connection: {
    prospectId: string;
    name: string;
    profileUrl: string;
    missionName: string | null;
    inviteStatus: string;
    requestSent: boolean;
    sentAt: string | null;
    acceptedAt: string | null;
  };
}) {
  const invite = c.inviteStatus as InviteStatus;
  return (
    <tr className="border-t border-border/60">
      <td className="px-4 py-2">
        <a
          href={c.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          {c.name}
        </a>
      </td>
      <td className="px-4 py-2 text-muted-foreground text-xs">{c.missionName ?? "Hermes"}</td>
      <td className="px-4 py-2">
        <Badge variant={c.requestSent ? "default" : "outline"}>
          {c.requestSent ? "Yes" : "No"}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <Badge className={cn("capitalize border-0", inviteStatusTone(invite))}>
          {inviteStatusLabel(invite)}
        </Badge>
      </td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{formatWhen(c.sentAt)}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{formatWhen(c.acceptedAt)}</td>
    </tr>
  );
}
