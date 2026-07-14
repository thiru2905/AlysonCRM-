/**
 * Alyson Prediction Center.
 * Every object gets predictions. Every prediction ships with evidence.
 * This is not analytics — it's forward-looking guidance you can question.
 */

export type PredictionKind =
  | "revenue"
  | "probability"
  | "roi"
  | "time"
  | "risk"
  | "conversion"
  | "churn"
  | "retention";

export type PredictionDirection = "up" | "down" | "flat";

export interface EvidenceItem {
  id: string;
  weight: number; // 0..1 how much it moved the number
  label: string; // "Reply rate up 24% in last 7d"
  source: string; // "Gmail", "CRM", "Experiment x_prompt_tone"
}

export interface Counterfactual {
  id: string;
  ifText: string; // "If Northwind waits past Jul 20"
  thenText: string; // "confidence drops to 61% and value to $142k"
  deltaLabel: string; // "-21%"
  tone: "up" | "down";
}

export interface NextAction {
  id: string;
  title: string;
  detail: string;
  worker: { id: string; name: string; type: string };
  expectedLift: number; // 0..1
  effortMinutes: number;
  costUsd: number;
  needsApproval: boolean;
}

export interface Subject {
  id: string;
  label: string;
  kind: "Project" | "Person" | "Company" | "Campaign" | "Worker" | "Portfolio";
}

export interface Prediction {
  id: string;
  statement: string;
  kind: PredictionKind;
  subject: Subject;
  horizonDays: number;
  updatedAt: string;

  // Numbers
  value: number; // main forecast value (units depend on kind)
  unit: "usd" | "rate" | "days" | "hours" | "count";
  baseline?: number; // e.g. today's value / naive baseline
  range: { low: number; high: number }; // uncertainty band
  confidence: number; // 0..1
  direction: PredictionDirection;

  // Auxiliary framing
  expectedRoi?: number; // e.g. 3.2 = 320%
  expectedTimeSavedHours?: number;
  risk: number; // 0..1
  opportunityCostUsd: number;

  // Explanation
  why: string; // one-paragraph plain-language reasoning
  evidence: EvidenceItem[];
  counterfactuals: Counterfactual[];
  recommendedNextAction: NextAction;

  // Graph links back into the OS
  links: {
    projects: { id: string; label: string }[];
    tasks: { id: string; label: string }[];
    workers: { id: string; label: string }[];
    experiments: { id: string; label: string }[];
    knowledge: { id: string; label: string }[];
  };
}

export const KIND_META: Record<
  PredictionKind,
  { label: string; description: string }
> = {
  revenue: { label: "Revenue", description: "Expected value in dollars." },
  probability: { label: "Probability", description: "Likelihood of an outcome." },
  roi: { label: "ROI", description: "Return on invested effort or spend." },
  time: { label: "Time", description: "Expected duration until an event." },
  risk: { label: "Risk", description: "Chance of a negative outcome." },
  conversion: {
    label: "Conversion",
    description: "Chance a subject converts.",
  },
  churn: { label: "Churn", description: "Chance a subject leaves." },
  retention: { label: "Retention", description: "Chance a subject stays." },
};

// ---------- Seed ----------

export const PREDICTIONS: Prediction[] = [
  {
    id: "pr_nw_renewal",
    statement: "Northwind will renew at $186k in the next 14 days",
    kind: "revenue",
    subject: { id: "p_nw", label: "Northwind renewal", kind: "Project" },
    horizonDays: 14,
    updatedAt: "2026-07-06T08:20:00Z",
    value: 186000,
    unit: "usd",
    baseline: 150000,
    range: { low: 168000, high: 204000 },
    confidence: 0.82,
    direction: "up",
    expectedRoi: 4.6,
    risk: 0.18,
    opportunityCostUsd: 22000,
    why: "Two positive signals dominate: budget expanded 20% at the July 2 QBR, and a champion (Head of Ops) is scheduling the renewal call. The pacing risk is the open SOC2 gap — every renewal we've won in the last 6 quarters closed after evidence was shared.",
    evidence: [
      {
        id: "e1",
        weight: 0.34,
        label: "Budget expanded from $150k → ~$185k at QBR",
        source: "Meetings",
      },
      {
        id: "e2",
        weight: 0.24,
        label: "Champion booked renewal call for Jul 16",
        source: "Calendar",
      },
      {
        id: "e3",
        weight: 0.18,
        label: "Warm opener test (x_prompt_tone) lifting replies +50%",
        source: "Experiments",
      },
      {
        id: "e4",
        weight: 0.14,
        label: "94% of similar accounts renewed post-QBR uplift",
        source: "Historical CRM",
      },
      {
        id: "e5",
        weight: 0.1,
        label: "SOC2 evidence pack now 80% complete",
        source: "Documents",
      },
    ],
    counterfactuals: [
      {
        id: "c1",
        ifText: "SOC2 evidence sent by Jul 12",
        thenText: "value trends to $198k, confidence 0.89",
        deltaLabel: "+$12k",
        tone: "up",
      },
      {
        id: "c2",
        ifText: "Renewal slips past Jul 20",
        thenText: "value drops to $142k, confidence 0.61",
        deltaLabel: "-$44k",
        tone: "down",
      },
    ],
    recommendedNextAction: {
      id: "na1",
      title: "Send SOC2 evidence pack to Northwind ops team",
      detail: "Attach draft-ready pack from Documents; Lex has redlined the MSA appendix.",
      worker: { id: "w_atlas", name: "Atlas", type: "AI Agent" },
      expectedLift: 0.07,
      effortMinutes: 4,
      costUsd: 0.02,
      needsApproval: true,
    },
    links: {
      projects: [{ id: "p_nw", label: "Northwind renewal" }],
      tasks: [
        { id: "t1", label: "Draft 42 first-touch emails" },
        { id: "t2", label: "Redline Northwind MSA v3" },
      ],
      workers: [
        { id: "w_atlas", label: "Atlas" },
        { id: "w_lex", label: "Lex" },
      ],
      experiments: [{ id: "x_prompt_tone", label: "Warm vs. formal opener" }],
      knowledge: [{ id: "k_soc2", label: "SOC2 evidence pack v3" }],
    },
  },
  {
    id: "pr_q1_pipeline",
    statement: "Q1 pipeline will beat plan by ~8%",
    kind: "revenue",
    subject: { id: "p_q1", label: "Q1 outbound cohort", kind: "Campaign" },
    horizonDays: 60,
    updatedAt: "2026-07-06T07:00:00Z",
    value: 1_180_000,
    unit: "usd",
    baseline: 1_090_000,
    range: { low: 1_020_000, high: 1_305_000 },
    confidence: 0.63,
    direction: "up",
    expectedRoi: 2.1,
    risk: 0.34,
    opportunityCostUsd: 60000,
    why: "The 3-touch sequence experiment shipped a durable +31% lift on meetings booked, and Thursday-3pm timing added another +24% on open rate. Model is pricing in reversion because both tests were on mid-market only.",
    evidence: [
      {
        id: "e1",
        weight: 0.4,
        label: "3-touch sequence shipped, +31% meetings",
        source: "Experiments",
      },
      {
        id: "e2",
        weight: 0.28,
        label: "Thu-3pm send timing shipped, +24% opens",
        source: "Experiments",
      },
      {
        id: "e3",
        weight: 0.2,
        label: "Enrichment coverage up to 91%",
        source: "Warehouse",
      },
      {
        id: "e4",
        weight: 0.12,
        label: "Enterprise cohort still under-tested",
        source: "Experiments",
      },
    ],
    counterfactuals: [
      {
        id: "c1",
        ifText: "Enterprise cohort added to the sequence test",
        thenText: "confidence rises to 0.78 with same forecast",
        deltaLabel: "+conf",
        tone: "up",
      },
      {
        id: "c2",
        ifText: "Mailer capacity cut by 30%",
        thenText: "forecast drops to $1.04M",
        deltaLabel: "-$140k",
        tone: "down",
      },
    ],
    recommendedNextAction: {
      id: "na1",
      title: "Extend the sequence test to the enterprise cohort",
      detail: "Reuse the winning warm-opener with an enterprise-specific proof point.",
      worker: { id: "w_atlas", name: "Atlas", type: "AI Agent" },
      expectedLift: 0.05,
      effortMinutes: 12,
      costUsd: 6,
      needsApproval: false,
    },
    links: {
      projects: [{ id: "p_q1", label: "Q1 outbound cohort" }],
      tasks: [],
      workers: [
        { id: "w_atlas", label: "Atlas" },
        { id: "w_mailer", label: "Mailer" },
      ],
      experiments: [
        { id: "x_sequence", label: "3-touch vs 5-touch" },
        { id: "x_timing", label: "Tue 9am vs Thu 3pm" },
      ],
      knowledge: [],
    },
  },
  {
    id: "pr_acme_expand",
    statement: "Acme will expand seats by ~22% in 30 days",
    kind: "probability",
    subject: { id: "p_ac", label: "Acme expansion", kind: "Project" },
    horizonDays: 30,
    updatedAt: "2026-07-06T09:00:00Z",
    value: 0.71,
    unit: "rate",
    baseline: 0.5,
    range: { low: 0.6, high: 0.83 },
    confidence: 0.71,
    direction: "up",
    expectedRoi: 3.8,
    risk: 0.26,
    opportunityCostUsd: 48000,
    why: "Weekly active seats up 34%, health score in the top decile, and Juno's brief has been opened by both champions. The 22% seat estimate mirrors 11 similar accounts in the last 4 quarters.",
    evidence: [
      {
        id: "e1",
        weight: 0.36,
        label: "WAU up 34% over trailing 30d",
        source: "Segment",
      },
      {
        id: "e2",
        weight: 0.28,
        label: "Health score 92 (top decile)",
        source: "Pulse pipeline",
      },
      {
        id: "e3",
        weight: 0.22,
        label: "Both champions opened last brief",
        source: "Gmail",
      },
      {
        id: "e4",
        weight: 0.14,
        label: "11 comparable accounts averaged +22% seats",
        source: "Historical CRM",
      },
    ],
    counterfactuals: [
      {
        id: "c1",
        ifText: "Founder-tier price test rolled to Acme",
        thenText: "seat expansion likely +28%",
        deltaLabel: "+6pp",
        tone: "up",
      },
      {
        id: "c2",
        ifText: "Support ticket backlog >10 days",
        thenText: "probability drops to 0.54",
        deltaLabel: "-17pp",
        tone: "down",
      },
    ],
    recommendedNextAction: {
      id: "na1",
      title: "Ship Juno's renewal + expansion brief to Maya for review",
      detail: "Include the seat model and top-decile health snapshot.",
      worker: { id: "w_juno", name: "Juno", type: "AI Agent" },
      expectedLift: 0.08,
      effortMinutes: 3,
      costUsd: 0.03,
      needsApproval: true,
    },
    links: {
      projects: [{ id: "p_ac", label: "Acme expansion" }],
      tasks: [],
      workers: [
        { id: "w_juno", label: "Juno" },
        { id: "w_pulse", label: "Pulse" },
      ],
      experiments: [{ id: "x_audience", label: "Ops vs Finance persona" }],
      knowledge: [{ id: "k_acme_health", label: "Acme health rollup" }],
    },
  },
  {
    id: "pr_globex_churn",
    statement: "Globex has a 41% chance of churning at renewal",
    kind: "churn",
    subject: { id: "c_globex", label: "Globex", kind: "Company" },
    horizonDays: 45,
    updatedAt: "2026-07-06T06:30:00Z",
    value: 0.41,
    unit: "rate",
    baseline: 0.12,
    range: { low: 0.28, high: 0.55 },
    confidence: 0.77,
    direction: "up",
    risk: 0.62,
    opportunityCostUsd: 82000,
    expectedTimeSavedHours: 0,
    why: "Three deteriorating signals: WAU down 22%, exec sponsor left last month, and the last two support tickets escalated. History says 3 concurrent red signals correlate with 39% churn.",
    evidence: [
      {
        id: "e1",
        weight: 0.34,
        label: "Weekly active users down 22%",
        source: "Segment",
      },
      {
        id: "e2",
        weight: 0.28,
        label: "Exec sponsor departed Jun 18",
        source: "Gmail + LinkedIn",
      },
      {
        id: "e3",
        weight: 0.22,
        label: "Two tickets escalated in 30 days",
        source: "Zendesk",
      },
      {
        id: "e4",
        weight: 0.16,
        label: "3 red signals → 39% historical churn",
        source: "Historical CRM",
      },
    ],
    counterfactuals: [
      {
        id: "c1",
        ifText: "Exec re-sponsor found by Jul 20",
        thenText: "churn drops to 22%, retention $82k saved",
        deltaLabel: "-19pp",
        tone: "up",
      },
      {
        id: "c2",
        ifText: "No CSM touch in next 10 days",
        thenText: "churn rises to 58%",
        deltaLabel: "+17pp",
        tone: "down",
      },
    ],
    recommendedNextAction: {
      id: "na1",
      title: "Book a new-sponsor discovery call this week",
      detail: "Juno drafted an intro; needs Maya's approval before send.",
      worker: { id: "w_juno", name: "Juno", type: "AI Agent" },
      expectedLift: 0.14,
      effortMinutes: 8,
      costUsd: 0.04,
      needsApproval: true,
    },
    links: {
      projects: [],
      tasks: [],
      workers: [{ id: "w_juno", label: "Juno" }],
      experiments: [],
      knowledge: [{ id: "k_globex_health", label: "Globex health decline" }],
    },
  },
  {
    id: "pr_time_saved",
    statement: "Automation will save the team 46 hours this week",
    kind: "time",
    subject: { id: "port", label: "This workspace", kind: "Portfolio" },
    horizonDays: 7,
    updatedAt: "2026-07-06T05:00:00Z",
    value: 46,
    unit: "hours",
    baseline: 12,
    range: { low: 38, high: 54 },
    confidence: 0.86,
    direction: "up",
    expectedTimeSavedHours: 46,
    risk: 0.08,
    opportunityCostUsd: 9200,
    why: "The queue holds 214 tasks Atlas, Scout, Mailer and Pulse can execute autonomously above their approval thresholds. 46h is the median of the last 8 weeks after subtracting review overhead.",
    evidence: [
      {
        id: "e1",
        weight: 0.42,
        label: "214 tasks queued above autonomy threshold",
        source: "Task engine",
      },
      {
        id: "e2",
        weight: 0.3,
        label: "8-week median 46h saved / week",
        source: "Historical worker logs",
      },
      {
        id: "e3",
        weight: 0.28,
        label: "Review overhead measured at 11%",
        source: "Approvals log",
      },
    ],
    counterfactuals: [
      {
        id: "c1",
        ifText: "Approval SLA drops to 10min",
        thenText: "time saved rises to 58h",
        deltaLabel: "+12h",
        tone: "up",
      },
      {
        id: "c2",
        ifText: "Atlas paused",
        thenText: "time saved drops to 18h",
        deltaLabel: "-28h",
        tone: "down",
      },
    ],
    recommendedNextAction: {
      id: "na1",
      title: "Clear the 6-item approval queue before noon",
      detail: "Unblocks Atlas and Juno for the rest of the day.",
      worker: { id: "w_maya", name: "Maya Chen", type: "Human" },
      expectedLift: 0.12,
      effortMinutes: 15,
      costUsd: 0,
      needsApproval: false,
    },
    links: {
      projects: [],
      tasks: [],
      workers: [
        { id: "w_atlas", label: "Atlas" },
        { id: "w_juno", label: "Juno" },
        { id: "w_mailer", label: "Mailer" },
        { id: "w_pulse", label: "Pulse" },
      ],
      experiments: [],
      knowledge: [],
    },
  },
];

// ---------- Portfolio roll-up ----------

export interface PortfolioForecast {
  predictedRevenueUsd: number;
  predictedProfitUsd: number;
  predictedTimeSavedHours: number;
  predictedRiskUsd: number; // exposure if we do nothing
  confidence: number; // blended
  contributingCount: number;
  recommendedSchedule: ScheduleBlock[];
  expectedOutcomes: ExpectedOutcome[];
}

export interface ScheduleBlock {
  id: string;
  time: string; // "09:00"
  duration: string; // "15 min"
  title: string;
  detail: string;
  worker: string;
  needsApproval: boolean;
}

export interface ExpectedOutcome {
  id: string;
  label: string;
  value: string;
  hint: string;
}

export const PORTFOLIO_FORECAST: PortfolioForecast = {
  predictedRevenueUsd: 428_000,
  predictedProfitUsd: 296_000,
  predictedTimeSavedHours: 46,
  predictedRiskUsd: 82_000, // Globex exposure
  confidence: 0.78,
  contributingCount: 5,
  recommendedSchedule: [
    {
      id: "s1",
      time: "09:00",
      duration: "6 min",
      title: "Clear approval queue",
      detail: "6 items · unblocks Atlas + Juno for the day.",
      worker: "You",
      needsApproval: false,
    },
    {
      id: "s2",
      time: "09:30",
      duration: "20 min",
      title: "Review Northwind SOC2 pack",
      detail: "Lex redlined the appendix; Atlas sends after approval.",
      worker: "Atlas + Lex",
      needsApproval: true,
    },
    {
      id: "s3",
      time: "11:00",
      duration: "30 min",
      title: "Globex sponsor-loss standup",
      detail: "Juno-drafted brief in your inbox; decide re-sponsor path.",
      worker: "Juno",
      needsApproval: true,
    },
    {
      id: "s4",
      time: "14:00",
      duration: "45 min",
      title: "Ship Acme expansion brief",
      detail: "Predicted +8pp lift on seat expansion.",
      worker: "Juno",
      needsApproval: true,
    },
    {
      id: "s5",
      time: "16:00",
      duration: "async",
      title: "Extend sequence test to enterprise",
      detail: "Atlas can run this autonomously — no approval needed.",
      worker: "Atlas",
      needsApproval: false,
    },
  ],
  expectedOutcomes: [
    {
      id: "o1",
      label: "Northwind renewal confidence",
      value: "0.82 → 0.89",
      hint: "if SOC2 pack ships today",
    },
    {
      id: "o2",
      label: "Globex churn risk",
      value: "41% → 22%",
      hint: "if new sponsor call is booked this week",
    },
    {
      id: "o3",
      label: "Acme expansion probability",
      value: "0.71 → 0.79",
      hint: "if brief is reviewed today",
    },
    {
      id: "o4",
      label: "Team hours reclaimed",
      value: "≈ 46h",
      hint: "vs. 12h baseline last week",
    },
  ],
};

// ---------- Helpers ----------

export function getPrediction(id: string) {
  return PREDICTIONS.find((p) => p.id === id);
}

export function formatValue(
  unit: Prediction["unit"],
  v: number,
): string {
  switch (unit) {
    case "usd":
      if (Math.abs(v) >= 1_000_000)
        return `$${(v / 1_000_000).toFixed(2)}M`;
      if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
      return `$${v.toFixed(0)}`;
    case "rate":
      return `${Math.round(v * 100)}%`;
    case "days":
      return `${v.toFixed(0)}d`;
    case "hours":
      return `${v.toFixed(0)}h`;
    case "count":
      return v.toLocaleString();
  }
}

export function signedPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "" : "±";
  return `${sign}${(n * 100).toFixed(1)}%`;
}
