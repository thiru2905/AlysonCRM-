import { Router } from 'express';
import { getDb } from '../db/client.js';
import { recordsToCsv } from '../export/csv.js';
import { pushToCrm } from '../export/crm.js';
import type { ExtractedRecord } from '../../shared/schemas.js';

export const resultsRouter = Router();

function mapRecord(row: Record<string, unknown>): ExtractedRecord & {
  id: string;
  runId: string;
  approval: 'pending' | 'approved' | 'rejected';
} {
  return {
    id: String(row.id),
    runId: String(row.runId),
    recordType: String(row.recordType),
    sourceUrl: String(row.sourceUrl),
    pageTitle: String(row.pageTitle),
    extractedAt: String(row.extractedAt),
    fields: JSON.parse(String(row.fieldsJson)),
    selectors: row.selectorsJson ? JSON.parse(String(row.selectorsJson)) : undefined,
    approval: row.approval as 'pending' | 'approved' | 'rejected',
  };
}

resultsRouter.get('/', (req, res) => {
  const runId = typeof req.query.runId === 'string' ? req.query.runId : null;
  const db = getDb();
  const rows = runId
    ? db
        .prepare(
          `SELECT id, run_id as runId, record_type as recordType, source_url as sourceUrl,
            page_title as pageTitle, extracted_at as extractedAt, fields_json as fieldsJson,
            selectors_json as selectorsJson, approval
           FROM extracted_records WHERE run_id = ? ORDER BY extracted_at DESC`,
        )
        .all(runId)
    : db
        .prepare(
          `SELECT id, run_id as runId, record_type as recordType, source_url as sourceUrl,
            page_title as pageTitle, extracted_at as extractedAt, fields_json as fieldsJson,
            selectors_json as selectorsJson, approval
           FROM extracted_records ORDER BY extracted_at DESC LIMIT 200`,
        )
        .all();

  res.json({ records: rows.map((r) => mapRecord(r as Record<string, unknown>)) });
});

resultsRouter.get('/export.csv', (req, res) => {
  const runId = typeof req.query.runId === 'string' ? req.query.runId : null;
  const approvedOnly = req.query.approvedOnly !== 'false';
  const db = getDb();
  let sql = `SELECT id, run_id as runId, record_type as recordType, source_url as sourceUrl,
    page_title as pageTitle, extracted_at as extractedAt, fields_json as fieldsJson,
    selectors_json as selectorsJson, approval FROM extracted_records WHERE 1=1`;
  const params: string[] = [];
  if (runId) {
    sql += ' AND run_id = ?';
    params.push(runId);
  }
  if (approvedOnly) {
    sql += ` AND approval = 'approved'`;
  }
  sql += ' ORDER BY extracted_at DESC';
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const records = rows.map(mapRecord);
  const csv = recordsToCsv(records);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="browser-agent-export.csv"');
  res.send(csv);
});

resultsRouter.post('/:id/approve', (req, res) => {
  const decision = req.body?.decision;
  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }
  const result = getDb()
    .prepare(`UPDATE extracted_records SET approval = ? WHERE id = ?`)
    .run(decision, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Record not found' });
  res.json({ ok: true, decision });
});

resultsRouter.post('/:id/crm', async (req, res) => {
  const row = getDb()
    .prepare(
      `SELECT id, run_id as runId, record_type as recordType, source_url as sourceUrl,
        page_title as pageTitle, extracted_at as extractedAt, fields_json as fieldsJson,
        selectors_json as selectorsJson, approval FROM extracted_records WHERE id = ?`,
    )
    .get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: 'Record not found' });
  const record = mapRecord(row);
  if (record.approval !== 'approved') {
    return res.status(403).json({ error: 'Record must be approved before CRM push' });
  }
  const run = getDb()
    .prepare(`SELECT crm_endpoint as crmEndpoint FROM runs WHERE id = ?`)
    .get(record.runId) as { crmEndpoint: string | null } | undefined;
  const result = await pushToCrm(record, req.body?.endpoint || run?.crmEndpoint);
  if (!result.ok) {
    return res.status(502).json(result);
  }
  res.json(result);
});
