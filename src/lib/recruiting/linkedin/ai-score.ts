// ---------------------------------------------------------------------------
// LinkedIn search AI relevance score — shared types and apply helpers.
// Server-side DeepSeek calls live in ai-score.server.ts (dynamic import only).
// ---------------------------------------------------------------------------

import { dedupe } from "./query-builder";
import type { LinkedInSearchConfig, MatchLogic, SearchMode } from "./types";

export type TermGroup =
  | "currentJobTitles"
  | "previousJobTitles"
  | "skills"
  | "keywords"
  | "universities";

export type PoolEstimate = "too_narrow" | "balanced" | "too_broad";

export interface TermAction {
  term: string;
  group: TermGroup;
  action: "keep" | "remove" | "replace";
  reason: string;
  replacement?: string;
}

export interface SuggestedAddition {
  group: TermGroup;
  terms: string[];
  reason: string;
}

export interface LogicTip {
  field: keyof LinkedInSearchConfig["logic"];
  recommended: MatchLogic;
  reason: string;
}

export interface LinkedInAIScoreResult {
  score: number;
  poolEstimate: PoolEstimate;
  recommendedMode: SearchMode;
  summary: string;
  strengths: string[];
  issues: string[];
  termActions: TermAction[];
  suggestedAdditions: SuggestedAddition[];
  logicTips: LogicTip[];
}

export interface LinkedInAIScoreRequest {
  config: LinkedInSearchConfig;
  mode: SearchMode;
  query: string;
  includeLowSignal: boolean;
}

const TERM_GROUPS: TermGroup[] = [
  "currentJobTitles",
  "previousJobTitles",
  "skills",
  "keywords",
  "universities",
];

function stripTerm(list: string[], term: string): string[] {
  const key = term.trim().toLowerCase();
  return list.filter((x) => x.trim().toLowerCase() !== key);
}

function replaceTerm(list: string[], term: string, replacement: string): string[] {
  const key = term.trim().toLowerCase();
  const out = list.map((x) =>
    x.trim().toLowerCase() === key ? replacement.trim() : x
  );
  return dedupe(out.filter(Boolean));
}

/** Apply AI term / logic recommendations onto a config (does not change mode). */
export function applyAIScoreRecommendations(
  config: LinkedInSearchConfig,
  result: LinkedInAIScoreResult
): LinkedInSearchConfig {
  const next: LinkedInSearchConfig = {
    ...config,
    logic: { ...config.logic },
  };

  for (const group of TERM_GROUPS) {
    next[group] = [...config[group]];
  }

  for (const action of result.termActions) {
    if (!TERM_GROUPS.includes(action.group)) continue;
    if (action.action === "remove") {
      next[action.group] = stripTerm(next[action.group], action.term);
    } else if (action.action === "replace" && action.replacement?.trim()) {
      next[action.group] = replaceTerm(
        next[action.group],
        action.term,
        action.replacement
      );
    }
  }

  for (const add of result.suggestedAdditions) {
    if (!TERM_GROUPS.includes(add.group)) continue;
    next[add.group] = dedupe([...next[add.group], ...add.terms]);
  }

  for (const tip of result.logicTips) {
    if (tip.field in next.logic) {
      next.logic[tip.field] = tip.recommended;
    }
  }

  return next;
}

export function scoreTone(score: number): "success" | "warning" | "destructive" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

export const POOL_LABELS: Record<PoolEstimate, string> = {
  too_narrow: "Pool may be too small",
  balanced: "Pool looks balanced",
  too_broad: "Pool may be too noisy",
};

export type TermHighlight = "keep" | "drop";

function termKey(term: string): string {
  return term.trim().toLowerCase();
}

/** Terms the AI flagged for removal/replacement (matched across all filter groups). */
export function getDropTermKeys(result: LinkedInAIScoreResult): Set<string> {
  const keys = new Set<string>();
  for (const action of result.termActions) {
    if (action.action === "remove" || action.action === "replace") {
      keys.add(termKey(action.term));
    }
  }
  return keys;
}

/** Map each tag to keep (green) or drop (red) after an AI analysis. */
export function buildTermHighlightsForGroup(
  result: LinkedInAIScoreResult,
  group: TermGroup,
  terms: string[]
): Record<string, TermHighlight> {
  const dropKeys = getDropTermKeys(result);

  const out: Record<string, TermHighlight> = {};
  for (const term of terms) {
    out[term] = dropKeys.has(termKey(term)) ? "drop" : "keep";
  }
  return out;
}

/** Remove every AI-flagged drop term from the searchable filter groups. */
export function removeDropTermsFromConfig(
  config: LinkedInSearchConfig,
  result: LinkedInAIScoreResult
): LinkedInSearchConfig {
  const dropKeys = getDropTermKeys(result);
  if (dropKeys.size === 0) return config;

  const strip = (terms: string[]) =>
    terms.filter((term) => !dropKeys.has(termKey(term)));

  return {
    ...config,
    currentJobTitles: strip(config.currentJobTitles),
    previousJobTitles: strip(config.previousJobTitles),
    skills: strip(config.skills),
    keywords: strip(config.keywords),
    universities: strip(config.universities),
  };
}
