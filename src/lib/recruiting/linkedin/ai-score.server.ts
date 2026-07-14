// ---------------------------------------------------------------------------
// DeepSeek-powered LinkedIn search relevance analysis (server-only).
// ---------------------------------------------------------------------------

import { z } from "zod";
import { analyzeQuality } from "./optimizer";
import { buildBooleanQuery } from "./query-builder";
import type { LinkedInAIScoreRequest, LinkedInAIScoreResult } from "./ai-score";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const termGroupSchema = z.enum([
  "currentJobTitles",
  "previousJobTitles",
  "skills",
  "keywords",
  "universities",
]);

const resultSchema = z.object({
  score: z.number().min(0).max(100),
  poolEstimate: z.enum(["too_narrow", "balanced", "too_broad"]),
  recommendedMode: z.enum(["precision", "balanced", "broad"]),
  summary: z.string().min(1).max(600),
  strengths: z.array(z.string()).max(8),
  issues: z.array(z.string()).max(10),
  termActions: z
    .array(
      z.object({
        term: z.string().min(1),
        group: termGroupSchema,
        action: z.enum(["keep", "remove", "replace"]),
        reason: z.string().min(1).max(240),
        replacement: z.string().optional(),
      })
    )
    .max(24),
  suggestedAdditions: z
    .array(
      z.object({
        group: termGroupSchema,
        terms: z.array(z.string().min(1)).min(1).max(8),
        reason: z.string().min(1).max(240),
      })
    )
    .max(6),
  logicTips: z
    .array(
      z.object({
        field: z.enum([
          "keywords",
          "skills",
          "jobTitles",
          "previousJobTitles",
          "universities",
        ]),
        recommended: z.enum(["any", "all"]),
        reason: z.string().min(1).max(240),
      })
    )
    .max(5),
});

const SYSTEM_PROMPT = `You are an expert technical recruiter and LinkedIn Boolean sourcer.

Analyze the recruiter's LinkedIn search configuration and help them maximize RELEVANCE — finding people who actually match the role — while keeping a usable candidate pool.

Rules:
- OR within a group widens the pool but adds noise; flag generic OR terms (e.g. "engineer", "AI", "developer") that should be removed or replaced with specific titles/skills.
- AND between groups tightens the pool; flag combinations that likely return zero results (e.g. entry-level seniority + senior titles, conflicting role types).
- Prefer specific multi-word phrases over single generic tokens.
- recommendedMode: "precision" when filters are specific enough; "balanced" when titles are clear but skills are sparse; "broad" only when the search is too narrow and missing critical OR breadth.
- termActions: only include "remove" or "replace" for terms that hurt relevance or are too generic; include "keep" only for the top 3-5 highest-signal terms. Do not list every term as keep.
- suggestedAdditions: propose 1-4 missing high-signal terms per group max, only when they materially improve match quality.
- logicTips: suggest switching OR/AND only when it clearly improves outcomes.
- score: 0-100 where 100 = highly targeted search likely to surface ideal candidates on LinkedIn.

Respond with JSON only, matching the schema exactly.`;

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
      formulaReminder:
        "Default structure: (current titles OR) AND (previous titles OR) AND (skills OR) AND (keywords OR) AND (colleges OR), with NOT exclusions.",
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
      temperature: 0.25,
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

  const validated = resultSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("AI response did not match the expected format. Try again.");
  }

  return validated.data;
}
