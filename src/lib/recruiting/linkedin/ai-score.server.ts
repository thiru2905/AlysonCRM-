// ---------------------------------------------------------------------------
// DeepSeek-powered LinkedIn search relevance analysis (server-only).
// ---------------------------------------------------------------------------

import { z } from "zod";
import { analyzeQuality } from "./optimizer";
import { buildBooleanQuery } from "./query-builder";
import type {
  LinkedInAIScoreRequest,
  LinkedInAIScoreResult,
  TermGroup,
} from "./ai-score";
import type { LinkedInSearchConfig, MatchLogic, SearchMode } from "./types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const TERM_GROUPS = new Set<TermGroup>([
  "currentJobTitles",
  "previousJobTitles",
  "skills",
  "keywords",
  "universities",
]);

const GROUP_ALIASES: Record<string, TermGroup> = {
  currentjobtitles: "currentJobTitles",
  current_job_titles: "currentJobTitles",
  "current job titles": "currentJobTitles",
  "current job title": "currentJobTitles",
  jobtitles: "currentJobTitles",
  jobtitle: "currentJobTitles",
  "job titles": "currentJobTitles",
  "job title": "currentJobTitles",
  titles: "currentJobTitles",
  previousjobtitles: "previousJobTitles",
  previous_job_titles: "previousJobTitles",
  "previous job titles": "previousJobTitles",
  "previous job title": "previousJobTitles",
  skills: "skills",
  skill: "skills",
  keywords: "keywords",
  keyword: "keywords",
  universities: "universities",
  university: "universities",
  colleges: "universities",
  college: "universities",
  schools: "universities",
  school: "universities",
};

const LOGIC_FIELDS = new Set<keyof LinkedInSearchConfig["logic"]>([
  "keywords",
  "skills",
  "jobTitles",
  "previousJobTitles",
  "universities",
]);

const LOGIC_ALIASES: Record<string, keyof LinkedInSearchConfig["logic"]> = {
  keywords: "keywords",
  keyword: "keywords",
  skills: "skills",
  skill: "skills",
  jobtitles: "jobTitles",
  jobtitle: "jobTitles",
  "job titles": "jobTitles",
  "current job titles": "jobTitles",
  currentjobtitles: "jobTitles",
  previousjobtitles: "previousJobTitles",
  "previous job titles": "previousJobTitles",
  universities: "universities",
  university: "universities",
  colleges: "universities",
  college: "universities",
};

const resultSchema = z.object({
  score: z.number().min(0).max(100),
  poolEstimate: z.enum(["too_narrow", "balanced", "too_broad"]),
  recommendedMode: z.enum(["precision", "balanced", "broad"]),
  summary: z.string().min(1).max(800),
  strengths: z.array(z.string()).max(8),
  issues: z.array(z.string()).max(10),
  termActions: z.array(
    z.object({
      term: z.string().min(1),
      group: z.enum([
        "currentJobTitles",
        "previousJobTitles",
        "skills",
        "keywords",
        "universities",
      ]),
      action: z.enum(["keep", "remove", "replace"]),
      reason: z.string().min(1).max(400),
      replacement: z.string().optional(),
    })
  ),
  suggestedAdditions: z.array(
    z.object({
      group: z.enum([
        "currentJobTitles",
        "previousJobTitles",
        "skills",
        "keywords",
        "universities",
      ]),
      terms: z.array(z.string().min(1)).max(8),
      reason: z.string().min(1).max(400),
    })
  ),
  logicTips: z.array(
    z.object({
      field: z.enum([
        "keywords",
        "skills",
        "jobTitles",
        "previousJobTitles",
        "universities",
      ]),
      recommended: z.enum(["any", "all"]),
      reason: z.string().min(1).max(400),
    })
  ),
});

const SYSTEM_PROMPT = `You are an expert technical recruiter and LinkedIn Boolean sourcer.

Analyze the recruiter's LinkedIn search configuration and help them maximize RELEVANCE — finding people who actually match the role — while keeping a usable candidate pool.

Rules:
- OR within a group widens the pool but adds noise; flag generic OR terms (e.g. "engineer", "AI", "developer") that should be removed or replaced with specific titles/skills.
- AND between groups tightens the pool; flag combinations that likely return zero results.
- termActions: use action "remove" or "replace" for bad terms; use "keep" for the strongest 3-8 terms total across all groups.
- For group use ONLY these exact strings: currentJobTitles, previousJobTitles, skills, keywords, universities
- For logicTips.field use ONLY: keywords, skills, jobTitles, previousJobTitles, universities
- recommendedMode must be exactly: precision, balanced, or broad
- poolEstimate must be exactly: too_narrow, balanced, or too_broad

Return ONLY a JSON object with this exact shape:
{
  "score": 0,
  "poolEstimate": "balanced",
  "recommendedMode": "precision",
  "summary": "string",
  "strengths": ["string"],
  "issues": ["string"],
  "termActions": [{"term":"string","group":"currentJobTitles","action":"remove","reason":"string","replacement":"optional"}],
  "suggestedAdditions": [{"group":"skills","terms":["string"],"reason":"string"}],
  "logicTips": [{"field":"skills","recommended":"any","reason":"string"}]
}`;

function normKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter(Boolean);
}

function coerceScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
  const n = Number(asString(value));
  if (Number.isFinite(n)) return Math.min(100, Math.max(0, Math.round(n)));
  return 50;
}

function normalizeGroup(value: unknown): TermGroup | null {
  const raw = asString(value);
  if (!raw) return null;
  if (TERM_GROUPS.has(raw as TermGroup)) return raw as TermGroup;
  const alias = GROUP_ALIASES[normKey(raw).replace(/\s/g, "")] ?? GROUP_ALIASES[normKey(raw)];
  return alias ?? null;
}

function normalizeLogicField(
  value: unknown
): keyof LinkedInSearchConfig["logic"] | null {
  const raw = asString(value);
  if (!raw) return null;
  if (LOGIC_FIELDS.has(raw as keyof LinkedInSearchConfig["logic"])) {
    return raw as keyof LinkedInSearchConfig["logic"];
  }
  return LOGIC_ALIASES[normKey(raw).replace(/\s/g, "")] ?? LOGIC_ALIASES[normKey(raw)] ?? null;
}

function normalizePoolEstimate(value: unknown): LinkedInAIScoreResult["poolEstimate"] {
  const key = normKey(asString(value)).replace(/\s+/g, "_");
  if (key === "too_narrow" || key === "narrow" || key === "small") return "too_narrow";
  if (key === "too_broad" || key === "broad" || key === "noisy" || key === "large") {
    return "too_broad";
  }
  return "balanced";
}

function normalizeMode(value: unknown): SearchMode {
  const key = normKey(asString(value));
  if (key === "broad") return "broad";
  if (key === "balanced") return "balanced";
  return "precision";
}

function normalizeMatchLogic(value: unknown): MatchLogic {
  const key = normKey(asString(value));
  if (key === "all" || key === "and" || key === "match all") return "all";
  return "any";
}

function normalizeAction(value: unknown): "keep" | "remove" | "replace" {
  const key = normKey(asString(value));
  if (key === "remove" || key === "drop" || key === "delete") return "remove";
  if (key === "replace" || key === "swap") return "replace";
  return "keep";
}

function normalizeParsedResult(raw: unknown): LinkedInAIScoreResult {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const termActionsRaw = Array.isArray(obj.termActions) ? obj.termActions : [];
  const termActions = termActionsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const group = normalizeGroup(row.group);
      const term = asString(row.term);
      if (!group || !term) return null;
      return {
        term,
        group,
        action: normalizeAction(row.action),
        reason: asString(row.reason) || "Flagged by AI for relevance.",
        replacement: asString(row.replacement) || undefined,
      };
    })
    .filter(Boolean) as LinkedInAIScoreResult["termActions"];

  const additionsRaw = Array.isArray(obj.suggestedAdditions)
    ? obj.suggestedAdditions
    : [];
  const suggestedAdditions = additionsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const group = normalizeGroup(row.group);
      const terms = asStringArray(row.terms);
      if (!group || terms.length === 0) return null;
      return {
        group,
        terms,
        reason: asString(row.reason) || "Suggested by AI.",
      };
    })
    .filter(Boolean) as LinkedInAIScoreResult["suggestedAdditions"];

  const tipsRaw = Array.isArray(obj.logicTips) ? obj.logicTips : [];
  const logicTips = tipsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const field = normalizeLogicField(row.field);
      if (!field) return null;
      return {
        field,
        recommended: normalizeMatchLogic(row.recommended),
        reason: asString(row.reason) || "Suggested by AI.",
      };
    })
    .filter(Boolean) as LinkedInAIScoreResult["logicTips"];

  const normalized: LinkedInAIScoreResult = {
    score: coerceScore(obj.score),
    poolEstimate: normalizePoolEstimate(obj.poolEstimate),
    recommendedMode: normalizeMode(obj.recommendedMode),
    summary:
      asString(obj.summary) ||
      "AI reviewed your search and suggested filter adjustments.",
    strengths: asStringArray(obj.strengths).slice(0, 8),
    issues: asStringArray(obj.issues).slice(0, 10),
    termActions,
    suggestedAdditions,
    logicTips,
  };

  const validated = resultSchema.safeParse(normalized);
  if (!validated.success) {
    throw new Error(
      `AI response could not be normalized: ${validated.error.issues[0]?.message ?? "invalid shape"}`
    );
  }

  return validated.data;
}

function buildUserPrompt(req: LinkedInAIScoreRequest): string {
  const { config, mode, query, includeLowSignal } = req;
  const quality = analyzeQuality(config, mode, includeLowSignal);
  const fullQuery = query || buildBooleanQuery(config);

  return JSON.stringify(
    {
      searchMode: mode,
      includeLowSignal,
      booleanQuery: fullQuery,
      logic: config.logic,
      filters: {
        currentJobTitles: config.currentJobTitles,
        previousJobTitles: config.previousJobTitles,
        skills: config.skills,
        keywords: config.keywords,
        universities: config.universities,
        currentCompanies: config.currentCompanies,
        previousCompanies: config.previousCompanies,
        locations: config.locations,
        seniority: config.seniority,
        industries: config.industries,
        excludedKeywords: config.excludedKeywords,
        excludedJobTitles: config.excludedJobTitles,
        minYears: config.minYears,
        maxYears: config.maxYears,
        openToWork: config.openToWork,
      },
      deterministicWarnings: quality.warnings,
      deterministicSuggestions: quality.suggestions,
    },
    null,
    2
  );
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

export async function scoreLinkedInSearch(
  req: LinkedInAIScoreRequest
): Promise<LinkedInAIScoreResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Add it to your .env file to use AI scoring."
    );
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2200,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `DeepSeek request failed (${res.status})${body ? `: ${body.slice(0, 200)}` : ""}`
    );
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch {
    throw new Error("DeepSeek returned invalid JSON. Try analyzing again.");
  }

  try {
    return normalizeParsedResult(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid AI response";
    throw new Error(message);
  }
}
