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
  buildBranchKeywordQuery,
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
  /** Skip auto-sanitization (branch builder already simplifies). */
  skipSanitize?: boolean;
  /** Branch map: title-OR keywords only, no stacked school/year AND facets. */
  branchLink?: boolean;
  /** Base config for manual-filter hints when branchLink strips facets from URL. */
  manualConfig?: LinkedInSearchConfig;
}

/** LinkedIn often returns 0 results when title + skills + achievements are all AND'd. */
function sanitizeForLinkedIn(
  config: LinkedInSearchConfig,
  mode: SearchMode,
  includeLowSignal: boolean
): {
  config: LinkedInSearchConfig;
  mode: SearchMode;
  warnings: string[];
} {
  const warnings: string[] = [];
  let cfg = config;
  let m = mode;

  const query = () => buildModeQuery(cfg, m, includeLowSignal);
  let q = query();
  const andCount = () => (query().match(/\bAND\b/g) ?? []).length;

  if ((cfg.achievements?.length ?? 0) > 0 && (andCount() > 3 || q.length > 900)) {
    cfg = { ...cfg, achievements: [] };
    if (m === "precision") m = "balanced";
    warnings.push(
      "Achievements were removed from the keyword query — requiring them with AND logic usually returns zero LinkedIn results. Review profiles manually or use Search Branches."
    );
    q = query();
  }

  if (cfg.currentJobTitles.length > 2 && andCount() > 3) {
    cfg = {
      ...cfg,
      currentJobTitles: cfg.currentJobTitles.slice(0, 1),
      logic: { ...cfg.logic, jobTitles: "any" },
    };
    warnings.push(
      "Multiple job titles were collapsed to the primary title so LinkedIn returns results."
    );
  }

  if (cfg.skills.length > 6 && andCount() > 3) {
    cfg = { ...cfg, skills: cfg.skills.slice(0, 4), logic: { ...cfg.logic, skills: "any" } };
    warnings.push("Skills were capped to 4 with OR logic to avoid over-constraining results.");
  }

  // School in keywords AND school facet = double AND → zero results on People Search.
  if (hasEncodedSchoolFilter(cfg) && cfg.universities.length) {
    cfg = { ...cfg, universities: [] };
    warnings.push(
      "Colleges use LinkedIn's School filter in the URL only — not duplicated in the keyword box (AND'ing both usually returns zero)."
    );
    q = query();
  }

  // Multiple AND groups → broad OR in URL (LinkedIn Boolean: AND limits, OR widens).
  if (m !== "broad") {
    const ands = (query().match(/\bAND\b/g) ?? []).length;
    if (ands >= 2) {
      m = "broad";
      warnings.push(
        "Switched to broad OR search in the URL — chaining title AND skills AND colleges with AND often returns zero on LinkedIn."
      );
    }
  }

  return { config: cfg, mode: m, warnings };
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
  const includeLowSignal = options.includeLowSignal ?? false;
  const sanitized = options.skipSanitize
    ? { config, mode: options.mode ?? "precision", warnings: [] as string[] }
    : sanitizeForLinkedIn(config, options.mode ?? "precision", includeLowSignal);

  const effectiveConfig = sanitized.config;
  const mode: SearchMode = sanitized.mode;
  const branchLink = options.branchLink ?? false;
  const manualSource = options.manualConfig ?? effectiveConfig;

  const query = branchLink
    ? buildBranchKeywordQuery(effectiveConfig)
    : buildModeQuery(effectiveConfig, mode, includeLowSignal);

  const urlOpts = { mode, includeLowSignal, branchLink };
  const url =
    target === "sales"
      ? buildSalesNavigatorUrl(effectiveConfig, mode, includeLowSignal, { branchLink })
      : buildSearchUrl(target, query, effectiveConfig, urlOpts);
  const validation = validateConfig(effectiveConfig);

  const quality = analyzeQuality(effectiveConfig, mode, includeLowSignal);
  validation.warnings.push(...quality.warnings, ...sanitized.warnings);
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
    includedFilters: includedFilters(effectiveConfig, target),
    manualFilters: [
      ...manualFilters(branchLink ? manualSource : effectiveConfig, target),
      ...(config.achievements?.length && !effectiveConfig.achievements?.length
        ? [{ label: "Achievements (scan profiles manually)", value: config.achievements.join(", ") }]
        : []),
    ],
    validation,
    titleQuery: buildTitleQuery(effectiveConfig, includeLowSignal),
    keywordQuery: buildKeywordQuery(effectiveConfig, mode, includeLowSignal),
    schoolQuery: buildSchoolQuery(effectiveConfig, includeLowSignal),
  };
}

