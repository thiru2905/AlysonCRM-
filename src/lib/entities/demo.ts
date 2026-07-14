import type { Entity, EntityRef } from "./types";

/** A demo Entity used to showcase the framework. Not app-specific. */

const iso = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();
const min = (n: number) => n * 60_000;
const hour = (n: number) => n * min(60);
const day = (n: number) => n * hour(24);

const ryan: EntityRef = { id: "u_ryan", kind: "person", label: "Ryan Cole", sublabel: "Owner" };
const outreach: EntityRef = { id: "w_outreach", kind: "worker", label: "Outreach", sublabel: "AI agent" };
const enrichment: EntityRef = { id: "w_enrich", kind: "worker", label: "Enrichment" };
const acme: EntityRef = { id: "c_acme", kind: "company", label: "Acme Robotics" };

export const DEMO_ENTITY: Entity = {
  id: "e_demo_person_1",
  kind: "person",
  name: "Ada Kessler",
  subtitle: "Head of Operations · Acme Robotics",
  status: { label: "Engaged", tone: "info" },
  createdAt: iso(day(180)),
  updatedAt: iso(hour(3)),

  aiSummary: {
    headline: "High-intent, mid-cycle. Waiting on legal review before expansion.",
    body:
      "Ada re-engaged 2 weeks ago after a 4-month lull. Three meetings with her team since, all attended by legal. Her deployment blueprint has been shared internally at Acme — a signal she is championing the work.",
    bullets: [
      "Championing internally: shared blueprint doc on 12 Feb.",
      "Legal is the current blocker; MSA redlines pending.",
      "Best contact window: Tue–Thu, 09:00–11:00 local.",
    ],
    provenance: { source: "worker", actor: "Insights", at: iso(hour(3)), confidence: 0.82 },
  },

  timeline: [
    {
      id: "t1",
      kind: "worker_action",
      at: iso(hour(2)),
      title: "Outreach drafted a follow-up email",
      detail: "Waiting on your approval before sending.",
      actor: outreach,
      provenance: { source: "worker", actor: "Outreach", at: iso(hour(2)), confidence: 0.86 },
    },
    {
      id: "t2",
      kind: "meeting",
      at: iso(day(1)),
      title: "Discovery call · 32 min",
      detail: "Ada + 2 from legal. Covered rollout timeline and pilot scope.",
      provenance: { source: "system", at: iso(day(1)) },
    },
    {
      id: "t3",
      kind: "note",
      at: iso(day(3)),
      title: "Ryan added a note",
      detail: "Ada mentioned a Q3 board goal tied to our category — worth referencing.",
      actor: ryan,
      provenance: { source: "human", actor: "Ryan Cole", at: iso(day(3)) },
    },
    {
      id: "t4",
      kind: "status_change",
      at: iso(day(14)),
      title: "Status changed: Cold → Engaged",
      provenance: { source: "system", at: iso(day(14)) },
    },
    {
      id: "t5",
      kind: "created",
      at: iso(day(180)),
      title: "Entity created",
      provenance: { source: "import", at: iso(day(180)) },
    },
  ],

  relationships: [
    {
      id: "r1",
      kind: "works_at",
      from: { id: "e_demo_person_1", kind: "person", label: "Ada Kessler" },
      to: acme,
      strength: 1,
      since: iso(day(400)),
      provenance: { source: "import", at: iso(day(180)) },
    },
    {
      id: "r2",
      kind: "reports_to",
      from: { id: "e_demo_person_1", kind: "person", label: "Ada Kessler" },
      to: { id: "p_ceo", kind: "person", label: "Miles Ortega", sublabel: "CEO, Acme" },
      strength: 0.9,
      provenance: { source: "worker", actor: "Enrichment", at: iso(day(30)), confidence: 0.78 },
    },
    {
      id: "r3",
      kind: "member_of",
      from: { id: "e_demo_person_1", kind: "person", label: "Ada Kessler" },
      to: { id: "a_ops_leaders", kind: "audience", label: "Ops leaders · Mid-market" },
      strength: 0.7,
      provenance: { source: "system", at: iso(day(60)) },
    },
  ],

  knowledge: [
    {
      id: "k1",
      title: "Discovery transcript · Feb 12",
      sourceType: "call",
      excerpt:
        "\"We need a way to have legal see every draft before it goes out. That's non-negotiable for us.\"",
      updatedAt: iso(day(1)),
      trust: 0.95,
    },
    {
      id: "k2",
      title: "Acme deployment blueprint (shared internally)",
      sourceType: "doc",
      excerpt: "Phased rollout across 3 regions. Pilot signoff required from ops + legal.",
      updatedAt: iso(day(5)),
      trust: 0.8,
    },
    {
      id: "k3",
      title: "Q3 board memo (public excerpt)",
      sourceType: "web",
      excerpt: "Board priorities include reducing manual review cycle time by 40%.",
      updatedAt: iso(day(21)),
      trust: 0.6,
    },
  ],

  scores: [
    { key: "engagement", label: "Engagement", value: 78, trend: "up", delta: 12, hint: "3 meetings in last 14 days", provenance: { source: "system", at: iso(hour(1)) } },
    { key: "fit", label: "Fit", value: 91, trend: "flat", provenance: { source: "worker", actor: "Insights", at: iso(day(1)), confidence: 0.9 } },
    { key: "risk", label: "Churn risk", value: 22, trend: "down", delta: -6, hint: "Champion identified", provenance: { source: "worker", actor: "Insights", at: iso(hour(6)), confidence: 0.7 } },
    { key: "reachability", label: "Reachability", value: 64, trend: "up", delta: 4, provenance: { source: "system", at: iso(hour(3)) } },
  ],

  predictions: [
    {
      id: "p1",
      question: "Likelihood to expand in 60 days",
      answer: "72%",
      confidence: 0.74,
      horizon: "60d",
      drivers: ["Champion active", "Legal engaged", "Board memo signal"],
      provenance: { source: "worker", actor: "Insights", at: iso(hour(4)), confidence: 0.74 },
    },
    {
      id: "p2",
      question: "Best next action",
      answer: "Send legal-ready one-pager",
      confidence: 0.68,
      drivers: ["Blocker: MSA redlines", "Ada prefers async"],
      provenance: { source: "worker", actor: "Outreach", at: iso(hour(2)), confidence: 0.68 },
    },
  ],

  files: [
    {
      id: "f1",
      name: "Acme_MSA_v3_redlines.pdf",
      mime: "application/pdf",
      sizeBytes: 482_113,
      uploadedAt: iso(day(2)),
      uploadedBy: ryan,
    },
    {
      id: "f2",
      name: "discovery-feb-12.mp4",
      mime: "video/mp4",
      sizeBytes: 41_222_000,
      uploadedAt: iso(day(1)),
      uploadedBy: enrichment,
    },
  ],

  activity: [
    { id: "a1", at: iso(min(20)), actor: outreach, verb: "drafted", target: "follow-up email" },
    { id: "a2", at: iso(hour(6)), actor: enrichment, verb: "updated", target: "reports_to relationship" },
    { id: "a3", at: iso(day(1)), actor: ryan, verb: "viewed", target: "summary" },
  ],

  history: [
    { id: "h1", at: iso(day(14)), field: "status", from: "Cold", to: "Engaged", actor: { id: "sys", kind: "worker", label: "System" } },
    { id: "h2", at: iso(day(30)), field: "title", from: "Ops Lead", to: "Head of Operations", actor: enrichment },
  ],

  projects: [
    { id: "pr1", kind: "project", label: "Acme rollout — Phase 1", sublabel: "12 tasks · 2 blocked" },
    { id: "pr2", kind: "project", label: "Legal-ready templates", sublabel: "Shared playbook" },
  ],
  tasks: [
    { id: "tk1", kind: "task", label: "Send MSA one-pager", sublabel: "Due Thu" },
    { id: "tk2", kind: "task", label: "Schedule legal sync", sublabel: "Awaiting reply" },
    { id: "tk3", kind: "task", label: "Draft expansion proposal", sublabel: "Assigned to Outreach" },
  ],
  experiments: [
    { id: "ex1", kind: "experiment", label: "Legal-first outreach v2", sublabel: "Winning · +18% reply rate" },
  ],
};
