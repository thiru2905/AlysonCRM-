// ---------------------------------------------------------------------------
// DeepSeek-powered multi-branch LinkedIn search planner (server-only).
// ---------------------------------------------------------------------------

import { z } from "zod";
import { extractJsonObject } from "./deepseek-json";
import {
  buildHeuristicBranchPlan,
  normalizeBranchPlan,
  newBranchId,
  sanitizeBranchSummary,
} from "./branch-builder";
import { getDeepSeekApiKey } from "./deepseek-env.server";
import type { GenerateBranchesRequest, SearchBranchPlan } from "./branch-types";
import type { LinkedInSearchConfig } from "./types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const branchSchema = z.object({
  summary: z.string().min(1).max(600),
  baseRole: z.string().min(1).max(120),
  branches: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        title: z.string().min(1).max(120),
        relatedTitles: z.array(z.string().min(1)).max(4).optional().default([]),
        skills: z.array(z.string().min(1)).max(6).optional().default([]),
        keywords: z.array(z.string().min(1)).max(6).optional().default([]),
        rationale: z.string().min(1).max(300),
        category: z
          .enum(["core", "adjacent", "senior", "junior", "specialist"])
          .optional()
          .default("adjacent"),
      })
    )
    .min(3)
    .max(20),
});

const SYSTEM_PROMPT = `You are an expert technical recruiter building LinkedIn Boolean search campaigns.

Given a recruiter's base search configuration, generate MULTIPLE search branches — each branch targets ONE primary job title (plus optional 1–3 OR title variants) that would surface similar candidates for the same hiring goal.

Rules:
- Branches must be meaningfully different titles (not duplicates). Example for "Data Scientist": ML Engineer, LLM Engineer, Applied Scientist, MLOps Engineer, NLP Engineer, AI Research Engineer, etc.
- Include seniority variants (Senior, Staff, Lead, Principal) and junior variants where relevant — tag category accordingly.
- category must be one of: core, adjacent, senior, junior, specialist
- Keep branch-specific skills/keywords minimal — only add 0–3 terms when they genuinely improve that branch. Shared skills stay in the base config.
- Do NOT repeat location, company, university, or exclusion filters — those are inherited from the base config.
- relatedTitles are optional OR alternatives within the same branch (max 3).
- Prefer high-signal, LinkedIn-searchable job titles used in the real market.
- Return ONLY valid JSON matching the schema. No markdown.`;

function summarizeConfig(config: LinkedInSearchConfig): string {
  const lines: string[] = [];
  if (config.currentJobTitles.length) {
    lines.push(`Current titles: ${config.currentJobTitles.join(", ")}`);
  }
  if (config.previousJobTitles.length) {
    lines.push(`Previous titles: ${config.previousJobTitles.join(", ")}`);
  }
  if (config.skills.length) lines.push(`Skills: ${config.skills.join(", ")}`);
  if (config.keywords.length) lines.push(`Keywords: ${config.keywords.join(", ")}`);
  if (config.locations.length) lines.push(`Locations: ${config.locations.join(", ")}`);
  if (config.universities.length) {
    lines.push(`Colleges: ${config.universities.join(", ")}`);
  }
  if (config.seniority.length) lines.push(`Seniority: ${config.seniority.join(", ")}`);
  if (config.industries.length) lines.push(`Industries: ${config.industries.join(", ")}`);
  if (config.minYears != null || config.maxYears != null) {
    lines.push(`Experience: ${config.minYears ?? 0}–${config.maxYears ?? "+"} years`);
  }
  return lines.join("\n") || "No filters yet — infer role from brief.";
}

function seedRole(config: LinkedInSearchConfig, roleBrief?: string): string {
  return (
    config.currentJobTitles[0] ??
    config.previousJobTitles[0] ??
    roleBrief?.split(/[,.\n]/)[0]?.trim() ??
    "Software Engineer"
  );
}

function coerceBranchPlan(
  parsed: unknown,
  fallbackRole: string
): SearchBranchPlan | null {
  if (!parsed || typeof parsed !== "object") return null;
  const raw = parsed as Record<string, unknown>;
  const branchesRaw = raw.branches;
  if (!Array.isArray(branchesRaw) || branchesRaw.length === 0) return null;

  const plan = normalizeBranchPlan(
    {
      summary:
        typeof raw.summary === "string" ? raw.summary : undefined,
      baseRole: typeof raw.baseRole === "string" ? raw.baseRole : undefined,
      branches: branchesRaw.map((item) => {
        const b = item as Record<string, unknown>;
        return {
          label: typeof b.label === "string" ? b.label : undefined,
          title: typeof b.title === "string" ? b.title : undefined,
          relatedTitles: Array.isArray(b.relatedTitles)
            ? b.relatedTitles.map(String)
            : [],
          skills: Array.isArray(b.skills) ? b.skills.map(String) : [],
          keywords: Array.isArray(b.keywords) ? b.keywords.map(String) : [],
          rationale: typeof b.rationale === "string" ? b.rationale : undefined,
          category: typeof b.category === "string" ? b.category : undefined,
        };
      }),
    },
    fallbackRole
  );

  return plan.branches.length >= 3 ? plan : null;
}

async function callDeepSeek(
  apiKey: string,
  req: GenerateBranchesRequest
): Promise<string> {
  const count = Math.min(20, Math.max(5, req.count ?? 15));
  const role = seedRole(req.config, req.roleBrief);

  const userPayload = {
    targetBranchCount: count,
    baseRole: role,
    roleBrief: req.roleBrief ?? null,
    searchMode: req.mode,
    configSummary: summarizeConfig(req.config),
    instructions: `Generate exactly ${count} distinct search branches with similar/adjacent job titles.`,
  };

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
        { role: "user", content: JSON.stringify(userPayload, null, 2) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: Math.min(8192, 1200 + count * 120),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DeepSeek failed (${res.status})${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");
  return content;
}

function parseDeepSeekResponse(
  content: string,
  fallbackRole: string
): SearchBranchPlan | null {
  const parsed = extractJsonObject(content);
  const strict = branchSchema.safeParse(parsed);
  if (strict.success) {
    return normalizeBranchPlan(
      {
        summary: strict.data.summary,
        baseRole: strict.data.baseRole,
        branches: strict.data.branches.map((b) => ({
          ...b,
          id: newBranchId(),
          enabled: true,
        })),
      },
      fallbackRole
    );
  }
  return coerceBranchPlan(parsed, fallbackRole);
}

export async function generateSearchBranches(
  req: GenerateBranchesRequest
): Promise<SearchBranchPlan> {
  const count = Math.min(20, Math.max(5, req.count ?? 15));
  const fallbackRole = seedRole(req.config, req.roleBrief);

  const hasCriteria =
    req.config.currentJobTitles.length > 0 ||
    req.config.skills.length > 0 ||
    req.config.keywords.length > 0 ||
    Boolean(req.roleBrief?.trim());

  if (!hasCriteria) {
    throw new Error(
      "Add at least one job title, skill, or keyword (or a role brief) before generating branches."
    );
  }

  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    return buildHeuristicBranchPlan(req.config, count, { reason: "no-key" });
  }

  try {
    const content = await callDeepSeek(apiKey, req);
    const plan = parseDeepSeekResponse(content, fallbackRole);

    if (!plan || plan.branches.length < 3) {
      throw new Error(
        "DeepSeek returned an incomplete branch plan. Please try again."
      );
    }

    return {
      ...plan,
      summary: sanitizeBranchSummary(plan.summary),
      branches: plan.branches.slice(0, count),
    };
  } catch (err) {
    console.error("[branch-generator] DeepSeek branch generation failed:", err);
    const message =
      err instanceof Error ? err.message : "DeepSeek branch generation failed";
    throw new Error(message);
  }
}
