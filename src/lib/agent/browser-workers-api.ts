import type { AutomationRunRecord } from "./types";
import type { ConnectionRecord, ToolCallRecord } from "./services/browser-workers";

export interface BrowserWorkersDashboard {
  stats: {
    runsByStatus: Record<string, number>;
    totalToolCalls: number;
    connectionsSent: number;
    pendingApprovals: number;
  };
  connections: ConnectionRecord[];
  hermesConnections: ConnectionRecord[];
  toolCalls: ToolCallRecord[];
  runs: AutomationRunRecord[];
}

/** Client-safe fetch — same payload as getBrowserWorkersDashboardFn. */
export async function fetchBrowserWorkersDashboard(): Promise<BrowserWorkersDashboard> {
  const res = await fetch("/api/agent/browser-workers/dashboard", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load browser workers dashboard (${res.status})`);
  }
  return (await res.json()) as BrowserWorkersDashboard;
}
