// ---------------------------------------------------------------------------
// Hermes Engine — structured LinkedIn outreach missions
// ---------------------------------------------------------------------------

export type HermesMissionKind =
  | "connect"
  | "message"
  | "connect_and_message"
  | "search_only";

export type HermesMissionStatus =
  | "draft"
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export interface HermesMissionConfig {
  /** Human-readable audience, e.g. "Senior React engineers in Bangalore" */
  audience: string;
  /** Optional LinkedIn people search URL (from branch map or search builder) */
  searchUrl?: string;
  /** How many profiles to process (connections or messages) */
  count: number;
  /** Note appended to connection requests (draft mode) */
  connectionNote?: string;
  /** Message body template — supports {{name}}, {{company}}, {{title}} */
  messageTemplate?: string;
}

export interface HermesMissionRecord {
  id: string;
  name: string;
  kind: HermesMissionKind;
  config: HermesMissionConfig;
  status: HermesMissionStatus;
  automationRunId?: string | null;
  resultSummary?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateHermesMissionInput {
  name: string;
  kind: HermesMissionKind;
  config: HermesMissionConfig;
}

export interface HermesEngineStatus {
  outreachEnabled: boolean;
  maxConnectionsPerDay: number;
  maxConnectionsPerMission: number;
  desktopAgentUrl: string;
  browserAgentUrl: string;
  deepSeekConfigured: boolean;
  plannerSource: "deepseek" | "heuristic";
}
