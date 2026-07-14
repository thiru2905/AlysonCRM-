/**
 * Alyson Workers — the digital workforce.
 * Every worker executes tasks. Some are human, most are not.
 */

export type WorkerType =
  | "human"
  | "ai_agent"
  | "browser"
  | "api"
  | "automation"
  | "tool";

export type WorkerStatus = "active" | "idle" | "paused" | "learning" | "offline";

export interface WorkerSkill {
  name: string;
  level: number; // 0..1
}

export interface WorkerPerformance {
  successRate: number; // 0..1
  tasksCompleted: number;
  avgLatencyMs: number; // speed
  costPerTaskUsd: number;
  qualityScore: number; // 0..1, human-rated
  trend7d: number[]; // sparkline points 0..1
}

export interface WorkerAssignment {
  id: string;
  kind: "project" | "task";
  label: string;
  meta?: string;
  status?: "in_progress" | "queued" | "blocked" | "review" | "done";
}

export interface LearningEvent {
  id: string;
  at: string; // ISO
  kind: "training" | "feedback" | "correction" | "policy_update" | "promotion";
  summary: string;
  delta?: string; // e.g. "+3.1% success"
}

export interface ExperimentRef {
  id: string;
  name: string;
  status: "running" | "won" | "lost" | "inconclusive";
  metric: string;
}

export interface PredictionRef {
  id: string;
  statement: string;
  confidence: number; // 0..1
  horizon: string;
}

export interface CollaborationEdge {
  from: string; // worker id
  to: string; // worker id
  label: string; // "delegates", "escalates to", "reviews"
  weight: number; // 1..5
}

export interface Worker {
  id: string;
  name: string;
  handle: string; // @alyson-handle
  type: WorkerType;
  status: WorkerStatus;
  title: string; // "Outbound SDR", "Lease Scout"
  bio: string;
  manager?: string; // worker id
  reports?: string[]; // worker ids
  version?: string;
  authorityScope: string[]; // e.g. ["Leads · read/write", "Email · draft only"]
  approvalThreshold: number; // 0..1 — needs human above this blast radius
  skills: WorkerSkill[];
  performance: WorkerPerformance;
  assignments: WorkerAssignment[];
  learning: LearningEvent[];
  experiments: ExperimentRef[];
  predictions: PredictionRef[];
  tools: string[]; // integrations this worker can invoke
  createdAt: string;
}

export const WORKER_TYPES: Record<
  WorkerType,
  { label: string; description: string }
> = {
  human: { label: "Human", description: "A person on your team." },
  ai_agent: {
    label: "AI Agent",
    description: "Reasoning worker with tools and memory.",
  },
  browser: {
    label: "Browser Worker",
    description: "Drives a real browser session end-to-end.",
  },
  api: {
    label: "API Worker",
    description: "Calls external APIs on a schedule or trigger.",
  },
  automation: {
    label: "Automation",
    description: "Deterministic workflow across systems.",
  },
  tool: {
    label: "Tool Worker",
    description: "A single-purpose function exposed to other workers.",
  },
};

// ---------- Seed data ----------

export const WORKERS: Worker[] = [
  {
    id: "w_atlas",
    name: "Atlas",
    handle: "@atlas",
    type: "ai_agent",
    status: "active",
    title: "Outbound Research Lead",
    bio: "Prospects, enriches and drafts first-touch sequences. Escalates any account over $50k ACV.",
    reports: ["w_scout", "w_mailer"],
    version: "v4.2",
    authorityScope: [
      "Leads · read/write",
      "Email · draft only",
      "Spend · $40 / day",
    ],
    approvalThreshold: 0.72,
    skills: [
      { name: "Prospect research", level: 0.94 },
      { name: "ICP scoring", level: 0.88 },
      { name: "Copywriting", level: 0.79 },
      { name: "Sequence design", level: 0.83 },
    ],
    performance: {
      successRate: 0.91,
      tasksCompleted: 2143,
      avgLatencyMs: 4200,
      costPerTaskUsd: 0.021,
      qualityScore: 0.87,
      trend7d: [0.78, 0.81, 0.83, 0.86, 0.88, 0.9, 0.91],
    },
    assignments: [
      {
        id: "a1",
        kind: "project",
        label: "Northwind renewal",
        meta: "Lead",
        status: "in_progress",
      },
      {
        id: "a2",
        kind: "project",
        label: "Q1 outbound cohort",
        meta: "Campaign",
        status: "in_progress",
      },
      {
        id: "a3",
        kind: "task",
        label: "Draft 42 first-touch emails",
        meta: "Due today",
        status: "review",
      },
      {
        id: "a4",
        kind: "task",
        label: "Enrich 118 new accounts",
        status: "queued",
      },
    ],
    learning: [
      {
        id: "l1",
        at: "2026-07-05T14:20:00Z",
        kind: "feedback",
        summary: "Rejected 4 emails as 'too formal' — tone recalibrated.",
        delta: "+1.4% reply rate",
      },
      {
        id: "l2",
        at: "2026-07-03T09:10:00Z",
        kind: "policy_update",
        summary: "Never mention pricing before discovery call.",
      },
      {
        id: "l3",
        at: "2026-06-28T11:00:00Z",
        kind: "promotion",
        summary: "Promoted from v4.1 → v4.2. Approval threshold raised.",
        delta: "+3.1% success",
      },
    ],
    experiments: [
      {
        id: "x1",
        name: "Video-first intro vs written",
        status: "running",
        metric: "reply rate",
      },
      {
        id: "x2",
        name: "3-touch vs 5-touch sequence",
        status: "won",
        metric: "meetings booked",
      },
    ],
    predictions: [
      {
        id: "p1",
        statement: "Northwind will renew at ≥ $180k",
        confidence: 0.82,
        horizon: "14 days",
      },
      {
        id: "p2",
        statement: "Q1 pipeline will beat plan by 8%",
        confidence: 0.63,
        horizon: "60 days",
      },
    ],
    tools: ["Gmail", "HubSpot", "Apollo", "Clearbit", "Slack"],
    createdAt: "2026-02-14T00:00:00Z",
  },
  {
    id: "w_scout",
    name: "Scout",
    handle: "@scout",
    type: "browser",
    status: "active",
    title: "Web Research Worker",
    bio: "Opens a real Chromium session to gather what APIs can't: pricing pages, news, LinkedIn signals.",
    manager: "w_atlas",
    version: "v2.1",
    authorityScope: ["Web · read only", "Session · headless"],
    approvalThreshold: 0.4,
    skills: [
      { name: "Site navigation", level: 0.9 },
      { name: "Form filling", level: 0.72 },
      { name: "Data extraction", level: 0.85 },
    ],
    performance: {
      successRate: 0.86,
      tasksCompleted: 4820,
      avgLatencyMs: 11400,
      costPerTaskUsd: 0.008,
      qualityScore: 0.81,
      trend7d: [0.82, 0.83, 0.85, 0.84, 0.86, 0.87, 0.86],
    },
    assignments: [
      {
        id: "a1",
        kind: "task",
        label: "Scrape pricing for 24 competitors",
        status: "in_progress",
      },
      {
        id: "a2",
        kind: "task",
        label: "Verify LinkedIn titles for cohort",
        status: "queued",
      },
    ],
    learning: [
      {
        id: "l1",
        at: "2026-07-04T08:00:00Z",
        kind: "correction",
        summary: "CAPTCHA fallback re-routed through human queue.",
      },
    ],
    experiments: [
      {
        id: "x1",
        name: "Headless vs. real display",
        status: "inconclusive",
        metric: "block rate",
      },
    ],
    predictions: [],
    tools: ["Chromium", "Proxies", "OCR"],
    createdAt: "2026-03-22T00:00:00Z",
  },
  {
    id: "w_mailer",
    name: "Mailer",
    handle: "@mailer",
    type: "api",
    status: "idle",
    title: "Send & Reply Worker",
    bio: "Sends approved messages, watches replies, threads them back to the owning worker.",
    manager: "w_atlas",
    version: "v1.6",
    authorityScope: ["Email · send", "Inbox · read/write"],
    approvalThreshold: 0.95,
    skills: [
      { name: "Deliverability", level: 0.93 },
      { name: "Reply routing", level: 0.9 },
    ],
    performance: {
      successRate: 0.98,
      tasksCompleted: 9830,
      avgLatencyMs: 720,
      costPerTaskUsd: 0.001,
      qualityScore: 0.94,
      trend7d: [0.96, 0.97, 0.98, 0.98, 0.98, 0.99, 0.98],
    },
    assignments: [
      { id: "a1", kind: "task", label: "Send 42 approved emails", status: "queued" },
    ],
    learning: [],
    experiments: [],
    predictions: [],
    tools: ["Gmail API", "SendGrid"],
    createdAt: "2026-01-08T00:00:00Z",
  },
  {
    id: "w_juno",
    name: "Juno",
    handle: "@juno",
    type: "ai_agent",
    status: "learning",
    title: "Customer Success Analyst",
    bio: "Watches usage and health signals; drafts renewal briefs. Currently in training on the new health model.",
    reports: ["w_pulse"],
    version: "v3.0-beta",
    authorityScope: ["Accounts · read", "Notes · draft"],
    approvalThreshold: 0.6,
    skills: [
      { name: "Health scoring", level: 0.76 },
      { name: "Renewal briefs", level: 0.81 },
      { name: "Churn prediction", level: 0.7 },
    ],
    performance: {
      successRate: 0.79,
      tasksCompleted: 612,
      avgLatencyMs: 6800,
      costPerTaskUsd: 0.034,
      qualityScore: 0.77,
      trend7d: [0.71, 0.72, 0.74, 0.76, 0.77, 0.78, 0.79],
    },
    assignments: [
      {
        id: "a1",
        kind: "project",
        label: "Acme expansion",
        meta: "Customer",
        status: "review",
      },
    ],
    learning: [
      {
        id: "l1",
        at: "2026-07-06T09:00:00Z",
        kind: "training",
        summary: "Ingesting last 90 days of NPS + product analytics.",
      },
    ],
    experiments: [
      {
        id: "x1",
        name: "Weekly vs bi-weekly briefs",
        status: "running",
        metric: "CSM adoption",
      },
    ],
    predictions: [
      {
        id: "p1",
        statement: "Acme will expand seats by 22%",
        confidence: 0.71,
        horizon: "30 days",
      },
    ],
    tools: ["Segment", "Mixpanel", "Zendesk"],
    createdAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "w_pulse",
    name: "Pulse",
    handle: "@pulse",
    type: "automation",
    status: "active",
    title: "Health-signal Pipeline",
    bio: "Deterministic ETL. Rolls up product events into per-account signals every 15 minutes.",
    manager: "w_juno",
    version: "v5.4",
    authorityScope: ["Warehouse · read", "Signals · write"],
    approvalThreshold: 0.99,
    skills: [
      { name: "ETL", level: 0.95 },
      { name: "Anomaly detection", level: 0.68 },
    ],
    performance: {
      successRate: 0.997,
      tasksCompleted: 41520,
      avgLatencyMs: 240,
      costPerTaskUsd: 0.0003,
      qualityScore: 0.96,
      trend7d: [0.99, 0.99, 1, 1, 0.99, 1, 1],
    },
    assignments: [
      { id: "a1", kind: "task", label: "15-min signal rollup", status: "in_progress" },
    ],
    learning: [],
    experiments: [],
    predictions: [],
    tools: ["dbt", "Snowflake", "Airflow"],
    createdAt: "2025-11-02T00:00:00Z",
  },
  {
    id: "w_lex",
    name: "Lex",
    handle: "@lex",
    type: "tool",
    status: "active",
    title: "Contract Redliner",
    bio: "Single-purpose function: given a contract and playbook, returns a redlined draft.",
    version: "v1.2",
    authorityScope: ["Docs · read", "Docs · draft"],
    approvalThreshold: 0.85,
    skills: [
      { name: "Clause matching", level: 0.88 },
      { name: "Playbook fit", level: 0.83 },
    ],
    performance: {
      successRate: 0.9,
      tasksCompleted: 318,
      avgLatencyMs: 8800,
      costPerTaskUsd: 0.12,
      qualityScore: 0.89,
      trend7d: [0.86, 0.87, 0.88, 0.89, 0.9, 0.9, 0.9],
    },
    assignments: [
      {
        id: "a1",
        kind: "task",
        label: "Redline Northwind MSA v3",
        status: "in_progress",
      },
    ],
    learning: [
      {
        id: "l1",
        at: "2026-06-30T12:00:00Z",
        kind: "policy_update",
        summary: "Always flag any change to indemnification cap.",
      },
    ],
    experiments: [],
    predictions: [],
    tools: ["DocuSign", "Ironclad"],
    createdAt: "2026-05-10T00:00:00Z",
  },
  {
    id: "w_maya",
    name: "Maya Chen",
    handle: "@maya",
    type: "human",
    status: "active",
    title: "Head of Revenue",
    bio: "Final approver on any deal over $50k. Reviews Atlas and Juno daily briefs.",
    reports: ["w_atlas", "w_juno"],
    authorityScope: ["Everything, with audit"],
    approvalThreshold: 1,
    skills: [
      { name: "Negotiation", level: 0.95 },
      { name: "Forecasting", level: 0.9 },
      { name: "Coaching", level: 0.92 },
    ],
    performance: {
      successRate: 0.88,
      tasksCompleted: 214,
      avgLatencyMs: 3600000, // ~1 hour human cadence
      costPerTaskUsd: 34,
      qualityScore: 0.95,
      trend7d: [0.86, 0.87, 0.88, 0.88, 0.89, 0.88, 0.88],
    },
    assignments: [
      {
        id: "a1",
        kind: "task",
        label: "Approve 3 Northwind messages",
        status: "review",
      },
      {
        id: "a2",
        kind: "project",
        label: "Board update",
        status: "in_progress",
      },
    ],
    learning: [],
    experiments: [],
    predictions: [],
    tools: ["Notion", "Slack", "Alyson"],
    createdAt: "2025-09-01T00:00:00Z",
  },
];

export const COLLABORATION: CollaborationEdge[] = [
  { from: "w_atlas", to: "w_scout", label: "delegates research to", weight: 5 },
  { from: "w_atlas", to: "w_mailer", label: "hands off sends to", weight: 4 },
  { from: "w_atlas", to: "w_maya", label: "escalates to", weight: 3 },
  { from: "w_juno", to: "w_pulse", label: "reads signals from", weight: 5 },
  { from: "w_juno", to: "w_maya", label: "escalates to", weight: 2 },
  { from: "w_atlas", to: "w_lex", label: "requests redlines from", weight: 2 },
  { from: "w_maya", to: "w_atlas", label: "coaches", weight: 3 },
  { from: "w_maya", to: "w_juno", label: "coaches", weight: 2 },
];

// ---------- Helpers ----------

export function getWorker(id: string): Worker | undefined {
  return WORKERS.find((w) => w.id === id);
}

export function edgesFor(id: string): CollaborationEdge[] {
  return COLLABORATION.filter((e) => e.from === id || e.to === id);
}

export function formatLatency(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function formatCost(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(4)}`;
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}
