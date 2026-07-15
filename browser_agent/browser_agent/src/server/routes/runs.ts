import { Router } from 'express';
import {
  getActiveRun,
  listRunsFromDb,
  requestStop,
  resolveApproval,
  subscribe,
} from '../agent/host.js';
import { getDb } from '../db/client.js';

export const runsRouter = Router();

runsRouter.get('/', (_req, res) => {
  res.json({ runs: listRunsFromDb() });
});

runsRouter.get('/:id', (req, res) => {
  const row = getDb()
    .prepare(
      `SELECT id, status, starting_url as startingUrl, objective, model, created_at as createdAt,
        updated_at as updatedAt, current_url as currentUrl, current_step as currentStep,
        max_iterations as maxIterations, spent_usd as spentUsd, budget_usd as budgetUsd,
        prompt_tokens as promptTokens, completion_tokens as completionTokens, error,
        extraction_schema_json as extractionSchemaJson, permissions_json as permissionsJson
       FROM runs WHERE id = ?`,
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Run not found' });
  const active = getActiveRun(req.params.id);
  res.json({
    ...row,
    pendingApproval: active?.pendingApproval ?? null,
  });
});

runsRouter.get('/:id/events', (req, res) => {
  const runId = req.params.id;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({ type: 'status', runId, ts: new Date().toISOString(), message: 'SSE connected' });

  const unsub = subscribe(runId, (event) => send(event));
  const active = getActiveRun(runId);
  if (active?.pendingApproval) {
    send({
      type: 'approval_required',
      runId,
      ts: new Date().toISOString(),
      message: active.pendingApproval.reason,
      data: {
        approvalId: active.pendingApproval.id,
        toolName: active.pendingApproval.toolName,
        toolArgs: active.pendingApproval.toolArgs,
        operationClass: active.pendingApproval.operationClass,
      },
    });
  }

  const heartbeat = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsub();
  });
});

runsRouter.post('/:id/stop', (req, res) => {
  const ok = requestStop(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Active run not found' });
  res.json({ ok: true });
});

runsRouter.post('/:id/approvals/:approvalId', (req, res) => {
  const decision = req.body?.decision;
  if (decision !== 'approved' && decision !== 'denied') {
    return res.status(400).json({ error: 'decision must be approved or denied' });
  }
  const ok = resolveApproval(req.params.id, req.params.approvalId, decision);
  if (!ok) return res.status(404).json({ error: 'Pending approval not found' });
  res.json({ ok: true, decision });
});
