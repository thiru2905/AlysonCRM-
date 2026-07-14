// ---------------------------------------------------------------------------
// Search-link generator.
//
// Produces the most usable, HONEST search URL possible for LinkedIn People
// Search, Sales Navigator, or Recruiter from a recruiter's config.
//
// Design principles:
//   * The keyword query holds ONLY job titles, skills, keywords and exclusions.
//   * Everything else (location, companies, industry, school, experience,
//     seniority, employment type, open-to-work) is a NATIVE LinkedIn filter and
//     is surfaced for manual application — never crammed into keywords (which
//     creates noise) and never faked as a URL parameter.
//   * No auth, no cookies, no scraping.
//
// Kept separate from React so it stays testable and reusable.
// ---------------------------------------------------------------------------

import { dedupe, validateConfig, MAX_URL_LENGTH } from "./query-builder";
import {
  buildModeQuery,
  analyzeQuality,
  buildTitleQuery,
  buildKeywordQuery,
} from "./optimizer";
import type {
  BuiltSearch,
  LinkedInSearchConfig,
  LinkedInTarget,
  NamedFilter,
  SearchMode,
} from "./types";

export const TARGET_OPTIONS: { value: LinkedInTarget; label: string }[] = [
  { value: "people", label: "LinkedIn People Search" },
  { value: "sales", label: "LinkedIn Sales Navigator" },
  { value: "recruiter", label: "LinkedIn Recruiter" },
];

/** The keyword-searchable groups that are encoded into the URL. */
function includedFilters(config: LinkedInSearchConfig): NamedFilter[] {
  const out: NamedFilter[] = [];
  const push = (label: string, values: string[]) => {
    const v = dedupe(values);
    if (v.length) out.push({ label, value: v.join(", ") });
  };
  push("Current job titles", config.currentJobTitles);
  push("Previous job titles", config.previousJobTitles);
  push("Skills", config.skills);
  push("Keywords", config.keywords);
  push("Colleges", config.universities);
  push("Excluded keywords", config.excludedKeywords);
  push("Excluded titles", config.excludedJobTitles);
  push("Excluded companies", config.excludedCompanies);
  push("Excluded locations", config.excludedLocations);
  return out;
}

/**
 * Native LinkedIn facets. These are far more accurate applied through
 * LinkedIn's own filter panel than stuffed into the keyword box, and most
 * cannot be reliably pre-filled via a public URL — so we list them.
 */
function manualFilters(config: LinkedInSearchConfig): NamedFilter[] {
  const out: NamedFilter[] = [];
  const push = (label: string, values: string[]) => {
    const v = dedupe(values);
    if (v.length) out.push({ label, value: v.join(", ") });
  };

  push("Location", config.locations);
  push("Current company", config.currentCompanies);
  push("Past company", config.previousCompanies);
  push("Industry", config.industries);
  push("School / university", config.universities);
  push("Language", config.languages);
  push("Seniority level", config.seniority);
  push("Function / department", config.functions);
  push("Employment type", config.employmentTypes);
  push("Education level", config.education);

  if (config.minYears != null || config.maxYears != null) {
    const min = config.minYears ?? 0;
    const max = config.maxYears != null ? config.maxYears : "+";
    out.push({ label: "Years of experience", value: `${min}–${max} years` });
  }
  if (config.openToWork) {
    out.push({ label: "Open to work", value: "Yes" });
  }
  return out;
}

function buildUrl(target: LinkedInTarget, query: string): string {
  const enc = encodeURIComponent(query);
  switch (target) {
    case "sales":
      // Sales Navigator pre-fills only the keyword box via the URL; the rich
      // facet query object is not publicly documented, so we keep it honest.
      return `https://www.linkedin.com/sales/search/people?keywords=${enc}`;
    case "recruiter":
      // Recruiter requires a seat; only the keyword search is reliably shareable.
      return `https://www.linkedin.com/talent/search?keywords=${enc}`;
    case "people":
    default:
      return `https://www.linkedin.com/search/results/people/?keywords=${enc}&origin=FACETED_SEARCH`;
  }
}

interface BuildOptions {
  mode?: SearchMode;
  includeLowSignal?: boolean;
}

/**
 * Build the full set of artefacts (query + url + included/manual split +
 * validation) for a given target and search mode. Never throws.
 */
export function buildSearch(
  config: LinkedInSearchConfig,
  target: LinkedInTarget,
  options: BuildOptions = {}
): BuiltSearch {
  const mode: SearchMode = options.mode ?? "precision";
  const includeLowSignal = options.includeLowSignal ?? false;

  const query = buildModeQuery(config, mode, includeLowSignal);
  const url = buildUrl(target, query);
  const validation = validateConfig(config);

  // Merge in relevance/quality checks.
  const quality = analyzeQuality(config, mode, includeLowSignal);
  validation.warnings.push(...quality.warnings);
  validation.suggestions.push(...quality.suggestions);

  if (url.length > MAX_URL_LENGTH) {
    validation.warnings.push(
      "This search contains more filters than LinkedIn can reliably include in one URL. The remaining filters have been listed for manual application."
    );
  }

  return {
    query,
    url,
    target,
    includedFilters: includedFilters(config),
    manualFilters: manualFilters(config),
    validation,
    titleQuery: buildTitleQuery(config, includeLowSignal),
    keywordQuery: buildKeywordQuery(config, mode, includeLowSignal),
  };
}

/** Build a URL from an already-generated (possibly hand-edited) query string. */
export function buildUrlFromQuery(
  target: LinkedInTarget,
  query: string
): string {
  return buildUrl(target, query);
}
