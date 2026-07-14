import type { LucideIcon } from "lucide-react";
import {
  Mail,
  Calendar,
  Video,
  Globe,
  MessageSquare,
  Users,
  Briefcase,
  FileText,
  StickyNote,
  Phone,
} from "lucide-react";

export type SourceKind =
  | "gmail"
  | "calendar"
  | "meetings"
  | "browser"
  | "slack"
  | "crm"
  | "ats"
  | "documents"
  | "notes"
  | "calls";

export interface SourceMeta {
  kind: SourceKind;
  label: string;
  icon: LucideIcon;
  color: string; // tailwind text color class
}

export const SOURCES: SourceMeta[] = [
  { kind: "gmail", label: "Gmail", icon: Mail, color: "text-rose-400" },
  { kind: "calendar", label: "Calendar", icon: Calendar, color: "text-amber-400" },
  { kind: "meetings", label: "Meetings", icon: Video, color: "text-violet-400" },
  { kind: "browser", label: "Browser", icon: Globe, color: "text-sky-400" },
  { kind: "slack", label: "Slack", icon: MessageSquare, color: "text-emerald-400" },
  { kind: "crm", label: "CRM", icon: Users, color: "text-indigo-400" },
  { kind: "ats", label: "ATS", icon: Briefcase, color: "text-orange-400" },
  { kind: "documents", label: "Documents", icon: FileText, color: "text-cyan-400" },
  { kind: "notes", label: "Notes", icon: StickyNote, color: "text-yellow-400" },
  { kind: "calls", label: "Calls", icon: Phone, color: "text-pink-400" },
];

export const sourceMeta = (k: SourceKind): SourceMeta =>
  SOURCES.find((s) => s.kind === k)!;

export interface KEntity {
  id: string;
  label: string;
  kind: "person" | "company" | "project" | "place";
}

export interface KFact {
  id: string;
  title: string;
  excerpt: string;
  source: SourceKind;
  at: string; // ISO
  entities: string[]; // KEntity ids
  confidence: number; // 0-1
  citation: string; // e.g. "Meeting · Q3 Planning · 12:32"
}

export interface KSummary {
  entityId: string;
  headline: string;
  body: string;
  bullets: string[];
  updatedAt: string;
  sourcesUsed: SourceKind[];
}

/* ---------- demo entities ---------- */

export const K_ENTITIES: KEntity[] = [
  { id: "e_maya", label: "Maya Chen", kind: "person" },
  { id: "e_ori", label: "Ori Levy", kind: "person" },
  { id: "e_sam", label: "Sam Whitcomb", kind: "person" },
  { id: "e_northwind", label: "Northwind Robotics", kind: "company" },
  { id: "e_helio", label: "Helio Freight", kind: "company" },
  { id: "e_pilot", label: "Q4 Pilot Rollout", kind: "project" },
  { id: "e_renewal", label: "Northwind Renewal", kind: "project" },
  { id: "e_ny", label: "New York HQ", kind: "place" },
];

export const kEntity = (id: string): KEntity =>
  K_ENTITIES.find((e) => e.id === id) ?? { id, label: id, kind: "person" };

/* ---------- demo facts (feed / timeline) ---------- */

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600 * 1000).toISOString();

export const K_FACTS: KFact[] = [
  {
    id: "f1",
    title: "Maya confirmed the Q4 pilot budget was raised to $180k",
    excerpt:
      "“We got sign-off from Priya this morning — new ceiling is 180. Let's plan the second cohort against that.”",
    source: "gmail",
    at: h(0.4),
    entities: ["e_maya", "e_pilot", "e_northwind"],
    confidence: 0.94,
    citation: "Email · re: pilot budget · 08:12",
  },
  {
    id: "f2",
    title: "Northwind Robotics is evaluating two competing vendors",
    excerpt:
      "Extracted from meeting transcript: Ori mentioned Anthem and Kestrel are both in the final round for Q1.",
    source: "meetings",
    at: h(2),
    entities: ["e_northwind", "e_ori"],
    confidence: 0.78,
    citation: "Meeting · Northwind weekly · 14:03",
  },
  {
    id: "f3",
    title: "Sam is out of office next week (Nov 18–22)",
    excerpt: "Auto-reply detected. Rescheduling suggested for the renewal review.",
    source: "gmail",
    at: h(5),
    entities: ["e_sam", "e_renewal"],
    confidence: 0.99,
    citation: "Email · Out of office reply",
  },
  {
    id: "f4",
    title: "Helio Freight raised a $22M Series B",
    excerpt:
      "TechCrunch · led by Redpoint, participation from existing investors. Signals expansion into logistics AI.",
    source: "browser",
    at: h(7),
    entities: ["e_helio"],
    confidence: 0.88,
    citation: "Browser · techcrunch.com/2026/…",
  },
  {
    id: "f5",
    title: "Slack thread: security review blocks Northwind rollout by 2 weeks",
    excerpt:
      "#deals-northwind — Priya flagged SOC2 evidence gap. Owner: Ori. ETA to unblock: Nov 25.",
    source: "slack",
    at: h(11),
    entities: ["e_northwind", "e_ori", "e_pilot"],
    confidence: 0.9,
    citation: "Slack · #deals-northwind · 09:41",
  },
  {
    id: "f6",
    title: "Call recap: renewal likely, price sensitivity high",
    excerpt:
      "Sam signaled renewal is likely but pushed hard on unit economics. Suggested a usage-based tier.",
    source: "calls",
    at: h(19),
    entities: ["e_sam", "e_renewal"],
    confidence: 0.83,
    citation: "Call · 32 min · yesterday",
  },
  {
    id: "f7",
    title: "New note attached to Q4 Pilot Rollout",
    excerpt:
      "Kickoff plan v2 — cohort split, success metrics, risks. Written by Ori.",
    source: "notes",
    at: h(26),
    entities: ["e_pilot", "e_ori"],
    confidence: 1,
    citation: "Note · kickoff-v2.md",
  },
  {
    id: "f8",
    title: "Calendar: quarterly review moved to Dec 4",
    excerpt: "Rescheduled by Maya. New attendees include Priya from Northwind.",
    source: "calendar",
    at: h(34),
    entities: ["e_maya", "e_northwind"],
    confidence: 1,
    citation: "Calendar · Q4 review · Dec 4 · 15:00",
  },
  {
    id: "f9",
    title: "ATS: 3 senior AE candidates advanced to onsite",
    excerpt: "Alyson auto-scored 47 applicants. Top 3 unblocked for onsite loops.",
    source: "ats",
    at: h(41),
    entities: [],
    confidence: 0.86,
    citation: "ATS · pipeline sync",
  },
  {
    id: "f10",
    title: "MSA v3 uploaded and parsed — 4 material changes detected",
    excerpt:
      "Auto-diff vs v2: liability cap raised, data residency clause added, SLA credits adjusted.",
    source: "documents",
    at: h(49),
    entities: ["e_northwind"],
    confidence: 0.95,
    citation: "Document · MSA-v3.pdf",
  },
  {
    id: "f11",
    title: "CRM: Northwind stage moved to Contract Sent",
    excerpt: "Automatic — triggered by document upload and email confirmation.",
    source: "crm",
    at: h(52),
    entities: ["e_northwind"],
    confidence: 1,
    citation: "CRM · deal automation",
  },
  {
    id: "f12",
    title: "Browser: Ori read Anthem's pricing page 3 times this week",
    excerpt: "Signal: competitive research intensifying ahead of renewal.",
    source: "browser",
    at: h(68),
    entities: ["e_ori"],
    confidence: 0.72,
    citation: "Browser · anthem.ai/pricing",
  },
];

/* ---------- demo summaries ---------- */

export const K_SUMMARIES: KSummary[] = [
  {
    entityId: "e_northwind",
    headline: "Renewal on track — security review is the pacing item.",
    body: "Northwind expanded the pilot budget to $180k and moved the deal to Contract Sent. The main risk is a SOC2 evidence gap flagged in Slack; Ori owns the unblock by Nov 25. Two competitors (Anthem, Kestrel) are still in evaluation for Q1.",
    bullets: [
      "Budget raised to $180k (Gmail, 32m ago)",
      "SOC2 gap blocks by ~2 weeks (Slack)",
      "MSA v3 introduces 4 material changes (Documents)",
      "Competitive pressure from Anthem and Kestrel",
    ],
    updatedAt: h(0.4),
    sourcesUsed: ["gmail", "slack", "documents", "meetings", "browser", "crm"],
  },
  {
    entityId: "e_maya",
    headline: "Maya is driving the pilot expansion and Q4 review cadence.",
    body: "Confirmed the budget increase this morning, moved the quarterly review to Dec 4, and added Priya from Northwind to the attendee list. Consistent primary contact across email and calendar.",
    bullets: [
      "Confirmed $180k budget (Gmail)",
      "Reschedules Q4 review to Dec 4 (Calendar)",
      "Adds Priya to review (Calendar)",
    ],
    updatedAt: h(0.5),
    sourcesUsed: ["gmail", "calendar"],
  },
  {
    entityId: "e_pilot",
    headline: "Pilot cohort v2 is being drafted; unblock date is Nov 25.",
    body: "Ori published a kickoff v2 note with cohort splits, success metrics, and risks. Slack thread indicates the security review must clear before the second cohort starts.",
    bullets: [
      "Kickoff v2 note published (Notes)",
      "Blocked by SOC2 evidence gap (Slack)",
      "Budget headroom now $180k (Gmail)",
    ],
    updatedAt: h(11),
    sourcesUsed: ["notes", "slack", "gmail"],
  },
];

/* ---------- graph ---------- */

export interface KEdge {
  from: string;
  to: string;
  strength: number; // 0-1
  reason: string;
}

export const K_EDGES: KEdge[] = [
  { from: "e_maya", to: "e_northwind", strength: 0.95, reason: "Primary contact · 42 exchanges" },
  { from: "e_maya", to: "e_pilot", strength: 0.8, reason: "Sponsor" },
  { from: "e_ori", to: "e_northwind", strength: 0.7, reason: "Deal owner" },
  { from: "e_ori", to: "e_pilot", strength: 0.9, reason: "Kickoff author" },
  { from: "e_sam", to: "e_renewal", strength: 0.85, reason: "Renewal counterpart" },
  { from: "e_northwind", to: "e_pilot", strength: 0.9, reason: "Pilot customer" },
  { from: "e_northwind", to: "e_renewal", strength: 0.6, reason: "Adjacent motion" },
  { from: "e_northwind", to: "e_ny", strength: 0.4, reason: "HQ" },
  { from: "e_helio", to: "e_ny", strength: 0.3, reason: "HQ" },
  { from: "e_maya", to: "e_ori", strength: 0.5, reason: "Co-attend meetings" },
];
