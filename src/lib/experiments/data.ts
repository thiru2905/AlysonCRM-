/**
 * Alyson Experiments — everything is experimentable.
 * Prompts, models, audiences, workers, sequences, timing, budget,
 * campaigns, workflows. Every experiment loops back to the graph.
 */

export type ExperimentKind =
  | "prompt"
  | "model"
  | "audience"
  | "worker"
  | "sequence"
  | "timing"
  | "budget"
  | "campaign"
  | "workflow";

export type ExperimentStatus =
  | "draft"
  | "running"
  | "shipped"
  | "rolled_back"
  | "inconclusive"
  | "paused";

export interface Variant {
  id: string;
  label: string; // "A", "B", "Control"
  name: string;
  description: string;
  allocation: number; // 0..1 traffic share
  samples: number;
  conversions: number;
  conversionRate: number; // 0..1
  isControl?: boolean;
  isWinner?: boolean;
}

export interface Metric {
  id: string;
  name: string;
  kind: "primary" | "guardrail" | "secondary";
  unit: "rate" | "count" | "currency" | "duration_ms";
  baseline: number;
  observed: number;
}

export interface Links {
  projects: { id: string; label: string }[];
  tasks: { id: string; label: string }[];
  workers: { id: string; name: string }[];
  predictions: { id: string; statement: string; confidence: number }[];
  knowledge: { id: string; title: string; source: string }[];
}

export interface Experiment {
  id: string;
  name: string;
  kind: ExperimentKind;
  status: ExperimentStatus;
  hypothesis: string;
  owner: string; // worker id or human name
  startedAt: string;
  endedAt?: string;
  variants: Variant[];
  metrics: Metric[];
  primaryMetricId: string;
  lift: number; // observed - baseline / baseline, e.g. 0.184 = +18.4%
  confidence: number; // 0..1
  significance: number; // p-ish, 0..1 (lower = more significant)
  minSamplesPerVariant: number;
  learningSummary: string;
  links: Links;
}

export const EXPERIMENT_KINDS: Record<
  ExperimentKind,
  { label: string; description: string }
> = {
  prompt: { label: "Prompt", description: "Instruction or system message variants." },
  model: { label: "Model", description: "Different LLMs or model versions." },
  audience: { label: "Audience", description: "Who is targeted." },
  worker: { label: "Worker", description: "Which worker executes." },
  sequence: { label: "Sequence", description: "Order and count of touches." },
  timing: { label: "Timing", description: "When to send or run." },
  budget: { label: "Budget", description: "Spend allocation." },
  campaign: { label: "Campaign", description: "End-to-end creative + offer." },
  workflow: { label: "Workflow", description: "The pipeline itself." },
};

export const STATUS_TONE: Record<
  ExperimentStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "text-muted-foreground" },
  running: { label: "Running", className: "text-ai" },
  shipped: { label: "Shipped", className: "text-emerald-500" },
  rolled_back: { label: "Rolled back", className: "text-destructive" },
  inconclusive: { label: "Inconclusive", className: "text-muted-foreground" },
  paused: { label: "Paused", className: "text-amber-500" },
};

// ---------- Seed ----------

export const EXPERIMENTS: Experiment[] = [
  {
    id: "x_prompt_tone",
    name: "Warm vs. formal first-touch tone",
    kind: "prompt",
    status: "running",
    hypothesis:
      "Prospects reply more to a warm, colloquial opener than a formal, structured one — especially in mid-market SaaS.",
    owner: "w_atlas",
    startedAt: "2026-06-28T00:00:00Z",
    variants: [
      {
        id: "v1",
        label: "A",
        name: "Formal opener",
        description: "3 sentences, structured, links to case study.",
        allocation: 0.5,
        samples: 812,
        conversions: 48,
        conversionRate: 0.0591,
        isControl: true,
      },
      {
        id: "v2",
        label: "B",
        name: "Warm opener",
        description: "2 sentences, first-person, one question.",
        allocation: 0.5,
        samples: 798,
        conversions: 71,
        conversionRate: 0.089,
        isWinner: true,
      },
    ],
    metrics: [
      {
        id: "m1",
        name: "Reply rate",
        kind: "primary",
        unit: "rate",
        baseline: 0.0591,
        observed: 0.089,
      },
      {
        id: "m2",
        name: "Unsubscribe rate",
        kind: "guardrail",
        unit: "rate",
        baseline: 0.008,
        observed: 0.007,
      },
      {
        id: "m3",
        name: "Meetings booked",
        kind: "secondary",
        unit: "count",
        baseline: 12,
        observed: 19,
      },
    ],
    primaryMetricId: "m1",
    lift: 0.506,
    confidence: 0.94,
    significance: 0.02,
    minSamplesPerVariant: 500,
    learningSummary:
      "Warm openers reply +50% with no guardrail regression. Ship warm as default for mid-market. Retain formal for regulated verticals until re-tested.",
    links: {
      projects: [{ id: "p_nw", label: "Northwind renewal" }],
      tasks: [{ id: "t1", label: "Draft 42 first-touch emails" }],
      workers: [
        { id: "w_atlas", name: "Atlas" },
        { id: "w_mailer", name: "Mailer" },
      ],
      predictions: [
        {
          id: "pr1",
          statement: "Q1 pipeline will beat plan by 8%",
          confidence: 0.63,
        },
      ],
      knowledge: [
        {
          id: "k1",
          title: "Reply-rate benchmarks Q2",
          source: "Notes",
        },
      ],
    },
  },
  {
    id: "x_model_swap",
    name: "GPT-5.5 vs. Claude Sonnet for redlines",
    kind: "model",
    status: "running",
    hypothesis:
      "Sonnet produces cleaner clause matches on MSAs but is 2× slower — worth it if the human edit rate drops below 20%.",
    owner: "w_lex",
    startedAt: "2026-07-01T00:00:00Z",
    variants: [
      {
        id: "v1",
        label: "A",
        name: "GPT-5.5",
        description: "Current model.",
        allocation: 0.5,
        samples: 61,
        conversions: 41,
        conversionRate: 0.672,
        isControl: true,
      },
      {
        id: "v2",
        label: "B",
        name: "Claude Sonnet",
        description: "Candidate model.",
        allocation: 0.5,
        samples: 58,
        conversions: 45,
        conversionRate: 0.776,
      },
    ],
    metrics: [
      {
        id: "m1",
        name: "Accepted-without-edit rate",
        kind: "primary",
        unit: "rate",
        baseline: 0.672,
        observed: 0.776,
      },
      {
        id: "m2",
        name: "Latency",
        kind: "guardrail",
        unit: "duration_ms",
        baseline: 4800,
        observed: 9200,
      },
      {
        id: "m3",
        name: "Cost / redline",
        kind: "guardrail",
        unit: "currency",
        baseline: 0.09,
        observed: 0.14,
      },
    ],
    primaryMetricId: "m1",
    lift: 0.155,
    confidence: 0.71,
    significance: 0.13,
    minSamplesPerVariant: 120,
    learningSummary:
      "Directionally positive but under-powered. Keep running until ≥120 samples/variant. Guardrails within tolerance; latency is the pacing risk.",
    links: {
      projects: [{ id: "p_nw", label: "Northwind renewal" }],
      tasks: [{ id: "t2", label: "Redline Northwind MSA v3" }],
      workers: [{ id: "w_lex", name: "Lex" }],
      predictions: [],
      knowledge: [
        {
          id: "k1",
          title: "MSA playbook v2",
          source: "Documents",
        },
      ],
    },
  },
  {
    id: "x_timing",
    name: "Tuesday 9am vs. Thursday 3pm send",
    kind: "timing",
    status: "shipped",
    hypothesis:
      "Thursday afternoon lifts opens for founders in EMEA.",
    owner: "w_atlas",
    startedAt: "2026-06-10T00:00:00Z",
    endedAt: "2026-06-24T00:00:00Z",
    variants: [
      {
        id: "v1",
        label: "A",
        name: "Tue 9am local",
        description: "Legacy default.",
        allocation: 0.5,
        samples: 1420,
        conversions: 380,
        conversionRate: 0.268,
        isControl: true,
      },
      {
        id: "v2",
        label: "B",
        name: "Thu 3pm local",
        description: "Candidate.",
        allocation: 0.5,
        samples: 1408,
        conversions: 468,
        conversionRate: 0.332,
        isWinner: true,
      },
    ],
    metrics: [
      {
        id: "m1",
        name: "Open rate",
        kind: "primary",
        unit: "rate",
        baseline: 0.268,
        observed: 0.332,
      },
    ],
    primaryMetricId: "m1",
    lift: 0.24,
    confidence: 0.99,
    significance: 0.001,
    minSamplesPerVariant: 800,
    learningSummary:
      "Thursday 3pm ships to all founder audiences. Retained Tuesday for engineering ICPs pending its own test.",
    links: {
      projects: [{ id: "p_q1", label: "Q1 outbound cohort" }],
      tasks: [],
      workers: [{ id: "w_atlas", name: "Atlas" }],
      predictions: [],
      knowledge: [],
    },
  },
  {
    id: "x_audience",
    name: "Ops vs. Finance persona for renewal brief",
    kind: "audience",
    status: "inconclusive",
    hypothesis:
      "Framing renewals to Finance lifts expansion attach vs. Ops.",
    owner: "w_juno",
    startedAt: "2026-06-15T00:00:00Z",
    endedAt: "2026-07-01T00:00:00Z",
    variants: [
      {
        id: "v1",
        label: "A",
        name: "Ops persona",
        description: "ROI on time saved.",
        allocation: 0.5,
        samples: 84,
        conversions: 14,
        conversionRate: 0.166,
        isControl: true,
      },
      {
        id: "v2",
        label: "B",
        name: "Finance persona",
        description: "COGS + payback framing.",
        allocation: 0.5,
        samples: 81,
        conversions: 15,
        conversionRate: 0.185,
      },
    ],
    metrics: [
      {
        id: "m1",
        name: "Expansion attach",
        kind: "primary",
        unit: "rate",
        baseline: 0.166,
        observed: 0.185,
      },
    ],
    primaryMetricId: "m1",
    lift: 0.114,
    confidence: 0.42,
    significance: 0.31,
    minSamplesPerVariant: 400,
    learningSummary:
      "Insufficient samples and low signal. Park; re-run after we hit 400/variant. No default change.",
    links: {
      projects: [{ id: "p_ac", label: "Acme expansion" }],
      tasks: [],
      workers: [{ id: "w_juno", name: "Juno" }],
      predictions: [
        {
          id: "pr2",
          statement: "Acme will expand seats by 22%",
          confidence: 0.71,
        },
      ],
      knowledge: [],
    },
  },
  {
    id: "x_sequence",
    name: "3-touch vs. 5-touch outbound sequence",
    kind: "sequence",
    status: "shipped",
    hypothesis:
      "A shorter sequence with a stronger opener converts more per prospect and burns less list.",
    owner: "w_atlas",
    startedAt: "2026-05-01T00:00:00Z",
    endedAt: "2026-05-28T00:00:00Z",
    variants: [
      {
        id: "v1",
        label: "A",
        name: "5-touch",
        description: "Legacy sequence.",
        allocation: 0.5,
        samples: 2010,
        conversions: 118,
        conversionRate: 0.0587,
        isControl: true,
      },
      {
        id: "v2",
        label: "B",
        name: "3-touch",
        description: "Trimmed sequence.",
        allocation: 0.5,
        samples: 2004,
        conversions: 154,
        conversionRate: 0.0768,
        isWinner: true,
      },
    ],
    metrics: [
      {
        id: "m1",
        name: "Meetings booked",
        kind: "primary",
        unit: "rate",
        baseline: 0.0587,
        observed: 0.0768,
      },
    ],
    primaryMetricId: "m1",
    lift: 0.309,
    confidence: 0.98,
    significance: 0.007,
    minSamplesPerVariant: 1500,
    learningSummary:
      "3-touch ships. Frees ~40% of Mailer capacity, reallocated to enrichment.",
    links: {
      projects: [{ id: "p_q1", label: "Q1 outbound cohort" }],
      tasks: [],
      workers: [
        { id: "w_atlas", name: "Atlas" },
        { id: "w_mailer", name: "Mailer" },
      ],
      predictions: [],
      knowledge: [],
    },
  },
  {
    id: "x_budget",
    name: "$40 vs. $80 daily Atlas spend cap",
    kind: "budget",
    status: "paused",
    hypothesis:
      "Doubling Atlas's daily enrichment budget compounds pipeline without hurting cost per meeting.",
    owner: "Maya Chen",
    startedAt: "2026-07-03T00:00:00Z",
    variants: [
      {
        id: "v1",
        label: "A",
        name: "$40/day",
        description: "Current cap.",
        allocation: 0.5,
        samples: 6,
        conversions: 2,
        conversionRate: 0.333,
        isControl: true,
      },
      {
        id: "v2",
        label: "B",
        name: "$80/day",
        description: "Doubled cap.",
        allocation: 0.5,
        samples: 3,
        conversions: 1,
        conversionRate: 0.333,
      },
    ],
    metrics: [
      {
        id: "m1",
        name: "Cost per meeting",
        kind: "primary",
        unit: "currency",
        baseline: 42,
        observed: 51,
      },
    ],
    primaryMetricId: "m1",
    lift: -0.214,
    confidence: 0.3,
    significance: 0.6,
    minSamplesPerVariant: 100,
    learningSummary:
      "Paused pending a spend-quality investigation — early signal suggests the extra budget bought weaker accounts.",
    links: {
      projects: [{ id: "p_q1", label: "Q1 outbound cohort" }],
      tasks: [],
      workers: [{ id: "w_atlas", name: "Atlas" }],
      predictions: [],
      knowledge: [],
    },
  },
];

// ---------- Helpers ----------

export function getExperiment(id: string): Experiment | undefined {
  return EXPERIMENTS.find((x) => x.id === id);
}

export function formatMetric(m: { unit: Metric["unit"]; observed: number }): string {
  switch (m.unit) {
    case "rate":
      return `${(m.observed * 100).toFixed(1)}%`;
    case "count":
      return m.observed.toLocaleString();
    case "currency":
      return `$${m.observed.toFixed(2)}`;
    case "duration_ms":
      return m.observed >= 1000
        ? `${(m.observed / 1000).toFixed(1)}s`
        : `${m.observed}ms`;
  }
}

export function formatValue(unit: Metric["unit"], v: number): string {
  return formatMetric({ unit, observed: v });
}

export function signedPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "" : "±";
  return `${sign}${(n * 100).toFixed(1)}%`;
}
