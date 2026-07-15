import { getConfig } from '../config.js';
import type { ExtractedRecord } from '../../shared/schemas.js';

export async function pushToCrm(
  record: ExtractedRecord,
  endpointOverride?: string | null,
): Promise<{ ok: boolean; status: number; body: string }> {
  const cfg = getConfig();
  const endpoint = (endpointOverride || cfg.crmEndpoint || '').trim();
  if (!endpoint) {
    return { ok: false, status: 0, body: 'CRM_ENDPOINT is not configured' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg.crmApiKey) {
    headers.Authorization = `Bearer ${cfg.crmApiKey}`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recordType: record.recordType,
      sourceUrl: record.sourceUrl,
      pageTitle: record.pageTitle,
      extractedAt: record.extractedAt,
      fields: record.fields,
    }),
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 2000) };
}
