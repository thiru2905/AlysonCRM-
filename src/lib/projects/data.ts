import type { LucideIcon } from "lucide-react";
import {
  User,
  Bot,
  Globe,
  Plug,
  Wrench,
} from "lucide-react";

/* -------------------------------------------------------------- */
/* Executors                                                       */
/* -------------------------------------------------------------- */

export type ExecutorKind = "human" | "ai_worker" | "browser_worker" | "api" | "tool";

export interface ExecutorMeta {
  kind: ExecutorKind;
  label: string;
  short: string;
  icon: LucideIcon;
  tint: string; // token class
}

export const EXECUTORS: ExecutorMeta[] = [
  { kind: "human", label: "Human", short: "H", icon: User, tint: "text-foreground" },
  { kind: "ai_worker", label: "AI Worker", short: "AI", icon: Bot, tint: "text-ai" },
  { kind: "browser_worker", label: "Browser Worker", short: "BR", icon: Globe, tint: "text-sky-400" },
  { kind: "api", label: "API", short: "API", icon: Plug, tint: "text-emerald-400" },
  { kind: "tool", label: "Tool", short: "TL", icon: Wrench, tint: "text-amber-400" },
];

export const executorMeta = (k: ExecutorKind): ExecutorMeta =>
  EXECUTORS.find((e) => e.kind === k)!;

/* -------------------------------------------------------------- */
/* Domain                                                          */
/* -------------------------------------------------------------- */

export type ProjectKind =
  | "lead"
  | "candidate"
  | "customer"
  | "insurance_quote"
  | "property"
  | "marketing_campaign"
  | "partnership";

export const PROJECT_KIND_LABEL: Record<ProjectKind, string> = {
  lead: "Lead",
  candidate: "Candidate",
  customer: "Customer",
  insurance_quote: "Insurance Quote",
  property: "Property",
  marketing_campaign: "Marketing Campaign",
  partnership: "Partnership",
};

export type TaskStatus = "todo" | "doing" | "review" | "blocked" | "done";
export type Priority = "urgent" | "high" | "med" | "low";

export interface Assignee {
  id: string;
  name: string;
  kind: ExecutorKind;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  executor: ExecutorKind;
}

export interface Task {
  id: string;
  ref: string; // e.g. NW-142
  title: string;
  status: TaskStatus;
  priority: Priority;
  executor: ExecutorKind;
  assignee: Assignee;
  phaseId: string;
  dueAt?: string;
  estimateHours?: number;
  confidence?: number; // for AI/browser/api
  dependsOn?: string[]; // task ids
  subtasks?: Subtask[];
  activityAt: string; // last activity
}

export interface Phase {
  id: string;
  label: string;
  goal: string;
  status: "upcoming" | "active" | "complete";
  progress: number; // 0-1 computed but denormalized here
}

export interface Objective {
  id: string;
  label: string;
  metric: string;
  target: number;
  current: number;
  unit?: string;
}

export interface WorkerRef {
  id: string;
  name: string;
  role: string;
  kind: ExecutorKind;
  utilization: number; // 0-1
  tasksOpen: number;
}

export interface ExperimentRef {
  id: string;
  hypothesis: string;
  status: "running" | "shipped" | "killed";
  lift?: number; // e.g. 0.14
  confidence: number;
}

export interface PredictionRef {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  horizon?: string;
}

export interface KnowledgeRef {
  id: string;
  title: string;
  source: "gmail" | "slack" | "documents" | "meetings" | "notes" | "browser";
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  actorName: string;
  actorKind: ExecutorKind;
  verb: string;
  target?: string;
}

export interface Project {
  id: string;
  kind: ProjectKind;
  code: string; // e.g. NW-Q4
  name: string;
  subtitle: string;
  status: "active" | "at_risk" | "paused" | "won" | "lost";
  health: "on_track" | "warn" | "off_track";
  progress: number; // 0-1
  updatedAt: string;
  objectives: Objective[];
  phases: Phase[];
  tasks: Task[];
  workers: WorkerRef[];
  experiments: ExperimentRef[];
  predictions: PredictionRef[];
  knowledge: KnowledgeRef[];
  timeline: TimelineEvent[];
}

/* -------------------------------------------------------------- */
/* Demo project                                                    */
/* -------------------------------------------------------------- */

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600 * 1000).toISOString();

const PHASES: Phase[] = [
  { id: "p1", label: "Discovery", goal: "Understand buyer, budget, blockers.", status: "complete", progress: 1 },
  { id: "p2", label: "Evaluation", goal: "Prove value against Anthem, Kestrel.", status: "complete", progress: 1 },
  { id: "p3", label: "Pilot", goal: "Ship v1 to 40 seats with measurable lift.", status: "active", progress: 0.68 },
  { id: "p4", label: "Contract", goal: "Redlines, security, procurement.", status: "active", progress: 0.35 },
  { id: "p5", label: "Rollout", goal: "Expand to full 220-seat org.", status: "upcoming", progress: 0 },
];

const A_MAYA: Assignee = { id: "a1", name: "Maya Chen", kind: "human" };
const A_ORI: Assignee = { id: "a2", name: "Ori Levy", kind: "human" };
const A_RESEARCH: Assignee = { id: "a3", name: "Research Worker", kind: "ai_worker" };
const A_OUTREACH: Assignee = { id: "a4", name: "Outreach Worker", kind: "ai_worker" };
const A_BROWSER: Assignee = { id: "a5", name: "Browser Worker", kind: "browser_worker" };
const A_DOCS: Assignee = { id: "a6", name: "Docs API", kind: "api" };
const A_DIFF: Assignee = { id: "a7", name: "Redline Tool", kind: "tool" };

const TASKS: Task[] = [
  {
    id: "t1", ref: "NW-142", title: "Draft renewal proposal with expanded pilot terms",
    status: "doing", priority: "high", executor: "ai_worker", assignee: A_OUTREACH,
    phaseId: "p4", dueAt: h(-36), estimateHours: 2, confidence: 0.86,
    subtasks: [
      { id: "s1", title: "Pull last 12mo usage", done: true, executor: "api" },
      { id: "s2", title: "Draft cover email", done: true, executor: "ai_worker" },
      { id: "s3", title: "Attach MSA v3", done: false, executor: "tool" },
    ],
    activityAt: h(0.4),
  },
  {
    id: "t2", ref: "NW-140", title: "Resolve SOC2 evidence gap",
    status: "blocked", priority: "urgent", executor: "human", assignee: A_ORI,
    phaseId: "p4", dueAt: h(-120), dependsOn: ["t7"],
    activityAt: h(11),
  },
  {
    id: "t3", ref: "NW-138", title: "Score 47 pilot users and cohort them",
    status: "done", priority: "med", executor: "ai_worker", assignee: A_RESEARCH,
    phaseId: "p3", confidence: 0.93,
    activityAt: h(20),
  },
  {
    id: "t4", ref: "NW-137", title: "Scrape competitive pricing weekly",
    status: "doing", priority: "low", executor: "browser_worker", assignee: A_BROWSER,
    phaseId: "p3", confidence: 0.79,
    activityAt: h(5),
  },
  {
    id: "t5", ref: "NW-136", title: "Sync Northwind deal fields into CRM",
    status: "done", priority: "med", executor: "api", assignee: A_DOCS,
    phaseId: "p3",
    activityAt: h(28),
  },
  {
    id: "t6", ref: "NW-135", title: "Kickoff Q4 pilot cohort v2",
    status: "review", priority: "high", executor: "human", assignee: A_MAYA,
    phaseId: "p3", dueAt: h(-48), dependsOn: ["t3"],
    subtasks: [
      { id: "s4", title: "Confirm attendees", done: true, executor: "human" },
      { id: "s5", title: "Send agenda", done: true, executor: "ai_worker" },
      { id: "s6", title: "Book room", done: true, executor: "api" },
    ],
    activityAt: h(3),
  },
  {
    id: "t7", ref: "NW-134", title: "Collect SOC2 audit evidence bundle",
    status: "doing", priority: "urgent", executor: "human", assignee: A_ORI,
    phaseId: "p4", dueAt: h(-96),
    activityAt: h(9),
  },
  {
    id: "t8", ref: "NW-132", title: "Redline MSA v3 vs v2",
    status: "done", priority: "high", executor: "tool", assignee: A_DIFF,
    phaseId: "p4", confidence: 0.95,
    activityAt: h(49),
  },
  {
    id: "t9", ref: "NW-130", title: "Rollout playbook draft",
    status: "todo", priority: "med", executor: "ai_worker", assignee: A_RESEARCH,
    phaseId: "p5", dependsOn: ["t1", "t2"],
    activityAt: h(70),
  },
  {
    id: "t10", ref: "NW-128", title: "Enablement session for CS team",
    status: "todo", priority: "low", executor: "human", assignee: A_MAYA,
    phaseId: "p5", dependsOn: ["t9"],
    activityAt: h(72),
  },
];

export const DEMO_PROJECT: Project = {
  id: "prj_northwind",
  kind: "customer",
  code: "NW-Q4",
  name: "Northwind Q4 Expansion",
  subtitle: "220-seat rollout · $180k pilot budget · Renewal + expansion",
  status: "at_risk",
  health: "warn",
  progress: 0.62,
  updatedAt: h(0.4),
  objectives: [
    { id: "o1", label: "Signed order form by Dec 15", metric: "Contract signed", target: 1, current: 0 },
    { id: "o2", label: "Pilot NPS ≥ 55", metric: "NPS", target: 55, current: 61, unit: "" },
    { id: "o3", label: "Time-to-value under 14 days", metric: "Median TTV", target: 14, current: 11, unit: "d" },
    { id: "o4", label: "Expand to 220 seats", metric: "Active seats", target: 220, current: 40 },
  ],
  phases: PHASES,
  tasks: TASKS,
  workers: [
    { id: "w1", name: "Research Worker", role: "Signals + scoring", kind: "ai_worker", utilization: 0.42, tasksOpen: 3 },
    { id: "w2", name: "Outreach Worker", role: "Drafts + follow-ups", kind: "ai_worker", utilization: 0.61, tasksOpen: 2 },
    { id: "w3", name: "Browser Worker", role: "Competitive intel", kind: "browser_worker", utilization: 0.28, tasksOpen: 1 },
    { id: "w4", name: "Docs API", role: "CRM + doc sync", kind: "api", utilization: 0.12, tasksOpen: 0 },
    { id: "w5", name: "Redline Tool", role: "Contract diffs", kind: "tool", utilization: 0.08, tasksOpen: 0 },
    { id: "w6", name: "Maya Chen", role: "AE · owner", kind: "human", utilization: 0.71, tasksOpen: 4 },
    { id: "w7", name: "Ori Levy", role: "SE · security", kind: "human", utilization: 0.55, tasksOpen: 3 },
  ],
  experiments: [
    { id: "x1", hypothesis: "Usage-based tier lifts close rate on renewals", status: "running", confidence: 0.72 },
    { id: "x2", hypothesis: "Security-first outreach outperforms ROI-first on regulated buyers", status: "shipped", lift: 0.19, confidence: 0.88 },
    { id: "x3", hypothesis: "Async video demos beat live for L2 stakeholders", status: "killed", lift: -0.04, confidence: 0.81 },
  ],
  predictions: [
    { id: "pr1", question: "Will Northwind sign by Dec 15?", answer: "Likely", confidence: 0.68, horizon: "3w" },
    { id: "pr2", question: "Forecast ARR at close", answer: "$412k", confidence: 0.74, horizon: "3w" },
    { id: "pr3", question: "Best next action", answer: "Unblock SOC2", confidence: 0.91 },
  ],
  knowledge: [
    { id: "k1", title: "MSA v3 (parsed)", source: "documents", updatedAt: h(49) },
    { id: "k2", title: "Northwind weekly transcript · Nov 14", source: "meetings", updatedAt: h(2) },
    { id: "k3", title: "#deals-northwind thread", source: "slack", updatedAt: h(11) },
    { id: "k4", title: "Kickoff v2 note", source: "notes", updatedAt: h(26) },
    { id: "k5", title: "Priya · budget confirmation email", source: "gmail", updatedAt: h(0.4) },
  ],
  timeline: [
    { id: "e1", at: h(0.4), actorName: "Outreach Worker", actorKind: "ai_worker", verb: "drafted", target: "renewal proposal" },
    { id: "e2", at: h(2),  actorName: "Meetings", actorKind: "api", verb: "ingested transcript from", target: "Northwind weekly" },
    { id: "e3", at: h(5),  actorName: "Browser Worker", actorKind: "browser_worker", verb: "captured", target: "Anthem pricing snapshot" },
    { id: "e4", at: h(9),  actorName: "Ori Levy", actorKind: "human", verb: "uploaded", target: "SOC2 evidence · partial" },
    { id: "e5", at: h(11), actorName: "Priya (Northwind)", actorKind: "human", verb: "flagged", target: "SOC2 gap in Slack" },
    { id: "e6", at: h(20), actorName: "Research Worker", actorKind: "ai_worker", verb: "scored", target: "47 pilot users" },
    { id: "e7", at: h(26), actorName: "Ori Levy", actorKind: "human", verb: "published", target: "Kickoff v2" },
    { id: "e8", at: h(49), actorName: "Redline Tool", actorKind: "tool", verb: "produced diff for", target: "MSA v3" },
  ],
};

/* -------------------------------------------------------------- */
/* Projects list (for the index)                                   */
/* -------------------------------------------------------------- */

export interface ProjectSummary {
  id: string;
  kind: ProjectKind;
  code: string;
  name: string;
  status: Project["status"];
  health: Project["health"];
  progress: number;
  openTasks: number;
  workers: number;
  updatedAt: string;
}

export const PROJECT_LIST: ProjectSummary[] = [
  {
    id: DEMO_PROJECT.id, kind: DEMO_PROJECT.kind, code: DEMO_PROJECT.code,
    name: DEMO_PROJECT.name, status: DEMO_PROJECT.status, health: DEMO_PROJECT.health,
    progress: DEMO_PROJECT.progress,
    openTasks: DEMO_PROJECT.tasks.filter(t => t.status !== "done").length,
    workers: DEMO_PROJECT.workers.length, updatedAt: DEMO_PROJECT.updatedAt,
  },
  { id: "prj_helio", kind: "lead", code: "HL-01", name: "Helio Freight · Discovery", status: "active", health: "on_track", progress: 0.22, openTasks: 6, workers: 4, updatedAt: h(3) },
  { id: "prj_amara", kind: "candidate", code: "AM-SR-AE", name: "Amara Okafor · Senior AE loop", status: "active", health: "on_track", progress: 0.55, openTasks: 4, workers: 3, updatedAt: h(7) },
  { id: "prj_quote", kind: "insurance_quote", code: "IQ-8842", name: "Sanchez Household · Auto + Home", status: "active", health: "warn", progress: 0.4, openTasks: 5, workers: 2, updatedAt: h(14) },
  { id: "prj_prop", kind: "property", code: "PR-1290", name: "1290 Bleecker · Listing prep", status: "active", health: "on_track", progress: 0.7, openTasks: 3, workers: 3, updatedAt: h(20) },
  { id: "prj_camp", kind: "marketing_campaign", code: "MC-Q4-AI", name: "Q4 AI Ops · demand gen", status: "at_risk", health: "off_track", progress: 0.31, openTasks: 8, workers: 5, updatedAt: h(30) },
  { id: "prj_part", kind: "partnership", code: "PT-ORACLE", name: "Oracle Marketplace listing", status: "paused", health: "warn", progress: 0.18, openTasks: 2, workers: 2, updatedAt: h(72) },
];
