// ---------------------------------------------------------------------------
// Query optimisation & quality layer.
//
// Turns raw recruiter input into high-relevance Boolean searches the way an
// expert sourcer would. Pure, deterministic functions (no LLM, no network) so
// results are predictable and testable:
//   * classify every term by confidence (high / medium / low)
//   * drop or flag low-signal / generic terms that create noise
//   * expand vague terms ("AI") into specific phrases
//   * build three search modes (precision / balanced / broad)
//   * run quality checks (too many ORs, only-generic, conflicting domains)
// ---------------------------------------------------------------------------

import {
  dedupe,
  formatGroup,
  normalizeTerm,
  resolveLogic,
} from "./query-builder";
import type {
  Confidence,
  LinkedInSearchConfig,
  QueryValidation,
  SearchMode,
} from "./types";

// Broad, single-word terms that match far too many people on their own.
const GENERIC_TERMS = new Set([
  "ai", "ml", "tech", "technology", "software", "developer", "dev",
  "engineer", "engineering", "cloud", "data", "it", "programming", "coding",
  "computer", "web", "app", "apps", "marketing", "sales", "design", "designer",
  "product", "manager", "analyst", "consultant", "specialist", "expert",
  "google", "meta", "facebook", "apple", "amazon", "microsoft", "startup",
  "digital", "innovation", "solutions", "systems",
]);

// Specific, high-value terms that should always count as strong signal even
// though they are a single token.
const HIGH_SIGNAL = new Set([
  "langchain", "langgraph", "llamaindex", "pytorch", "tensorflow", "keras",
  "llm", "llms", "rag", "huggingface", "kubernetes", "terraform", "kafka",
  "mlops", "nlp", "transformers", "graphql", "nestjs", "snowflake", "airflow",
  "databricks", "pyspark", "spark", "fastapi", "django", "postgresql",
]);

// Vague term -> specific expansions used by the optimiser and the UI hints.
export const EXPANSION_MAP: Record<string, string[]> = {
  ai: [
    "Artificial Intelligence",
    "Machine Learning",
    "Generative AI",
    "Large Language Models",
    "LLM",
  ],
  ml: ["Machine Learning", "Deep Learning", "MLOps"],
  genai: ["Generative AI", "Large Language Models", "LLM"],
  llm: ["Large Language Models", "LLM", "Generative AI"],
  nlp: ["Natural Language Processing", "Transformers", "LLM"],
  cloud: ["AWS", "GCP", "Azure"],
  data: ["Data Engineering", "Data Science", "Big Data"],
  devops: ["CI/CD", "Kubernetes", "Terraform"],
  developer: ["Software Engineer", "Software Developer"],
  engineer: ["Software Engineer"],
  frontend: ["React", "Next.js", "TypeScript"],
  backend: ["Node.js", "Python", "Go"],
  marketing: ["Growth Marketing", "Performance Marketing"],
};

const SCORE: Record<Confidence, number> = { high: 1, medium: 0.6, low: 0.2 };

export interface TermClassification {
  term: string;
  confidence: Confidence;
  score: number;
  isLowSignal: boolean;
  suggestions: string[];
}

/** Classify a single term by how specific / high-signal it is. */
export function classifyTerm(term: string): TermClassification {
  const key = normalizeTerm(term);
  let confidence: Confidence;
  if (HIGH_SIGNAL.has(key) || key.includes(" ")) {
    confidence = "high"; // multi-word phrases are specific
  } else if (GENERIC_TERMS.has(key)) {
    confidence = "low";
  } else {
    confidence = "medium";
  }
  return {
    term,
    confidence,
    score: SCORE[confidence],
    isLowSignal: confidence === "low",
    suggestions: EXPANSION_MAP[key] ?? [],
  };
}

function isNonTechnicalRole(term: string): boolean {
  const k = normalizeTerm(term);
  return /(marketing|sales|recruit|designer|design|finance|account|hr|human resources|customer|support|operations manager|content)/.test(
    k
  );
}
function isTechnicalRole(term: string): boolean {
  const k = normalizeTerm(term);
  return /(engineer|developer|scientist|data|software|ml|ai|devops|sre|architect|programmer|backend|frontend|full stack|fullstack)/.test(
    k
  );
}

interface CollectedTerms {
  titles: string[];
  skills: string[];
  keywords: string[];
  excluded: string[];
}

/** Gather the keyword-searchable terms, optionally dropping low-signal ones. */
function collectTerms(
  config: LinkedInSearchConfig,
  includeLowSignal: boolean
): CollectedTerms {
  const keep = (t: string) => includeLowSignal || !classifyTerm(t).isLowSignal;
  return {
    titles: dedupe([
      ...config.currentJobTitles,
      ...config.previousJobTitles,
    ]).filter(keep),
    skills: dedupe(config.skills).filter(keep),
    keywords: dedupe(config.keywords).filter(keep),
    excluded: dedupe([
      ...config.excludedKeywords,
      ...config.excludedJobTitles,
      ...config.excludedCompanies,
      ...config.excludedLocations,
    ]),
  };
}

/** Build the Boolean keyword query for a given search mode. */
export function buildModeQuery(
  config: LinkedInSearchConfig,
  mode: SearchMode,
  includeLowSignal = false
): string {
  const logic = resolveLogic(config);
  const keep = (t: string) => includeLowSignal || !classifyTerm(t).isLowSignal;

  const currentTitles = dedupe(config.currentJobTitles).filter(keep);
  const previousTitles = dedupe(config.previousJobTitles).filter(keep);
  const skills = dedupe(config.skills).filter(keep);
  const keywords = dedupe(config.keywords).filter(keep);
  const universities = dedupe(config.universities).filter(keep);
  const excluded = dedupe([
    ...config.excludedKeywords,
    ...config.excludedJobTitles,
    ...config.excludedCompanies,
    ...config.excludedLocations,
  ]);
  const not = excluded.length ? ` NOT ${formatGroup(excluded, "any")}` : "";

  const titleParts = [
    formatGroup(currentTitles, logic.jobTitles),
    formatGroup(previousTitles, logic.previousJobTitles),
  ].filter(Boolean);
  const titleBlock = titleParts.join(" AND ");
  const universityBlock = formatGroup(universities, logic.universities);

  let positive = "";
  if (mode === "broad") {
    positive = formatGroup(
      dedupe([...currentTitles, ...previousTitles, ...skills, ...keywords, ...universities]),
      "any"
    );
  } else if (mode === "balanced") {
    positive = [titleBlock, formatGroup(skills, logic.skills), universityBlock]
      .filter(Boolean)
      .join(" AND ");
  } else {
    positive = [
      titleBlock,
      formatGroup(skills, logic.skills),
      formatGroup(keywords, logic.keywords),
      universityBlock,
    ]
      .filter(Boolean)
      .join(" AND ");
  }

  if (positive && not) return `${positive}${not}`;
  return positive || not.trim();
}

/**
 * Boolean query for the dedicated "Job title" filter (Sales Navigator /
 * Recruiter). Titles only — no skills or keywords.
 */
export function buildTitleQuery(
  config: LinkedInSearchConfig,
  includeLowSignal = false
): string {
  const logic = resolveLogic(config);
  const keep = (t: string) => includeLowSignal || !classifyTerm(t).isLowSignal;
  return [
    formatGroup(dedupe(config.currentJobTitles).filter(keep), logic.jobTitles),
    formatGroup(dedupe(config.previousJobTitles).filter(keep), logic.previousJobTitles),
  ]
    .filter(Boolean)
    .join(" AND ");
}

/**
 * Boolean query for the "Keywords" box only: skills + keywords (+ NOT
 * exclusions), never job titles. Mirrors how the main query treats skills and
 * keywords per mode so the split stays consistent.
 */
export function buildKeywordQuery(
  config: LinkedInSearchConfig,
  mode: SearchMode,
  includeLowSignal = false
): string {
  const { skills, keywords, excluded } = collectTerms(config, includeLowSignal);
  const not = excluded.length ? ` NOT ${formatGroup(excluded, "any")}` : "";

  let positive = "";
  if (mode === "broad") {
    positive = formatGroup(dedupe([...skills, ...keywords]), "any");
  } else if (mode === "balanced") {
    positive = formatGroup(skills, config.logic.skills);
  } else {
    positive = [
      formatGroup(skills, config.logic.skills),
      formatGroup(keywords, config.logic.keywords),
    ]
      .filter(Boolean)
      .join(" AND ");
  }

  if (positive && not) return `${positive}${not}`;
  return positive || not.trim();
}

/** Terms the recruiter typed that are too generic to search on their own. */
export function getLowSignalTerms(
  config: LinkedInSearchConfig
): TermClassification[] {
  const all = dedupe([
    ...config.currentJobTitles,
    ...config.previousJobTitles,
    ...config.skills,
    ...config.keywords,
  ]);
  return all.map(classifyTerm).filter((c) => c.isLowSignal);
}

function expandList(list: string[]): string[] {
  const out: string[] = [];
  for (const t of list) {
    const c = classifyTerm(t);
    if (c.isLowSignal) {
      // Replace a vague term with its specific expansions; drop it if we have
      // no better phrasing (rather than search on noise).
      if (c.suggestions.length) out.push(...c.suggestions);
    } else {
      out.push(t);
    }
  }
  return dedupe(out);
}

/**
 * Produce an optimised config: vague terms expanded into specific phrases,
 * generic noise removed. Structured filters are left untouched.
 */
export function optimizeConfig(
  config: LinkedInSearchConfig
): LinkedInSearchConfig {
  return {
    ...config,
    currentJobTitles: expandList(config.currentJobTitles),
    previousJobTitles: expandList(config.previousJobTitles),
    skills: expandList(config.skills),
    keywords: expandList(config.keywords),
  };
}

/** The optimiser's recommended (precision) query. */
export function buildOptimizedQuery(config: LinkedInSearchConfig): string {
  return buildModeQuery(optimizeConfig(config), "precision", true);
}

/** Quality checks specific to relevance (added on top of base validation). */
export function analyzeQuality(
  config: LinkedInSearchConfig,
  mode: SearchMode,
  includeLowSignal: boolean
): Pick<QueryValidation, "warnings" | "suggestions"> {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const { titles, skills, keywords } = collectTerms(config, includeLowSignal);
  const included = [...titles, ...skills, ...keywords];

  const query = buildModeQuery(config, mode, includeLowSignal);
  const orCount = (query.match(/\bOR\b/g) ?? []).length;
  if (orCount > 20) {
    warnings.push(
      "Your search contains too many broad keywords. This may reduce candidate relevance — consider narrowing to your most important terms."
    );
  }

  if (included.length > 0) {
    const anyHigh = included.some(
      (t) => classifyTerm(t).confidence === "high"
    );
    if (!anyHigh) {
      suggestions.push(
        'Add specific role titles or named technologies (e.g. "Machine Learning Engineer", "PyTorch") to improve relevance.'
      );
    }
  }

  if (titles.length > 1) {
    const hasTech = titles.some(isTechnicalRole);
    const hasNonTech = titles.some(isNonTechnicalRole);
    if (hasTech && hasNonTech) {
      warnings.push(
        "You've combined very different role types (e.g. engineering and marketing). Requiring all of them may significantly reduce results."
      );
    }
  }

  // Entry-level seniority + senior-sounding titles is a near-guaranteed zero.
  const entryLevel = config.seniority.some((s) =>
    /entry|intern|junior|associate|graduate|trainee|fresher/i.test(s)
  );
  const seniorTitle = [...config.currentJobTitles, ...config.previousJobTitles].some(
    (t) =>
      /senior|\bsr\.?\b|lead|principal|staff|head\b|director|\bvp\b|vice president|chief|\bc[teofpi]o\b|architect|manager/i.test(
        t
      )
  );
  if (entryLevel && seniorTitle) {
    warnings.push(
      "You've combined an entry-level / junior seniority filter with senior-sounding job titles. LinkedIn almost never tags senior titles as entry-level, so this combination usually returns zero results — remove the entry-level filter or the senior titles."
    );
  }

  return { warnings, suggestions };
}

export const MODE_OPTIONS: {
  value: SearchMode;
  label: string;
  hint: string;
}[] = [
  {
    value: "precision",
    label: "Precision",
    hint: "Role AND skills AND keywords — most relevant, smaller pool.",
  },
  {
    value: "balanced",
    label: "Balanced",
    hint: "Role AND skills — wider, still relevant.",
  },
  {
    value: "broad",
    label: "Broad",
    hint: "Role OR skills OR keywords — maximum sourcing.",
  },
];
