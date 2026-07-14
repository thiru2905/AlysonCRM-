import { ProviderApiRequest, ProviderId } from "./types";

// ---------------------------------------------------------------------------
// Provider API usage tracking.
//
// Every provider call is recorded here in an in-memory ring buffer so the API
// Usage page works out of the box. Swap `recordUsage` / `listUsage` for a
// database-backed implementation when persistence is required.
// ---------------------------------------------------------------------------

const MEMORY_LIMIT = 500;
const memory: ProviderApiRequest[] = [];

// Rough per-provider credit estimates per returned record.
const CREDIT_PER_RECORD: Record<ProviderId, number> = {
  mock: 0,
  coresignal: 1,
  pdl: 1,
};

export interface RecordUsageInput {
  provider: ProviderId;
  endpoint: string;
  returnedRecords: number;
  httpStatus: number;
  responseTimeMs: number;
  estimatedCredits?: number;
  errorMessage?: string;
}

export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const entry: ProviderApiRequest = {
    id: crypto.randomUUID(),
    provider: input.provider,
    endpoint: input.endpoint,
    requestDate: new Date().toISOString(),
    returnedRecords: input.returnedRecords,
    httpStatus: input.httpStatus,
    responseTimeMs: input.responseTimeMs,
    estimatedCredits:
      input.estimatedCredits ??
      input.returnedRecords * (CREDIT_PER_RECORD[input.provider] ?? 0),
    errorMessage: input.errorMessage,
  };

  memory.unshift(entry);
  if (memory.length > MEMORY_LIMIT) memory.length = MEMORY_LIMIT;
}

export interface UsageSummary {
  totalRequests: number;
  totalRecords: number;
  totalCredits: number;
  errorCount: number;
  avgResponseTimeMs: number;
  byProvider: Record<string, { requests: number; credits: number; records: number }>;
}

export async function listUsage(limit = 100): Promise<ProviderApiRequest[]> {
  return memory.slice(0, limit);
}

export function summarizeUsage(rows: ProviderApiRequest[]): UsageSummary {
  const summary: UsageSummary = {
    totalRequests: rows.length,
    totalRecords: 0,
    totalCredits: 0,
    errorCount: 0,
    avgResponseTimeMs: 0,
    byProvider: {},
  };
  let totalTime = 0;
  for (const r of rows) {
    summary.totalRecords += r.returnedRecords;
    summary.totalCredits += r.estimatedCredits;
    if (r.httpStatus >= 400) summary.errorCount++;
    totalTime += r.responseTimeMs;
    const p = (summary.byProvider[r.provider] ??= {
      requests: 0,
      credits: 0,
      records: 0,
    });
    p.requests++;
    p.credits += r.estimatedCredits;
    p.records += r.returnedRecords;
  }
  summary.avgResponseTimeMs = rows.length ? Math.round(totalTime / rows.length) : 0;
  summary.totalCredits = Math.round(summary.totalCredits * 100) / 100;
  return summary;
}
