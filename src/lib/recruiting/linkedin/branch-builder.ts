import { dedupe } from "./query-builder";
import { buildSearch } from "./link-builder";
import type {
  BuiltSearchBranch,
  GenerateBranchesRequest,
  SearchBranch,
  SearchBranchPlan,
} from "./branch-types";
import type { LinkedInSearchConfig, SearchMode } from "./types";

/** Branch URLs must stay simple or LinkedIn returns zero results. */
const MAX_BRANCH_SKILLS = 0;
const BRANCH_SEARCH_MODE: SearchMode = "broad";

/**
 * Simplified config for branch links — title OR only in the keyword box.
 * Skills, colleges, years, achievements stay out of the URL (apply manually).
 */
export function buildBranchSearchConfig(
  base: LinkedInSearchConfig,
  branch: Pick<SearchBranch, "title" | "relatedTitles" | "skills" | "keywords">
): LinkedInSearchConfig {
  const titles = [branch.title];
  if (branch.relatedTitles[0]) {
    titles.push(branch.relatedTitles[0]);
  }

  return {
    ...base,
    currentJobTitles: titles,
    previousJobTitles: [],
    keywords: [],
    achievements: [],
    skills: [],
    universities: [],
    minYears: undefined,
    maxYears: undefined,
    logic: {
      ...base.logic,
      jobTitles: "any",
      skills: "any",
      keywords: "any",
      achievements: "any",
      universities: "any",
    },
  };
}

/** @deprecated Use buildBranchSearchConfig — kept for loading a branch into the full builder. */
export function buildBranchConfig(
  base: LinkedInSearchConfig,
  branch: Pick<SearchBranch, "title" | "relatedTitles" | "skills" | "keywords">
): LinkedInSearchConfig {
  return buildBranchSearchConfig(base, branch);
}

export function buildBranchSearches(
  req: Pick<GenerateBranchesRequest, "config" | "mode" | "target" | "includeLowSignal">,
  plan: SearchBranchPlan
): BuiltSearchBranch[] {
  const { config, target } = req;
  const buildOpts = {
    mode: BRANCH_SEARCH_MODE,
    includeLowSignal: false,
    skipSanitize: true,
    branchLink: true,
    manualConfig: config,
  } as const;

  return plan.branches
    .filter((b) => b.enabled)
    .map((branch) => {
      const branchConfig = buildBranchSearchConfig(config, branch);
      const people = buildSearch(branchConfig, "people", buildOpts);
      const sales = buildSearch(branchConfig, "sales", buildOpts);
      const recruiter = buildSearch(branchConfig, "recruiter", buildOpts);
      const primary =
        target === "sales" ? sales : target === "recruiter" ? recruiter : people;

      return {
        ...branch,
        config: branchConfig,
        built: primary,
        urls: {
          people: people.url,
          sales: sales.url,
          recruiter: recruiter.url,
        },
        queries: {
          people: people.query,
          sales: sales.query,
          recruiter: recruiter.query,
        },
      };
    });
}

export function newBranchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `br_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** True when plan was generated without DeepSeek (stale localStorage). */
export function isHeuristicPlanSummary(summary: string): boolean {
  const s = summary.toLowerCase();
  return (
    s.includes("heuristic branches") ||
    s.includes("template branches") ||
    s.includes("add deepseek_api_key")
  );
}

/** User-facing summary — never expose raw validation dumps. */
export function sanitizeBranchSummary(summary: string): string {
  const trimmed = summary.trim();
  const fallbackIdx = trimmed.indexOf("(AI fallback:");
  if (fallbackIdx >= 0) {
    return trimmed.slice(0, fallbackIdx).trim();
  }
  if (trimmed.startsWith("[{") || trimmed.includes('"code":"invalid_type"')) {
    return "Generated search branches from your base role.";
  }
  return trimmed;
}

export function normalizeBranchPlan(
  raw: Partial<SearchBranchPlan> & { branches?: Array<Partial<SearchBranch>> },
  fallbackRole: string
): SearchBranchPlan {
  const branches: SearchBranch[] = (raw.branches ?? [])
    .map((b) => {
      const title = String(b.title ?? b.label ?? "").trim();
      if (!title) return null;
      return {
        id: b.id ?? newBranchId(),
        label: String(b.label ?? title).trim(),
        title,
        relatedTitles: dedupe((b.relatedTitles ?? []).map(String).filter(Boolean)),
        skills: dedupe((b.skills ?? []).map(String).filter(Boolean)),
        keywords: dedupe((b.keywords ?? []).map(String).filter(Boolean)),
        rationale: String(b.rationale ?? "Similar role variant for broader coverage.").trim(),
        category: normalizeCategory(b.category),
        enabled: b.enabled ?? true,
      };
    })
    .filter((b): b is SearchBranch => b !== null);

  return {
    summary: String(raw.summary ?? `Generated ${branches.length} search branches for ${fallbackRole}.`).trim(),
    baseRole: String(raw.baseRole ?? fallbackRole).trim(),
    branches,
  };
}

function normalizeCategory(value: unknown): SearchBranch["category"] {
  const key = String(value ?? "adjacent").toLowerCase();
  if (key === "core" || key === "senior" || key === "junior" || key === "specialist") {
    return key;
  }
  return "adjacent";
}

/** Deterministic fallback when DeepSeek is unavailable. */
export function buildHeuristicBranchPlan(
  config: LinkedInSearchConfig,
  count = 15,
  options?: { reason?: "no-key" | "ai-failed" }
): SearchBranchPlan {
  const seed =
    config.currentJobTitles[0] ??
    config.previousJobTitles[0] ??
    config.skills[0] ??
    config.keywords[0] ??
    "Software Engineer";

  const key = seed.toLowerCase();
  const pool = dedupe([
    ...expandRoleFamily(seed),
    ...expandFromSkills(config.skills),
    ...expandFromSkills(config.keywords),
    ...seniorityVariants(seed),
  ]).filter((t) => normalizeTerm(t) !== normalizeTerm(seed));

  const branches: SearchBranch[] = pool.slice(0, Math.min(20, Math.max(5, count))).map((title) => ({
    id: newBranchId(),
    label: title,
    title,
    relatedTitles: [],
    skills: [],
    keywords: [],
    rationale: `Adjacent title to “${seed}” for wider coverage.`,
    category: categorizeTitle(title, seed),
    enabled: true,
  }));

  const summary =
    options?.reason === "no-key"
      ? `Template branches around “${seed}” — add DEEPSEEK_API_KEY to alysonCRM+/.env and restart the dev server for AI-generated variants.`
      : options?.reason === "ai-failed"
        ? `${branches.length} fallback branches around “${seed}” — AI was unavailable; click Regenerate to retry.`
        : `${branches.length} search branches around “${seed}” for broader LinkedIn coverage.`;

  return {
    summary,
    baseRole: seed,
    branches,
  };
}

function normalizeTerm(v: string): string {
  return v.trim().toLowerCase();
}

function categorizeTitle(title: string, seed: string): SearchBranch["category"] {
  const t = title.toLowerCase();
  if (normalizeTerm(title) === normalizeTerm(seed)) return "core";
  if (/\b(senior|staff|lead|principal|director|head)\b/.test(t)) return "senior";
  if (/\b(junior|associate|entry|graduate|intern)\b/.test(t)) return "junior";
  if (/\b(llm|nlp|mlops|computer vision|cv engineer|platform)\b/.test(t)) return "specialist";
  return "adjacent";
}

function seniorityVariants(seed: string): string[] {
  const base = seed.replace(/\b(senior|sr\.?|staff|lead|principal|junior|associate)\b/gi, "").trim();
  if (!base) return [];
  return [
    `Senior ${base}`,
    `Staff ${base}`,
    `Lead ${base}`,
    `Principal ${base}`,
    `Junior ${base}`,
    `Associate ${base}`,
  ];
}

const ROLE_FAMILIES: Record<string, string[]> = {
  "data scientist": [
    "Machine Learning Engineer",
    "ML Engineer",
    "Applied Scientist",
    "AI Engineer",
    "Research Scientist",
    "Analytics Engineer",
    "Decision Scientist",
    "Quantitative Analyst",
    "MLOps Engineer",
    "Deep Learning Engineer",
    "LLM Engineer",
    "NLP Engineer",
    "AI Research Engineer",
    "Statistical Modeling Engineer",
  ],
  "machine learning engineer": [
    "Data Scientist",
    "ML Engineer",
    "AI Engineer",
    "MLOps Engineer",
    "Deep Learning Engineer",
    "LLM Engineer",
    "Applied Scientist",
    "Research Engineer",
    "NLP Engineer",
    "Computer Vision Engineer",
  ],
  "software engineer": [
    "Backend Engineer",
    "Full Stack Engineer",
    "Platform Engineer",
    "Systems Engineer",
    "Application Engineer",
    "Software Developer",
    "Site Reliability Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "API Engineer",
  ],
  "ai engineer": [
    "Machine Learning Engineer",
    "LLM Engineer",
    "Generative AI Engineer",
    "NLP Engineer",
    "AI Research Engineer",
    "Applied AI Engineer",
    "MLOps Engineer",
    "Data Scientist",
    "Deep Learning Engineer",
  ],
};

function expandRoleFamily(seed: string): string[] {
  const key = seed.toLowerCase();
  for (const [pattern, titles] of Object.entries(ROLE_FAMILIES)) {
    if (key.includes(pattern) || pattern.includes(key)) return [...titles];
  }
  if (/engineer|developer|scientist|analyst|architect/.test(key)) {
    return [
      ...ROLE_FAMILIES["software engineer"],
      ...ROLE_FAMILIES["data scientist"].slice(0, 8),
    ];
  }
  return [
    `${seed} II`,
    `${seed} III`,
    `Senior ${seed}`,
    `Lead ${seed}`,
  ];
}

function expandFromSkills(skills: string[]): string[] {
  const out: string[] = [];
  const joined = skills.join(" ").toLowerCase();
  if (/llm|langchain|gpt|generative/.test(joined)) {
    out.push("LLM Engineer", "Generative AI Engineer", "NLP Engineer", "AI Engineer");
  }
  if (/pytorch|tensorflow|keras|deep learning/.test(joined)) {
    out.push("Deep Learning Engineer", "ML Engineer", "Computer Vision Engineer");
  }
  if (/spark|airflow|etl|warehouse|snowflake|databricks/.test(joined)) {
    out.push("Data Engineer", "Analytics Engineer", "ML Platform Engineer");
  }
  if (/react|next\.?js|typescript|frontend/.test(joined)) {
    out.push("Frontend Engineer", "Full Stack Engineer", "UI Engineer");
  }
  if (/node|python|go|java|backend/.test(joined)) {
    out.push("Backend Engineer", "Platform Engineer", "API Engineer");
  }
  return out;
}
