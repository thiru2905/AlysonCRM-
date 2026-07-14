// ---------------------------------------------------------------------------
// Types for the LinkedIn / Sales Navigator search-query builder.
//
// This module is intentionally UI-agnostic and provider-agnostic. It only
// describes the shape of a recruiter's search configuration and the artefacts
// (Boolean query + search URLs) generated from it. No scraping, no auth, no
// LinkedIn cookies — the output is meant to be used inside the recruiter's own
// authorized LinkedIn / Sales Navigator account.
// ---------------------------------------------------------------------------

/** How the terms inside a single group are combined. */
export type MatchLogic = "any" | "all"; // any => OR, all => AND

/** Which LinkedIn surface we are generating a link for. */
export type LinkedInTarget = "people" | "sales" | "recruiter";

/**
 * Search strategy:
 *  - precision: role AND skills AND keywords NOT excluded (most relevant)
 *  - balanced:  role AND skills (wider pool)
 *  - broad:     role OR skills OR keywords (maximum sourcing)
 */
export type SearchMode = "precision" | "balanced" | "broad";

export type Confidence = "high" | "medium" | "low";

export interface LinkedInSearchConfig {
  // Free-text / boolean-matchable criteria
  keywords: string[];
  skills: string[];
  currentJobTitles: string[];
  previousJobTitles: string[];
  currentCompanies: string[];
  previousCompanies: string[];
  locations: string[];
  universities: string[];
  languages: string[];

  // Structured criteria (applied via LinkedIn's own filters, not the URL)
  industries: string[];
  seniority: string[];
  employmentTypes: string[];
  functions: string[];
  education: string[];
  minYears?: number;
  maxYears?: number;
  openToWork: boolean;

  // Exclusions (NOT)
  excludedKeywords: string[];
  excludedJobTitles: string[];
  excludedCompanies: string[];
  excludedLocations: string[];

  // Per-group matching logic
  logic: {
    keywords: MatchLogic;
    skills: MatchLogic;
    jobTitles: MatchLogic;
    previousJobTitles: MatchLogic;
    universities: MatchLogic;
  };
}

export const EMPTY_CONFIG: LinkedInSearchConfig = {
  keywords: [],
  skills: [],
  currentJobTitles: [],
  previousJobTitles: [],
  currentCompanies: [],
  previousCompanies: [],
  locations: [],
  universities: [],
  languages: [],
  industries: [],
  seniority: [],
  employmentTypes: [],
  functions: [],
  education: [],
  minYears: undefined,
  maxYears: undefined,
  openToWork: false,
  excludedKeywords: [],
  excludedJobTitles: [],
  excludedCompanies: [],
  excludedLocations: [],
  logic: {
    keywords: "any",
    skills: "any",
    jobTitles: "any",
    previousJobTitles: "any",
    universities: "any",
  },
};

export interface LinkedInSavedSearch {
  id: string;
  name: string;
  config: LinkedInSearchConfig;
  query: string;
  url: string;
  target: LinkedInTarget;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** A single named filter shown in the summary / manual-apply list. */
export interface NamedFilter {
  label: string;
  value: string;
}

export interface QueryValidation {
  errors: string[];
  warnings: string[];
  conflicts: string[];
  suggestions: string[];
}

export interface BuiltSearch {
  query: string;
  url: string;
  target: LinkedInTarget;
  includedFilters: NamedFilter[];
  manualFilters: NamedFilter[];
  validation: QueryValidation;
  // Split queries for Sales Navigator / Recruiter, which have dedicated boxes:
  //   titleQuery   -> paste into the "Job title" / "Current title" filter
  //   keywordQuery -> paste into the "Keywords" box (skills + keywords only)
  //   schoolQuery  -> paste into the "School" filter
  titleQuery: string;
  keywordQuery: string;
  schoolQuery: string;
}
