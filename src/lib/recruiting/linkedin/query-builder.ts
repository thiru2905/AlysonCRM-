// ---------------------------------------------------------------------------
// Reusable Boolean query-builder service.
//
// Turns a LinkedInSearchConfig into a readable Boolean keyword string such as:
//
//   ("Software Engineer" OR "Full Stack Developer")
//   AND ("React" OR "Next.js")
//   NOT ("Junior" OR "Intern")
//
// Pure functions only — no React, no DOM, no network. Kept separate from the UI
// so it can be unit-tested and reused by the link generator.
// ---------------------------------------------------------------------------

import type { LinkedInSearchConfig, MatchLogic, QueryValidation } from "./types";
import { formatAchievementGroup } from "./achievements";

/** LinkedIn's keyword box practically breaks well before this; used to warn. */
export const MAX_QUERY_LENGTH = 1000;
/** LinkedIn / browsers get unreliable with very long URLs. */
export const MAX_URL_LENGTH = 1900;

/** Normalise a value for duplicate / conflict detection (not for display). */
export function normalizeTerm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Case-insensitive de-duplication that preserves the first display spelling. */
export function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    const key = normalizeTerm(v);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** A term is quoted so multi-word phrases match as a phrase on LinkedIn. */
function quote(term: string): string {
  // LinkedIn Boolean search does not support escaping quotes inside a phrase;
  // the safest thing is to strip stray double quotes from the term itself.
  return `"${term.replace(/"/g, "").trim()}"`;
}

/** Build a single parenthesised group like ("A" OR "B"). */
export function formatGroup(terms: string[], logic: MatchLogic): string {
  const cleaned = dedupe(terms).map(quote);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  return `(${cleaned.join(logic === "all" ? " AND " : " OR ")})`;
}

/** LinkedIn school filter syntax — school:"MIT" OR school:"Stanford University". */
export function formatSchoolGroup(terms: string[], logic: MatchLogic): string {
  const cleaned = dedupe(terms);
  if (cleaned.length === 0) return "";
  const parts = cleaned.map((term) => `school:${quote(term)}`);
  if (parts.length === 1) return parts[0];
  return `(${parts.join(logic === "all" ? " AND " : " OR ")})`;
}

const group = formatGroup;

/** Resolve logic with safe defaults for configs saved before new fields existed. */
export function resolveLogic(config: LinkedInSearchConfig) {
  return {
    keywords: config.logic.keywords ?? "any",
    achievements: config.logic.achievements ?? "any",
    skills: config.logic.skills ?? "any",
    jobTitles: config.logic.jobTitles ?? "any",
    previousJobTitles: config.logic.previousJobTitles ?? "any",
    universities: config.logic.universities ?? "any",
  };
}

/** Current + previous title groups, each with its own OR/AND logic. */
export function formatJobTitleGroups(config: LinkedInSearchConfig): string {
  const logic = resolveLogic(config);
  return [
    group(config.currentJobTitles, logic.jobTitles),
    group(config.previousJobTitles, logic.previousJobTitles),
  ]
    .filter(Boolean)
    .join(" AND ");
}

/**
 * Build the positive Boolean query (everything except NOT).
 * Groups are combined with AND — a candidate must match every provided group.
 */
export function buildPositiveQuery(config: LinkedInSearchConfig): string {
  const parts: string[] = [];
  const logic = resolveLogic(config);

  parts.push(formatJobTitleGroups(config));
  parts.push(group(config.skills, logic.skills));
  parts.push(group(config.keywords, logic.keywords));
  parts.push(
    formatAchievementGroup(config.achievements ?? [], logic.achievements)
  );
  parts.push(group(config.currentCompanies, "any"));
  parts.push(group(config.previousCompanies, "any"));
  parts.push(group(config.locations, "any"));
  parts.push(formatSchoolGroup(config.universities, logic.universities));
  parts.push(group(config.languages, "any"));

  return parts.filter(Boolean).join(" AND ");
}

/** All excluded terms combined into one NOT group. */
export function buildExclusionQuery(config: LinkedInSearchConfig): string {
  const excluded = [
    ...config.excludedKeywords,
    ...config.excludedJobTitles,
    ...config.excludedCompanies,
    ...config.excludedLocations,
  ];
  return group(excluded, "any");
}

/** Build the full Boolean query string. */
export function buildBooleanQuery(config: LinkedInSearchConfig): string {
  const positive = buildPositiveQuery(config);
  const not = buildExclusionQuery(config);
  if (positive && not) return `${positive} NOT ${not}`;
  if (!positive && not) return `NOT ${not}`;
  return positive;
}

/** Does the config contain any usable criteria at all? */
export function isConfigEmpty(config: LinkedInSearchConfig): boolean {
  const textEmpty = buildBooleanQuery(config).length === 0;
  const structuredEmpty =
    config.industries.length === 0 &&
    config.seniority.length === 0 &&
    config.employmentTypes.length === 0 &&
    config.functions.length === 0 &&
    config.education.length === 0 &&
    config.minYears == null &&
    config.maxYears == null &&
    !config.openToWork;
  return textEmpty && structuredEmpty;
}

/**
 * Validate a config and return friendly (non-technical) messages.
 * Detects: empty searches, include/exclude conflicts, overly long queries,
 * and conflicting experience ranges.
 */
export function validateConfig(config: LinkedInSearchConfig): QueryValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const conflicts: string[] = [];
  const suggestions: string[] = [];

  if (isConfigEmpty(config)) {
    errors.push("Add at least one filter before generating a search.");
  }

  // Include / exclude conflicts (same value on both sides).
  const included = new Map<string, string>();
  const addIncluded = (terms: string[]) => {
    for (const t of terms) included.set(normalizeTerm(t), t.trim());
  };
  addIncluded(config.keywords);
  addIncluded(config.skills);
  addIncluded(config.currentJobTitles);
  addIncluded(config.previousJobTitles);
  addIncluded(config.currentCompanies);
  addIncluded(config.previousCompanies);
  addIncluded(config.locations);

  const excluded = [
    ...config.excludedKeywords,
    ...config.excludedJobTitles,
    ...config.excludedCompanies,
    ...config.excludedLocations,
  ];
  const seenConflicts = new Set<string>();
  for (const ex of excluded) {
    const key = normalizeTerm(ex);
    if (included.has(key) && !seenConflicts.has(key)) {
      seenConflicts.add(key);
      conflicts.push(
        `“${included.get(key)}” is both included and excluded. Remove it from one side.`
      );
    }
  }

  // Experience range sanity.
  if (
    config.minYears != null &&
    config.maxYears != null &&
    config.minYears > config.maxYears
  ) {
    errors.push(
      "Minimum years of experience is greater than the maximum. Please adjust the range."
    );
  }

  // Query length.
  const query = buildBooleanQuery(config);
  if (query.length > MAX_QUERY_LENGTH) {
    warnings.push(
      "This search contains more keywords than LinkedIn can reliably match in one query. Consider narrowing the terms or applying some filters manually."
    );
  }

  return { errors, warnings, conflicts, suggestions };
}
