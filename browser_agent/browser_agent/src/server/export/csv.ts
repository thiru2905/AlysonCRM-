import type { ExtractedRecord } from '../../shared/schemas.js';

export function recordsToCsv(records: Array<ExtractedRecord & { id?: string; approval?: string }>): string {
  const fieldNames = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r.fields)) fieldNames.add(k);
  }
  const fields = [...fieldNames];
  const header = [
    'id',
    'record_type',
    'source_url',
    'page_title',
    'extracted_at',
    'approval',
    ...fields.flatMap((f) => [`${f}`, `${f}__confidence`, `${f}__evidence`]),
  ];

  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const rows = records.map((r) => {
    const cols: string[] = [
      escape(r.id ?? ''),
      escape(r.recordType),
      escape(r.sourceUrl),
      escape(r.pageTitle),
      escape(r.extractedAt),
      escape(r.approval ?? ''),
    ];
    for (const f of fields) {
      const fv = r.fields[f];
      cols.push(escape(fv?.value ?? ''), escape(fv?.confidence ?? ''), escape(fv?.evidence ?? ''));
    }
    return cols.join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
