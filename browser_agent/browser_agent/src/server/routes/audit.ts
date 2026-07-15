import { Router } from 'express';
import { listAuditEvents } from '../db/audit.js';
import { getDb } from '../db/client.js';

export const auditRouter = Router();

auditRouter.get('/', (req, res) => {
  const runId = typeof req.query.runId === 'string' ? req.query.runId : undefined;
  const events = listAuditEvents(runId);
  const screenshots = runId
    ? getDb()
        .prepare(
          `SELECT id, run_id as runId, path, url, created_at as createdAt FROM screenshots WHERE run_id = ? ORDER BY created_at DESC`,
        )
        .all(runId)
    : getDb()
        .prepare(
          `SELECT id, run_id as runId, path, url, created_at as createdAt FROM screenshots ORDER BY created_at DESC LIMIT 50`,
        )
        .all();
  res.json({ events, screenshots });
});
