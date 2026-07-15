import { describe, expect, it } from 'vitest';
import { validateExtraction } from '../src/server/extraction/engine.js';
import { ExtractionSchemaSchema } from '../src/shared/schemas.js';
import sampleSchema from '../samples/extraction-schema.json';

describe('extraction schema validation', () => {
  it('parses sample schema', () => {
    const parsed = ExtractionSchemaSchema.parse(sampleSchema);
    expect(parsed.recordType).toBe('professional_profile');
    expect(parsed.fields.some((f) => f.name === 'full_name' && f.required)).toBe(true);
  });

  it('accepts valid extraction with evidence', () => {
    const result = validateExtraction(
      {
        recordType: 'professional_profile',
        pageTitle: 'Sample',
        sourceUrl: 'http://127.0.0.1:8820/samples/example-page.html',
        extractedAt: new Date().toISOString(),
        fields: {
          full_name: {
            value: 'Alex Rivera',
            confidence: 0.95,
            evidence: 'h1#full-name text',
            source_url: 'http://127.0.0.1:8820/samples/example-page.html',
          },
          headline: {
            value: 'Senior Product Manager · B2B SaaS',
            confidence: 0.9,
            evidence: '#headline',
            source_url: 'http://127.0.0.1:8820/samples/example-page.html',
          },
        },
      },
      ExtractionSchemaSchema.parse(sampleSchema),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.fields.full_name.value).toBe('Alex Rivera');
    }
  });

  it('does not invent missing required fields', () => {
    const result = validateExtraction(
      {
        recordType: 'professional_profile',
        pageTitle: 'Sample',
        sourceUrl: 'http://127.0.0.1:8820/samples/example-page.html',
        extractedAt: new Date().toISOString(),
        fields: {},
      },
      ExtractionSchemaSchema.parse(sampleSchema),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.fields.full_name.value).toBeNull();
      expect(result.record.fields.full_name.confidence).toBe(0);
      expect(result.record.fields.full_name.evidence).toMatch(/not invented/i);
    }
  });

  it('rejects wrong recordType', () => {
    const result = validateExtraction(
      {
        recordType: 'other',
        pageTitle: 'x',
        sourceUrl: 'http://example.com',
        extractedAt: new Date().toISOString(),
        fields: {
          full_name: {
            value: 'A',
            confidence: 1,
            evidence: 'e',
            source_url: 'http://example.com',
          },
        },
      },
      ExtractionSchemaSchema.parse(sampleSchema),
    );
    expect(result.ok).toBe(false);
  });
});
