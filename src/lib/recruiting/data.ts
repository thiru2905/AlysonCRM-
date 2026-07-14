// Alyson Recruiting — a lens over the OS primitives.
// Candidates → People · Roles → Projects · Recruiters → Workers
// LinkedIn/Ashby imports → Sources · Resumes → Knowledge
// Scoring → Predictions · Outreach → Experiments.

export type PipelinePhase =
  | "sourced"
  | "screen"
  | "interview"
  | "onsite"
  | "offer"
  | "hired"
  | "passed";

export type CandidateHeat = "cold" | "warm" | "hot";
export type SourceKind = "linkedin" | "referral" | "ats" | "inbound" | "browser";

export interface Role {
  id: string;
  title: string;
  team: string;
  location: string;
  openings: number;
  daysOpen: number;
  slaDays: number;
  ownerWorkerId: string;
  ownerWorkerName: string;
  ownerKind: "human" | "ai" | "browser";
  activeCandidates: number;
  predictedTimeToFillDays: number;
  predictedQuality: number; // 0..1
  phaseCounts: Partial<Record<PipelinePhase, number>>;
}

export interface Candidate {
  id: string;
  name: string;
  headline: string;
  location: string;
  roleId: string;
  phase: PipelinePhase;
  heat: CandidateHeat;
  score: number; // 0..1 fit prediction
  scoreDelta: number; // vs last read
  offerProbability: number; // 0..1
  source: SourceKind;
  sourceLabel: string;
  ownerWorkerId: string;
  ownerWorkerName: string;
  ownerKind: "human" | "ai" | "browser";
  lastTouch: string;
  nextAction: string;
  nextActionKind: "human" | "ai" | "browser" | "api";
  aiRationale: string;
  skills: string[];
  resumeSnippets: number;
  liftFromExperiment?: string;
}

export interface Moment {
  id: string;
  at: string;
  kind: "outreach" | "reply" | "interview" | "ai" | "browser" | "signal";
  who: string;
  summary: string;
  candidateId?: string;
  extracted?: string;
}

export interface OutreachExperiment {
  id: string;
  name: string;
  hypothesis: string;
  replyLift: number;
  confidence: number;
  arm: string;
  appliesTo: string;
}

export interface Recruiter {
  id: string;
  name: string;
  role: string;
  kind: "human" | "ai" | "browser";
  activeReqs: number;
  passRate: number; // screen → onsite
  medianDaysToOffer: number;
  workingOn: string;
}

export const ROLES: Role[] = [
  {
    id: "R-1041",
    title: "Staff ML Engineer",
    team: "Applied Research",
    location: "Remote · US/EU",
    openings: 2,
    daysOpen: 18,
    slaDays: 45,
    ownerWorkerId: "W-atlas",
    ownerWorkerName: "Atlas",
    ownerKind: "ai",
    activeCandidates: 34,
    predictedTimeToFillDays: 27,
    predictedQuality: 0.82,
    phaseCounts: { sourced: 12, screen: 9, interview: 7, onsite: 4, offer: 2 },
  },
  {
    id: "R-1039",
    title: "Founding Product Designer",
    team: "Design",
    location: "New York",
    openings: 1,
    daysOpen: 32,
    slaDays: 40,
    ownerWorkerId: "W-mira",
    ownerWorkerName: "Mira",
    ownerKind: "human",
    activeCandidates: 22,
    predictedTimeToFillDays: 14,
    predictedQuality: 0.74,
    phaseCounts: { sourced: 4, screen: 6, interview: 8, onsite: 3, offer: 1 },
  },
  {
    id: "R-1034",
    title: "GTM Lead, Enterprise",
    team: "Revenue",
    location: "SF · Hybrid",
    openings: 1,
    daysOpen: 51,
    slaDays: 45,
    ownerWorkerId: "W-nova",
    ownerWorkerName: "Nova",
    ownerKind: "ai",
    activeCandidates: 41,
    predictedTimeToFillDays: 22,
    predictedQuality: 0.61,
    phaseCounts: { sourced: 18, screen: 11, interview: 6, onsite: 4, offer: 2 },
  },
  {
    id: "R-1029",
    title: "Security Engineer",
    team: "Platform",
    location: "Remote",
    openings: 1,
    daysOpen: 12,
    slaDays: 60,
    ownerWorkerId: "W-scout",
    ownerWorkerName: "Scout",
    ownerKind: "browser",
    activeCandidates: 15,
    predictedTimeToFillDays: 41,
    predictedQuality: 0.79,
    phaseCounts: { sourced: 9, screen: 3, interview: 2, onsite: 1 },
  },
];

export const CANDIDATES: Candidate[] = [
  {
    id: "C-8842",
    name: "Priya Ravindra",
    headline: "Staff ML @ Rally · ex-DeepMind",
    location: "London",
    roleId: "R-1041",
    phase: "onsite",
    heat: "hot",
    score: 0.91,
    scoreDelta: 0.04,
    offerProbability: 0.72,
    source: "linkedin",
    sourceLabel: "LinkedIn Recruiter · Boolean-B",
    ownerWorkerId: "W-atlas",
    ownerWorkerName: "Atlas",
    ownerKind: "ai",
    lastTouch: "22m ago",
    nextAction: "Send onsite prep + panel bios",
    nextActionKind: "ai",
    aiRationale:
      "Priya's onsite is in 36h. Candidates who received prep packs within 48h accepted 2.1× more offers in this segment.",
    skills: ["PyTorch", "Distributed training", "Retrieval", "Systems"],
    resumeSnippets: 18,
    liftFromExperiment: "Subject-B +23%",
  },
  {
    id: "C-8830",
    name: "Marc Devlin",
    headline: "Sr Designer · ex-Linear, ex-Figma",
    location: "New York",
    roleId: "R-1039",
    phase: "offer",
    heat: "hot",
    score: 0.88,
    scoreDelta: 0.02,
    offerProbability: 0.81,
    source: "referral",
    sourceLabel: "Referral · Ines Vidal",
    ownerWorkerId: "W-mira",
    ownerWorkerName: "Mira",
    ownerKind: "human",
    lastTouch: "1h ago",
    nextAction: "Approve compensation band 4B ($218k + 0.4%)",
    nextActionKind: "human",
    aiRationale:
      "Comparable NYC design leads accepted 4B 78% of the time; 4A would drop acceptance to ~54%.",
    skills: ["Product design", "Systems thinking", "0→1", "Prototyping"],
    resumeSnippets: 12,
  },
  {
    id: "C-8811",
    name: "Aya Sato",
    headline: "ML Research · Ex-Anthropic",
    location: "Berlin",
    roleId: "R-1041",
    phase: "interview",
    heat: "warm",
    score: 0.79,
    scoreDelta: 0.11,
    offerProbability: 0.44,
    source: "browser",
    sourceLabel: "Scout · GitHub crawl",
    ownerWorkerId: "W-atlas",
    ownerWorkerName: "Atlas",
    ownerKind: "ai",
    lastTouch: "3h ago",
    nextAction: "Schedule technical interview with Kai",
    nextActionKind: "browser",
    aiRationale:
      "Aya's last reply had strong intent signal. Scheduling within 24h lifts progression 38%.",
    skills: ["JAX", "RLHF", "Evals"],
    resumeSnippets: 9,
    liftFromExperiment: "Frame-Research +14%",
  },
  {
    id: "C-8790",
    name: "Owen Frey",
    headline: "Head of Sales · Merit",
    location: "SF",
    roleId: "R-1034",
    phase: "screen",
    heat: "warm",
    score: 0.68,
    scoreDelta: -0.03,
    offerProbability: 0.28,
    source: "ats",
    sourceLabel: "Ashby import · Q3-batch",
    ownerWorkerId: "W-nova",
    ownerWorkerName: "Nova",
    ownerKind: "ai",
    lastTouch: "5h ago",
    nextAction: "Send tailored intro referencing Merit's ARR growth",
    nextActionKind: "ai",
    aiRationale:
      "Owen opens 3× more when the first line names specific metrics. Personalized-metric arm is winning by 27%.",
    skills: ["Enterprise sales", "Team building", "Land-and-expand"],
    resumeSnippets: 11,
  },
  {
    id: "C-8765",
    name: "Jules Weiss",
    headline: "Security Engineer · Cloudflare",
    location: "Lisbon",
    roleId: "R-1029",
    phase: "sourced",
    heat: "warm",
    score: 0.74,
    scoreDelta: 0.06,
    offerProbability: 0.19,
    source: "linkedin",
    sourceLabel: "LinkedIn · InMail-C",
    ownerWorkerId: "W-scout",
    ownerWorkerName: "Scout",
    ownerKind: "browser",
    lastTouch: "yesterday",
    nextAction: "First outreach — variant C (open-source hook)",
    nextActionKind: "ai",
    aiRationale:
      "Jules has 4 recent OSS commits to a policy engine. OSS-hook variant is at +19% reply for this persona.",
    skills: ["Zero trust", "WAF", "Rust", "Threat modeling"],
    resumeSnippets: 6,
    liftFromExperiment: "OSS-hook +19%",
  },
  {
    id: "C-8740",
    name: "Ines Vidal",
    headline: "Design Engineer · Vercel",
    location: "Madrid",
    roleId: "R-1039",
    phase: "interview",
    heat: "hot",
    score: 0.84,
    scoreDelta: 0.07,
    offerProbability: 0.58,
    source: "inbound",
    sourceLabel: "Inbound · careers page",
    ownerWorkerId: "W-mira",
    ownerWorkerName: "Mira",
    ownerKind: "human",
    lastTouch: "45m ago",
    nextAction: "Move to onsite — book portfolio review",
    nextActionKind: "human",
    aiRationale:
      "Score jumped +7 after the take-home review. Fast progression to onsite doubles offer probability.",
    skills: ["React", "Motion", "Design systems"],
    resumeSnippets: 14,
  },
  {
    id: "C-8702",
    name: "Kai Nakamura",
    headline: "ML Infra · Databricks",
    location: "Seattle",
    roleId: "R-1041",
    phase: "screen",
    heat: "cold",
    score: 0.52,
    scoreDelta: -0.08,
    offerProbability: 0.11,
    source: "linkedin",
    sourceLabel: "LinkedIn · Boolean-A",
    ownerWorkerId: "W-atlas",
    ownerWorkerName: "Atlas",
    ownerKind: "ai",
    lastTouch: "2d ago",
    nextAction: "Downgrade priority — signal misfit on research depth",
    nextActionKind: "api",
    aiRationale:
      "Resume overlaps with infra, not research. Similar profiles converted at 4% for this req.",
    skills: ["Spark", "Kubernetes", "Ray"],
    resumeSnippets: 7,
  },
];

export const MOMENTS: Moment[] = [
  {
    id: "m1",
    at: "22m ago",
    kind: "ai",
    who: "Atlas",
    summary: "Drafted onsite prep pack v2 with panel bios and 3 warm-up questions.",
    candidateId: "C-8842",
    extracted: "Task created: Approve prep pack",
  },
  {
    id: "m2",
    at: "1h ago",
    kind: "reply",
    who: "Marc Devlin → Mira",
    summary: "Would love to see comp band and equity ladder before Friday.",
    candidateId: "C-8830",
    extracted: "Blocker: Comp approval · Urgency: high",
  },
  {
    id: "m3",
    at: "3h ago",
    kind: "browser",
    who: "Scout",
    summary: "Enriched Aya's profile with 4 recent JAX commits and 2 talks.",
    candidateId: "C-8811",
    extracted: "Score +0.11 → Knowledge",
  },
  {
    id: "m4",
    at: "5h ago",
    kind: "outreach",
    who: "Nova → Owen Frey",
    summary: "Sent variant-C intro referencing Merit's 3× ARR growth.",
    candidateId: "C-8790",
    extracted: "Experiment · Personalized-metric",
  },
  {
    id: "m5",
    at: "yesterday",
    kind: "signal",
    who: "Jules Weiss",
    summary: "Pushed 3 commits to open-policy-agent — active OSS signal.",
    candidateId: "C-8765",
    extracted: "Heat: warm → active",
  },
  {
    id: "m6",
    at: "yesterday",
    kind: "interview",
    who: "Ines Vidal ↔ Mira",
    summary: "Take-home review — strong systems thinking, ships fast.",
    candidateId: "C-8740",
    extracted: "Score +0.07 · Recommend onsite",
  },
];

export const EXPERIMENTS: OutreachExperiment[] = [
  {
    id: "x1",
    name: "First-touch subject",
    hypothesis: "Naming a shipped project lifts reply rate on senior IC roles.",
    replyLift: 23,
    confidence: 0.95,
    arm: "Subject-B (project-named)",
    appliesTo: "Senior IC · Engineering",
  },
  {
    id: "x2",
    name: "Outreach hook",
    hypothesis: "Referencing OSS commits beats generic value-prop for security IC.",
    replyLift: 19,
    confidence: 0.9,
    arm: "OSS-hook",
    appliesTo: "Security · Platform",
  },
  {
    id: "x3",
    name: "Screening framing",
    hypothesis: "Research-framed screens progress 38% more ML candidates.",
    replyLift: 14,
    confidence: 0.86,
    arm: "Frame-Research",
    appliesTo: "Research · ML",
  },
];

export const RECRUITERS: Recruiter[] = [
  {
    id: "W-atlas",
    name: "Atlas",
    role: "Sourcing AI",
    kind: "ai",
    activeReqs: 3,
    passRate: 0.41,
    medianDaysToOffer: 24,
    workingOn: "ML sourcing for R-1041",
  },
  {
    id: "W-nova",
    name: "Nova",
    role: "Outreach AI",
    kind: "ai",
    activeReqs: 4,
    passRate: 0.22,
    medianDaysToOffer: 33,
    workingOn: "GTM Lead outreach batch",
  },
  {
    id: "W-scout",
    name: "Scout",
    role: "Research browser",
    kind: "browser",
    activeReqs: 2,
    passRate: 0.48,
    medianDaysToOffer: 19,
    workingOn: "GitHub enrichment · Security",
  },
  {
    id: "W-mira",
    name: "Mira",
    role: "Recruiter",
    kind: "human",
    activeReqs: 2,
    passRate: 0.61,
    medianDaysToOffer: 22,
    workingOn: "Design offer for Marc",
  },
];

export const PHASES: { id: PipelinePhase; label: string }[] = [
  { id: "sourced", label: "Sourced" },
  { id: "screen", label: "Screen" },
  { id: "interview", label: "Interview" },
  { id: "onsite", label: "Onsite" },
  { id: "offer", label: "Offer" },
  { id: "hired", label: "Hired" },
];

export function sourceInitial(k: SourceKind) {
  return k === "linkedin"
    ? "in"
    : k === "referral"
      ? "ref"
      : k === "ats"
        ? "ats"
        : k === "browser"
          ? "web"
          : "in→";
}
