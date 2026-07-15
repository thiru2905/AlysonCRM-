import type {
  ApprovalDecision,
  ExtractedRecord,
  ExtractionSchema,
  OperationClass,
  RunStatus,
  TaskPermissions,
} from './schemas.js';

export type AgentEventType =
  | 'status'
  | 'step'
  | 'tool_proposed'
  | 'approval_required'
  | 'tool_result'
  | 'extraction'
  | 'budget_warn'
  | 'error'
  | 'done';

export type AgentEvent = {
  type: AgentEventType;
  runId: string;
  ts: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type PendingApproval = {
  id: string;
  runId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  operationClass: OperationClass;
  reason: string;
  createdAt: string;
};

export type CompactPageState = {
  url: string;
  title: string;
  summary: string;
  pagesVisited: number;
};

export type RunSummary = {
  id: string;
  status: RunStatus;
  startingUrl: string;
  objective: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  currentUrl: string | null;
  currentStep: number;
  maxIterations: number;
  spentUsd: number;
  budgetUsd: number;
  promptTokens: number;
  completionTokens: number;
  error: string | null;
};

export type SetupStatus = {
  apiKeyConfigured: boolean;
  model: string;
  mcpConnected: boolean;
  chromeReachable: boolean;
  chromeMode: 'launch' | 'attach' | 'disconnected';
  userDataDir: string;
  browserUrl: string | null;
  activeTab: { url: string; title: string } | null;
};

export type TaskConfig = {
  startingUrl: string;
  objective: string;
  extractionSchema: ExtractionSchema;
  permissions: TaskPermissions;
  crmEndpoint?: string;
  budgetUsd: number;
  maxIterations: number;
};

export type AuditEventRow = {
  id: number;
  runId: string;
  userRequest: string | null;
  model: string | null;
  toolName: string | null;
  toolArgsSanitized: string | null;
  resultSummary: string | null;
  url: string | null;
  ts: string;
  approvalStatus: ApprovalDecision | null;
  error: string | null;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
};

export type ExtractedRecordRow = ExtractedRecord & {
  id: string;
  runId: string;
  approval: 'pending' | 'approved' | 'rejected';
};
