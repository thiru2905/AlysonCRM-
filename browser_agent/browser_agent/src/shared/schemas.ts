import { z } from 'zod';

export const FieldTypeSchema = z.enum(['string', 'number', 'url', 'email', 'boolean']);

export const ExtractionFieldDefSchema = z.object({
  name: z.string().min(1),
  type: FieldTypeSchema.default('string'),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export const ExtractionSchemaSchema = z.object({
  recordType: z.string().min(1),
  fields: z.array(ExtractionFieldDefSchema).min(1),
  authorizedBusinessPurpose: z.string().optional(),
});

export const FieldValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  source_url: z.string().url().or(z.literal('')),
  explanation: z.string().optional(),
});

export const ExtractedRecordSchema = z.object({
  recordType: z.string(),
  sourceUrl: z.string(),
  pageTitle: z.string(),
  extractedAt: z.string(),
  fields: z.record(z.string(), FieldValueSchema),
  selectors: z.record(z.string(), z.string()).optional(),
});

export const TaskPermissionsSchema = z.object({
  allowFollowLinks: z.boolean().default(false),
  allowExport: z.boolean().default(true),
  maxPages: z.number().int().min(1).max(20).default(1),
  writeApprovalRequired: z.boolean().default(true),
});

export const NewTaskRequestSchema = z.object({
  startingUrl: z.string().url(),
  objective: z.string().min(1),
  extractionSchema: ExtractionSchemaSchema,
  permissions: TaskPermissionsSchema.default({}),
  crmEndpoint: z.string().url().optional().or(z.literal('')),
  budgetUsd: z.number().positive().optional(),
  maxIterations: z.number().int().positive().optional(),
});

export const OperationClassSchema = z.enum(['READ', 'NAVIGATE', 'WRITE', 'SENSITIVE']);

export const ApprovalDecisionSchema = z.enum(['pending', 'approved', 'denied', 'auto']);

export const RunStatusSchema = z.enum([
  'queued',
  'running',
  'awaiting_approval',
  'completed',
  'stopped',
  'failed',
  'denied',
  'budget_exceeded',
  'max_steps',
  'timed_out',
]);

export const RecordApprovalSchema = z.enum(['pending', 'approved', 'rejected']);

export type FieldType = z.infer<typeof FieldTypeSchema>;
export type ExtractionFieldDef = z.infer<typeof ExtractionFieldDefSchema>;
export type ExtractionSchema = z.infer<typeof ExtractionSchemaSchema>;
export type FieldValue = z.infer<typeof FieldValueSchema>;
export type ExtractedRecord = z.infer<typeof ExtractedRecordSchema>;
export type TaskPermissions = z.infer<typeof TaskPermissionsSchema>;
export type NewTaskRequest = z.infer<typeof NewTaskRequestSchema>;
export type OperationClass = z.infer<typeof OperationClassSchema>;
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type RecordApproval = z.infer<typeof RecordApprovalSchema>;
