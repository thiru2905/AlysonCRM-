import { v4 as uuidv4 } from 'uuid';
import {
  ExtractedRecordSchema,
  FieldValueSchema,
  type ExtractedRecord,
  type ExtractionSchema,
  type FieldValue,
} from '../../shared/schemas.js';

export function validateExtraction(
  raw: unknown,
  schema: ExtractionSchema,
): { ok: true; record: ExtractedRecord } | { ok: false; error: string } {
  const parsed = ExtractedRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const record = parsed.data;
  if (record.recordType !== schema.recordType) {
    return {
      ok: false,
      error: `recordType mismatch: expected ${schema.recordType}, got ${record.recordType}`,
    };
  }

  const fields: Record<string, FieldValue> = {};
  for (const def of schema.fields) {
    const fv = record.fields[def.name];
    if (!fv) {
      if (def.required) {
        fields[def.name] = {
          value: null,
          confidence: 0,
          evidence: 'Field not found in extraction; required but missing — not invented.',
          source_url: record.sourceUrl,
          explanation: 'Missing required field',
        };
      }
      continue;
    }
    const fieldCheck = FieldValueSchema.safeParse(fv);
    if (!fieldCheck.success) {
      return { ok: false, error: `Invalid field ${def.name}: ${fieldCheck.error.message}` };
    }
    // Do not invent: if confidence is high but value empty for required, downgrade
    let value = fieldCheck.data.value;
    if ((value === '' || value === undefined) && def.required) {
      value = null;
    }
    fields[def.name] = { ...fieldCheck.data, value };
  }

  return {
    ok: true,
    record: {
      ...record,
      fields,
      extractedAt: record.extractedAt || new Date().toISOString(),
    },
  };
}

export function newRecordId(): string {
  return uuidv4();
}
