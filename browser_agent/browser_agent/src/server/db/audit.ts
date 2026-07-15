import type { ApprovalDecision } from '../../shared/schemas.js';
import { getDb } from './client.js';

export function insertAuditEvent(input: {
  runId: string;
  userRequest?: string | null;
  model?: string | null;
  toolName?: string | null;
  toolArgsSanitized?: unknown;
  resultSummary?: string | null;
  url?: string | null;
  approvalStatus?: ApprovalDecision | null;
  error?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCostUsd?: number;
}): number {
  const db = getDb();
  const ts = new Date().toISOString();
  const args =
    input.toolArgsSanitized === undefined || input.toolArgsSanitized === null
      ? null
      : typeof input.toolArgsSanitized === 'string'
        ? input.toolArgsSanitized
        : JSON.stringify(sanitizeArgs(input.toolArgsSanitized));

  const result = db
    .prepare(
      `INSERT INTO audit_events (
        run_id, user_request, model, tool_name, tool_args_sanitized, result_summary,
        url, ts, approval_status, error, prompt_tokens, completion_tokens, estimated_cost_usd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.runId,
      input.userRequest ?? null,
      input.model ?? null,
      input.toolName ?? null,
      args,
      truncate(input.resultSummary ?? null, 4000),
      input.url ?? null,
      ts,
      input.approvalStatus ?? null,
      input.error ?? null,
      input.promptTokens ?? 0,
      input.completionTokens ?? 0,
      input.estimatedCostUsd ?? 0,
    );
  return Number(result.lastInsertRowid);
}

export function listAuditEvents(runId?: string, limit = 200) {
  const db = getDb();
  if (runId) {
    return db
      .prepare(
        `SELECT id, run_id as runId, user_request as userRequest, model, tool_name as toolName,
          tool_args_sanitized as toolArgsSanitized, result_summary as resultSummary, url, ts,
          approval_status as approvalStatus, error, prompt_tokens as promptTokens,
          completion_tokens as completionTokens, estimated_cost_usd as estimatedCostUsd
         FROM audit_events WHERE run_id = ? ORDER BY id DESC LIMIT ?`,
      )
      .all(runId, limit);
  }
  return db
    .prepare(
      `SELECT id, run_id as runId, user_request as userRequest, model, tool_name as toolName,
        tool_args_sanitized as toolArgsSanitized, result_summary as resultSummary, url, ts,
        approval_status as approvalStatus, error, prompt_tokens as promptTokens,
        completion_tokens as completionTokens, estimated_cost_usd as estimatedCostUsd
       FROM audit_events ORDER BY id DESC LIMIT ?`,
    )
    .all(limit);
}

const SENSITIVE_KEYS = /pass(word)?|token|secret|authorization|api[_-]?key|cookie|ssn|cvv/i;

export function sanitizeArgs(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitizeArgs(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.test(k) ? '[redacted]' : sanitizeArgs(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) {
    return `${value.slice(0, 500)}…[truncated]`;
  }
  return value;
}

function truncate(s: string | null, max: number): string | null {
  if (s === null) return null;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
