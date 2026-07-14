// ---------------------------------------------------------------------------
// Search-link generator.
//
// Produces the most usable, HONEST search URL possible for LinkedIn People
// Search, Sales Navigator, or Recruiter from a recruiter's config.
//
// Design principles:
//   * The keyword query holds job titles, skills, keywords and exclusions.
//   * Native facets (years of experience, location, seniority, etc.) are encoded
//     in the URL when LinkedIn supports them; the rest are listed for manual apply.
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
  buildSchoolQuery,
} from "./optimizer";
import type {
  BuiltSearch,
  LinkedInSearchConfig,
  LinkedInTarget,
  NamedFilter,
  SearchMode,
} from "./types";

export { buildSearchUrl, buildSalesNavigatorUrl } from "./facet-url";
import {
  buildSearchUrl,
  buildSalesNavigatorUrl,
  hasEncodedExperienceFilter,
  formatExperienceBucketsLabel,
  hasEncodedSchoolFilter,
  formatSchoolsLabel,
  getSalesNavFacetSchools,
  getSalesNavManualSchools,
} from "./facet-url";

export const TARGET_OPTIONS: { value: LinkedInTarget; label: string }[] = [
  { value: "people", label: "LinkedIn People Search" },
  { value: "sales", label: "LinkedIn Sales Navigator" },
  { value: "recruiter", label: "LinkedIn Recruiter" },
];

/** The keyword-searchable groups that are encoded into the URL. */
function includedFilters(
  config: LinkedInSearchConfig,
  target: LinkedInTarget
): NamedFilter[] {
  const out: NamedFilter[] = [];
  const push = (label: string, values: string[]) => {
    const v = dedupe(values);
    if (v.length) out.push({ label, value: v.join(", ") });
  };

  if (target === "sales") {
    if (config.currentJobTitles.length) {
      out.push({
        label: "Current job titles (in URL filter)",
        value: dedupe(config.currentJobTitles).join(", "),
      });
    }
    push("Previous job titles", config.previousJobTitles);
  } else {
    push("Current job titles", config.currentJobTitles);
    push("Previous job titles", config.previousJobTitles);
  }

  push("Skills", config.skills);
  push("Keywords", config.keywords);
  push("Achievements", config.achievements ?? []);
  if (config.universities.length) {
    if (target === "sales") {
      const facet = getSalesNavFacetSchools(config);
      const manual = getSalesNavManualSchools(config);
      if (facet.length) {
        out.push({
          label: "Colleges (School filter in URL)",
          value: facet.join(", "),
        });
      }
      if (manual.length) {
        out.push({
          label: "Colleges (paste into School filter)",
          value: manual.join(", "),
        });
      }
    } else {
      out.push({
        label: "Colleges (school: filter)",
        value: formatSchoolsLabel(config),
      });
    }
  }
  push("Excluded keywords", config.excludedKeywords);
  push("Excluded titles", config.excludedJobTitles);
  push("Excluded companies", config.excludedCompanies);
  push("Excluded locations", config.excludedLocations);
  if (hasEncodedExperienceFilter(config)) {
    out.push({
      label: "Years of experience (in URL)",
      value: formatExperienceBucketsLabel(config),
    });
  }
  return out;
}

/**
 * Native LinkedIn facets. These are far more accurate applied through
 * LinkedIn's own filter panel than stuffed into the keyword box, and most
 * cannot be reliably pre-filled via a public URL — so we list them.
 */
function manualFilters(
  config: LinkedInSearchConfig,
  target: LinkedInTarget
): NamedFilter[] {
  const out: NamedFilter[] = [];
  const push = (label: string, values: string[]) => {
    const v = dedupe(values);
    if (v.length) out.push({ label, value: v.join(", ") });
  };

  push("Location", config.locations);
  push("Current company", config.currentCompanies);
  push("Past company", config.previousCompanies);
  push("Industry", config.industries);
  if (!hasEncodedSchoolFilter(config)) {
    push("School / university", config.universities);
  } else if (target === "sales") {
    push("School / university (paste manually)", getSalesNavManualSchools(config));
  }
  push("Language", config.languages);
  push("Seniority level", config.seniority);
  push("Function / department", config.functions);
  push("Employment type", config.employmentTypes);
  push("Education level", config.education);

  if (
    !hasEncodedExperienceFilter(config) &&
    (config.minYears != null || config.maxYears != null)
  ) {
    const min = config.minYears ?? 0;
    const max = config.maxYears != null ? config.maxYears : "+";
    out.push({ label: "Years of experience", value: `${min}–${max} years` });
  }
  if (config.openToWork) {
    out.push({ label: "Open to work", value: "Yes" });
  }
  return out;
}

/** Build a URL from query text plus optional native facets from the config. */
export function buildUrlFromQuery(
  target: LinkedInTarget,
  query: string,
  config?: LinkedInSearchConfig,
  options: BuildOptions = {}
): string {
  return buildSearchUrl(target, query, config, options);
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
  const url =
    target === "sales"
      ? buildSalesNavigatorUrl(config, mode, includeLowSignal)
      : buildSearchUrl(target, query, config, { mode, includeLowSignal });
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
    includedFilters: includedFilters(config, target),
    manualFilters: manualFilters(config, target),
    validation,
    titleQuery: buildTitleQuery(config, includeLowSignal),
    keywordQuery: buildKeywordQuery(config, mode, includeLowSignal),
    schoolQuery: buildSchoolQuery(config, includeLowSignal),
  };
}

