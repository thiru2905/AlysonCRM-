/**
 * Alyson OS — Core Entity Framework
 * ------------------------------------------------------------------
 * Every application on Alyson OS composes from these ten entity kinds.
 * They share a common shape so any surface — CRM, ATS, Success,
 * Marketing, Real Estate, Mortgage, Insurance — can render, reason
 * about, and act on any object using the same components.
 */

export type EntityKind =
  | "person"
  | "company"
  | "place"
  | "worker"
  | "audience"
  | "knowledge_asset"
  | "project"
  | "task"
  | "experiment"
  | "prediction";

/** A lightweight pointer to another entity — safe to embed anywhere. */
export interface EntityRef {
  id: string;
  kind: EntityKind;
  label: string;
  sublabel?: string;
}

/** Provenance: who / what wrote this piece of data, and when. */
export interface Provenance {
  source: "human" | "worker" | "system" | "import";
  actor?: string; // user name, worker name, or system component
  at: string; // ISO
  confidence?: number; // 0..1 when source is worker/system
}

export interface AISummary {
  headline: string;
  body: string;
  bullets?: string[];
  provenance: Provenance;
  stale?: boolean;
}

export type TimelineEventKind =
  | "created"
  | "message"
  | "meeting"
  | "call"
  | "note"
  | "status_change"
  | "task"
  | "worker_action"
  | "approval"
  | "file";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  at: string; // ISO
  title: string;
  detail?: string;
  actor?: EntityRef; // usually a Person or Worker
  provenance: Provenance;
}

export type RelationshipKind =
  | "works_at"
  | "owns"
  | "reports_to"
  | "member_of"
  | "located_at"
  | "assigned_to"
  | "referenced_by"
  | "related_to";

export interface Relationship {
  id: string;
  kind: RelationshipKind;
  from: EntityRef;
  to: EntityRef;
  strength?: number; // 0..1
  since?: string;
  provenance: Provenance;
}

export interface KnowledgeRef {
  id: string;
  title: string;
  sourceType: "doc" | "email" | "call" | "note" | "web" | "upload" | "chat";
  excerpt?: string;
  updatedAt: string;
  trust?: number; // 0..1
}

export interface Score {
  key: string; // e.g. "engagement", "risk", "fit"
  label: string;
  value: number; // 0..100 normalized
  trend?: "up" | "down" | "flat";
  delta?: number;
  hint?: string;
  provenance: Provenance;
}

export interface Prediction {
  id: string;
  question: string; // "Likelihood to close in 30 days"
  answer: string; // "68%" or "High"
  confidence: number; // 0..1
  horizon?: string; // "30d"
  drivers?: string[]; // top contributing signals
  provenance: Provenance;
}

export interface FileRef {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: EntityRef;
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: EntityRef;
  verb: string; // "viewed", "edited", "commented"
  target?: string; // human string
}

export interface HistoryEntry {
  id: string;
  at: string;
  field: string;
  from: unknown;
  to: unknown;
  actor: EntityRef;
}

/** The canonical Entity shape. All apps read and write this. */
export interface Entity {
  id: string;
  kind: EntityKind;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  status?: { label: string; tone: "neutral" | "success" | "warning" | "info" | "danger" };
  createdAt: string;
  updatedAt: string;

  // Universal sections — every entity supports all of these.
  aiSummary?: AISummary;
  timeline: TimelineEvent[];
  relationships: Relationship[];
  knowledge: KnowledgeRef[];
  scores: Score[];
  predictions: Prediction[];
  files: FileRef[];
  activity: ActivityEvent[];
  history: HistoryEntry[];
  projects: EntityRef[];
  tasks: EntityRef[];
  experiments: EntityRef[];

  /** Kind-specific soft fields — extend without migrations. */
  fields?: Record<string, unknown>;
}

export type EntitySection =
  | "summary"
  | "timeline"
  | "relationships"
  | "knowledge"
  | "scores"
  | "predictions"
  | "files"
  | "activity"
  | "history"
  | "work"
  | "experiments";

