// ---------------------------------------------------------------------------
// Alyson Agent Platform — shared types
// ---------------------------------------------------------------------------

export type DeviceStatus =
  | "not_installed"
  | "downloading"
  | "installed"
  | "waiting_for_pairing"
  | "connected"
  | "disconnected"
  | "update_required"
  | "failed";

export type AutomationRunStatus =
  | "pending"
  | "planning"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "edited";

export interface ToolCallResult {
  tool: string;
  status: "success" | "error" | "pending_approval";
  timestamp: string;
  screenshot?: string | null;
  error?: string | null;
  data?: unknown;
}

export interface AgentPlanStep {
  id: string;
  action: string;
  description: string;
  tool?: string;
  args?: Record<string, unknown>;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
}

export interface AgentPlan {
  summary: string;
  steps: AgentPlanStep[];
}

export interface DesktopAgentRecord {
  id: string;
  name: string;
  platform: string;
  version: string | null;
  status: string;
  lastSeenAt: string | null;
  pairedAt: string | null;
}

export interface AutomationRunRecord {
  id: string;
  userPrompt: string;
  status: AutomationRunStatus;
  plan?: AgentPlan | null;
  resultSummary?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequestRecord {
  id: string;
  runId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: string;
}

export interface LinkedInCampaignRecord {
  id: string;
  name: string;
  targetAudience: string | null;
  dailyLimit: number;
  status: string;
  sequence: SequenceStep[];
  createdAt: string;
}

export interface LinkedInProspectRecord {
  id: string;
  campaignId: string | null;
  name: string;
  profileUrl: string;
  company: string | null;
  title: string | null;
  location: string | null;
  status: string;
  createdAt?: string;
  lastActionAt?: string | null;
  missionId?: string | null;
  missionName?: string | null;
  missionAudience?: string | null;
  missionStatus?: string | null;
  inviteStatus?: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
}

export interface ProfileActionRecord {
  id: string;
  actionType: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export interface ProfileMessageRecord {
  id: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface ProfileDetailRecord extends LinkedInProspectRecord {
  actions: ProfileActionRecord[];
  messages: ProfileMessageRecord[];
  draftMessage: string | null;
}

export interface SequenceStep {
  type:
    | "view_profile"
    | "wait"
    | "connection_request"
    | "message"
    | "follow_up"
    | "stop_if_reply";
  delayHours?: number;
  requiresApproval?: boolean;
  messageTemplate?: string;
}

export type AgentWsEvent =
  | { type: "agent.connected"; deviceId: string }
  | { type: "agent.heartbeat"; deviceId: string; status: string }
  | { type: "automation.started"; runId: string }
  | { type: "automation.step.started"; runId: string; stepId: string; action: string }
  | { type: "automation.step.completed"; runId: string; stepId: string; result: ToolCallResult }
  | { type: "approval.required"; runId: string; approvalId: string; title: string }
  | { type: "automation.completed"; runId: string; summary: string }
  | { type: "automation.failed"; runId: string; error: string };
