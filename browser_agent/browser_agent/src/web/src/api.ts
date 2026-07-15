export type SetupStatus = {
  apiKeyConfigured: boolean;
  model: string;
  mcpConnected: boolean;
  chromeReachable: boolean;
  chromeMode: string;
  userDataDir: string;
  browserUrl: string | null;
  activeTab: { url: string; title: string } | null;
};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as T;
}

export const api = {
  setupStatus: () => req<SetupStatus>('/api/setup/status'),
  connect: (mode: 'launch' | 'attach') =>
    req<{ ok: boolean; toolCount: number }>('/api/setup/connect', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  disconnect: () => req<{ ok: boolean }>('/api/setup/disconnect', { method: 'POST' }),
  createTask: (body: unknown) =>
    req<{ runId: string; estimatedMaxCost: number; maxIterations: number }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getRun: (id: string) => req<Record<string, unknown>>(`/api/runs/${id}`),
  listRuns: () => req<{ runs: Record<string, unknown>[] }>('/api/runs'),
  stopRun: (id: string) => req<{ ok: boolean }>(`/api/runs/${id}/stop`, { method: 'POST' }),
  decideApproval: (runId: string, approvalId: string, decision: 'approved' | 'denied') =>
    req<{ ok: boolean }>(`/api/runs/${runId}/approvals/${approvalId}`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),
  listResults: (runId?: string) =>
    req<{ records: Record<string, unknown>[] }>(
      runId ? `/api/results?runId=${encodeURIComponent(runId)}` : '/api/results',
    ),
  approveRecord: (id: string, decision: 'approved' | 'rejected') =>
    req<{ ok: boolean }>(`/api/results/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),
  pushCrm: (id: string) =>
    req<{ ok: boolean; status: number; body: string }>(`/api/results/${id}/crm`, {
      method: 'POST',
      body: '{}',
    }),
  audit: (runId?: string) =>
    req<{ events: Record<string, unknown>[]; screenshots: Record<string, unknown>[] }>(
      runId ? `/api/audit?runId=${encodeURIComponent(runId)}` : '/api/audit',
    ),
  exportCsvUrl: (runId?: string, approvedOnly = true) => {
    const q = new URLSearchParams();
    if (runId) q.set('runId', runId);
    q.set('approvedOnly', String(approvedOnly));
    return `/api/results/export.csv?${q.toString()}`;
  },
};
