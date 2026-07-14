// Alyson CRM — a lens over the OS primitives.
// Leads → Projects · Customers → Entities · Opportunities → Predictions
// Conversations → Knowledge · Follow-ups → Tasks · Salespeople → Workers.

export type PipelineStage =
  | "new"
  | "qualifying"
  | "engaged"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type Temperature = "cold" | "warm" | "hot";

export interface CrmLead {
  id: string;
  company: string;
  contact: string;
  title: string;
  stage: PipelineStage;
  value: number;
  probability: number; // 0..1
  temperature: Temperature;
  ownerWorkerId: string;
  ownerWorkerName: string;
  ownerKind: "human" | "ai" | "browser";
  lastTouch: string; // relative time
  nextAction: string;
  nextActionKind: "human" | "ai" | "browser" | "api";
  aiRationale: string;
  projectedCloseDays: number;
  liftFromExperiment?: string;
  knowledgeCount: number;
  taskCount: number;
}

export interface CrmMoment {
  id: string;
  at: string;
  kind: "email" | "call" | "meeting" | "browser" | "ai" | "signal";
  who: string;
  summary: string;
  leadId?: string;
  extracted?: string;
}

export interface CrmExperiment {
  id: string;
  name: string;
  hypothesis: string;
  lift: number; // percent
  confidence: number; // 0..1
  arm: string;
  appliesTo: string;
}

export interface CrmWorker {
  id: string;
  name: string;
  role: string;
  kind: "human" | "ai" | "browser";
  activeLeads: number;
  winRate: number;
  medianCycleDays: number;
  workingOn: string;
}

export const LEADS: CrmLead[] = [
  {
    id: "L-8842",
    company: "Northwind Materials",
    contact: "Priya Rao",
    title: "VP Operations",
    stage: "negotiation",
    value: 148000,
    probability: 0.78,
    temperature: "hot",
    ownerWorkerId: "W-atlas",
    ownerWorkerName: "Atlas",
    ownerKind: "ai",
    lastTouch: "12m ago",
    nextAction: "Send redlined MSA + procurement addendum",
    nextActionKind: "ai",
    aiRationale:
      "Priya asked legal to review §7 twice. Similar deals closed 4.1× faster when redlines were sent within 24h of the ask.",
    projectedCloseDays: 6,
    liftFromExperiment: "Subject-B +18%",
    knowledgeCount: 34,
    taskCount: 5,
  },
  {
    id: "L-8811",
    company: "Halden Robotics",
    contact: "Marc Devlin",
    title: "Head of RevOps",
    stage: "proposal",
    value: 92000,
    probability: 0.54,
    temperature: "warm",
    ownerWorkerId: "W-nova",
    ownerWorkerName: "Nova",
    ownerKind: "ai",
    lastTouch: "1h ago",
    nextAction: "Book working session with security reviewer",
    nextActionKind: "browser",
    aiRationale:
      "Security review is the top blocker for Robotics-segment deals (73% of stalls). Booking now compresses the cycle by 9 days.",
    projectedCloseDays: 14,
    knowledgeCount: 22,
    taskCount: 3,
  },
  {
    id: "L-8790",
    company: "Cove & Fjord Insurance",
    contact: "Ines Vidal",
    title: "Director, Underwriting",
    stage: "engaged",
    value: 210000,
    probability: 0.41,
    temperature: "warm",
    ownerWorkerId: "W-mira",
    ownerWorkerName: "Mira",
    ownerKind: "human",
    lastTouch: "3h ago",
    nextAction: "Share underwriting case study (Nordic peers)",
    nextActionKind: "ai",
    aiRationale:
      "Ines forwarded the last email to two peers. Peer-referenced case studies lift reply rate by 34% in this segment.",
    projectedCloseDays: 28,
    liftFromExperiment: "Case-study-C +11%",
    knowledgeCount: 18,
    taskCount: 4,
  },
  {
    id: "L-8765",
    company: "Meridian Health Group",
    contact: "Dr. Aya Sato",
    title: "CMO",
    stage: "qualifying",
    value: 66000,
    probability: 0.22,
    temperature: "cold",
    ownerWorkerId: "W-atlas",
    ownerWorkerName: "Atlas",
    ownerKind: "ai",
    lastTouch: "yesterday",
    nextAction: "Re-open with clinical outcomes brief",
    nextActionKind: "ai",
    aiRationale:
      "Aya opened 4/4 clinical briefs last quarter but never a pricing note. Leading with outcomes beats pricing 2.3×.",
    projectedCloseDays: 46,
    knowledgeCount: 9,
    taskCount: 2,
  },
  {
    id: "L-8740",
    company: "Sable Property Trust",
    contact: "Owen Frey",
    title: "Head of Acquisitions",
    stage: "engaged",
    value: 320000,
    probability: 0.63,
    temperature: "hot",
    ownerWorkerId: "W-scout",
    ownerWorkerName: "Scout",
    ownerKind: "browser",
    lastTouch: "45m ago",
    nextAction: "Pull last 3 acquisition filings + brief",
    nextActionKind: "browser",
    aiRationale:
      "Owen mentioned two off-market assets. Filings surface intent signals 5–8 days before RFP.",
    projectedCloseDays: 18,
    knowledgeCount: 27,
    taskCount: 6,
  },
  {
    id: "L-8702",
    company: "Larkspur Media",
    contact: "Jules Weiss",
    title: "COO",
    stage: "new",
    value: 44000,
    probability: 0.14,
    temperature: "cold",
    ownerWorkerId: "W-nova",
    ownerWorkerName: "Nova",
    ownerKind: "ai",
    lastTouch: "2d ago",
    nextAction: "Enrich + score against ICP-v4",
    nextActionKind: "api",
    aiRationale:
      "Firmographics incomplete. ICP-v4 has 91% precision on media-segment scoring.",
    projectedCloseDays: 60,
    knowledgeCount: 4,
    taskCount: 1,
  },
];

export const MOMENTS: CrmMoment[] = [
  {
    id: "m1",
    at: "12m ago",
    kind: "email",
    who: "Priya Rao → Atlas",
    summary: "Legal has one remaining concern on §7.2 indemnity scope.",
    leadId: "L-8842",
    extracted: "Blocker: §7.2 indemnity · Urgency: high",
  },
  {
    id: "m2",
    at: "38m ago",
    kind: "ai",
    who: "Atlas",
    summary: "Drafted redline v3 addressing §7.2 and forwarded to Mira for review.",
    leadId: "L-8842",
    extracted: "Task created: Approve redline v3",
  },
  {
    id: "m3",
    at: "45m ago",
    kind: "browser",
    who: "Scout",
    summary: "Pulled Sable Trust's Q3 acquisition filings from EDGAR.",
    leadId: "L-8740",
    extracted: "3 signals extracted → Knowledge",
  },
  {
    id: "m4",
    at: "1h ago",
    kind: "call",
    who: "Marc Devlin ↔ Mira",
    summary:
      "Security team can meet Thursday. Marc wants SOC2 + pen-test summary before.",
    leadId: "L-8811",
    extracted: "Task: Send SOC2 pack · Owner: Nova",
  },
  {
    id: "m5",
    at: "3h ago",
    kind: "signal",
    who: "Cove & Fjord",
    summary: "Two peers viewed the underwriting one-pager Ines forwarded.",
    leadId: "L-8790",
    extracted: "Warm intro path identified",
  },
  {
    id: "m6",
    at: "yesterday",
    kind: "meeting",
    who: "Dr. Aya Sato ↔ Atlas",
    summary: "Discovery call — outcomes-first framing resonated.",
    leadId: "L-8765",
    extracted: "ICP fit: 0.71 · Stage → qualifying",
  },
];

export const EXPERIMENTS: CrmExperiment[] = [
  {
    id: "x1",
    name: "First-touch subject line",
    hypothesis: "Naming the peer buyer lifts reply rate.",
    lift: 18,
    confidence: 0.94,
    arm: "Subject-B (peer-named)",
    appliesTo: "Enterprise · Ops persona",
  },
  {
    id: "x2",
    name: "Discovery framing",
    hypothesis: "Outcomes-first beats pricing-first in clinical segments.",
    lift: 27,
    confidence: 0.88,
    arm: "Frame-Outcomes",
    appliesTo: "Health · Clinical persona",
  },
  {
    id: "x3",
    name: "Redline turnaround SLA",
    hypothesis: "Sub-24h redlines close 4× faster.",
    lift: 41,
    confidence: 0.97,
    arm: "SLA-24h",
    appliesTo: "Negotiation stage",
  },
];

export const WORKERS: CrmWorker[] = [
  {
    id: "W-atlas",
    name: "Atlas",
    role: "Deal desk AI",
    kind: "ai",
    activeLeads: 12,
    winRate: 0.42,
    medianCycleDays: 21,
    workingOn: "Northwind redline v3",
  },
  {
    id: "W-nova",
    name: "Nova",
    role: "SDR AI",
    kind: "ai",
    activeLeads: 34,
    winRate: 0.19,
    medianCycleDays: 38,
    workingOn: "SOC2 pack for Halden",
  },
  {
    id: "W-scout",
    name: "Scout",
    role: "Research browser",
    kind: "browser",
    activeLeads: 7,
    winRate: 0.51,
    medianCycleDays: 17,
    workingOn: "EDGAR filings — Sable",
  },
  {
    id: "W-mira",
    name: "Mira",
    role: "Account exec",
    kind: "human",
    activeLeads: 9,
    winRate: 0.58,
    medianCycleDays: 26,
    workingOn: "Cove & Fjord discovery",
  },
];

export const STAGES: { id: PipelineStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "qualifying", label: "Qualifying" },
  { id: "engaged", label: "Engaged" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
];

export function formatMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n}`;
}

export function pipelineTotals(leads: CrmLead[]) {
  const total = leads.reduce((s, l) => s + l.value, 0);
  const weighted = leads.reduce((s, l) => s + l.value * l.probability, 0);
  return { total, weighted };
}
