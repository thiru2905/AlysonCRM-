// ---------------------------------------------------------------------------
// Native LinkedIn facet encoding for search URLs.
//
// LinkedIn only exposes fixed experience buckets (not exact min/max years).
// We map the recruiter's range onto every overlapping bucket.
// ---------------------------------------------------------------------------

import { dedupe, formatSchoolGroup, resolveLogic } from "./query-builder";
import { buildKeywordQuery } from "./optimizer";
import { lookupLinkedInSchoolId } from "./school-ids";
import type { LinkedInSearchConfig, LinkedInTarget, SearchMode } from "./types";

export interface ExperienceBucket {
  id: string;
  label: string;
  rangeMin: number;
  rangeMax: number;
}

/** LinkedIn's fixed years-of-experience buckets (Sales Nav + classic search). */
export const EXPERIENCE_BUCKETS: ExperienceBucket[] = [
  { id: "1", label: "Less than 1 year", rangeMin: 0, rangeMax: 0 },
  { id: "2", label: "1 to 2 years", rangeMin: 1, rangeMax: 2 },
  { id: "3", label: "3 to 5 years", rangeMin: 3, rangeMax: 5 },
  { id: "4", label: "6 to 10 years", rangeMin: 6, rangeMax: 10 },
  { id: "5", label: "More than 10 years", rangeMin: 11, rangeMax: 99 },
];

/** Map recruiter min/max years to LinkedIn bucket ids that overlap the range. */
export function mapYearsRangeToBucketIds(
  minYears?: number,
  maxYears?: number
): string[] {
  if (minYears == null && maxYears == null) return [];

  const min = minYears ?? 0;
  const max = maxYears ?? 99;

  return EXPERIENCE_BUCKETS.filter(
    (bucket) => bucket.rangeMax >= min && bucket.rangeMin <= max
  ).map((bucket) => bucket.id);
}

function bucketById(id: string): ExperienceBucket | undefined {
  return EXPERIENCE_BUCKETS.find((bucket) => bucket.id === id);
}

/** Escape characters that break Sales Navigator filters:List() grammar. */
function encodeSalesNavFacetText(text: string): string {
  return text.trim().replace(/,/g, "%2C");
}

/** Remove school: boolean group when schools are passed as native SCHOOL facets. */
export function stripSchoolGroup(query: string): string {
  const schoolGroup = /\((?:\s*school:"[^"]+"\s*(?:OR\s+)*)+\)/gi;
  let out = query.replace(schoolGroup, "").trim();
  out = out.replace(/\s+AND\s+AND\s+/gi, " AND ");
  out = out.replace(/^\s*AND\s+/i, "");
  out = out.replace(/\s+AND\s*$/i, "");
  out = out.replace(/\(\s+AND\s+/g, "(");
  out = out.replace(/\s+AND\s+\)/g, ")");
  return out.trim();
}

/** Classic / Recruiter people search queryParameters entry. */
function buildClassicYearsFacet(bucketIds: string[]): string {
  const joined = bucketIds.join(" %7C ");
  return `(key:yearsOfExperience,value:List(${joined}))`;
}

function buildClassicSchoolFacet(schools: string[]): string {
  const joined = schools
    .map((school) => encodeURIComponent(school.trim()))
    .join(" %7C ");
  return `(key:school,value:List(${joined}))`;
}

function buildClassicQueryObject(
  query: string,
  bucketIds: string[],
  schools: string[]
): string {
  const parts = ["flagshipSearchIntent:SEARCH_SRP"];
  const params = ["(key:resultType,value:List(PEOPLE))"];

  if (bucketIds.length) {
    params.push(buildClassicYearsFacet(bucketIds));
  }
  if (schools.length) {
    params.push(buildClassicSchoolFacet(schools));
  }

  parts.push(`queryParameters:List(${params.join(",")})`);

  const trimmed = query.trim();
  if (trimmed) {
    parts.unshift(`keywords:${trimmed}`);
  }

  return `(${parts.join(",")})`;
}

function buildSalesNavigatorYearsFilter(bucketIds: string[]): string {
  const values = bucketIds
    .map((id) => {
      const bucket = bucketById(id);
      if (!bucket) return "";
      return `(id:${id},text:${encodeSalesNavFacetText(bucket.label)},selectionType:INCLUDED)`;
    })
    .filter(Boolean)
    .join(",");

  return `(type:YEARS_OF_EXPERIENCE,values:List(${values}))`;
}

function buildSalesNavigatorTitleFilter(titles: string[]): string | null {
  if (titles.length === 0) return null;
  const values = titles
    .map(
      (title) =>
        `(text:${encodeSalesNavFacetText(title)},selectionType:INCLUDED)`
    )
    .join(",");
  return `(type:CURRENT_TITLE,values:List(${values}))`;
}

function buildSalesNavigatorSchoolFilter(
  schools: { id: string; name: string }[]
): string | null {
  if (schools.length === 0) return null;
  const values = schools
    .map(
      ({ id, name }) =>
        `(id:${id},text:${encodeSalesNavFacetText(name)},selectionType:INCLUDED)`
    )
    .join(",");
  return `(type:SCHOOL,values:List(${values}))`;
}

function partitionSchoolsForSalesNav(schools: string[]): {
  facetSchools: { id: string; name: string }[];
  keywordSchools: string[];
} {
  const facetSchools: { id: string; name: string }[] = [];
  const keywordSchools: string[] = [];

  for (const school of dedupe(schools)) {
    const trimmed = school.trim();
    const id = lookupLinkedInSchoolId(trimmed);
    if (id) facetSchools.push({ id, name: trimmed });
    else keywordSchools.push(trimmed);
  }

  return { facetSchools, keywordSchools };
}

/**
 * Sales Navigator URL with structured filters (title, school, years) plus a
 * separate keywords param for skills / achievements — not one giant OR blob.
 */
export function buildSalesNavigatorUrl(
  config: LinkedInSearchConfig,
  mode: SearchMode = "precision",
  includeLowSignal = false,
  options: Pick<SearchUrlOptions, "branchLink"> = {}
): string {
  if (options.branchLink) {
    return buildBranchSalesNavigatorUrl(config);
  }

  const bucketIds = getExperienceBucketIds(config);
  const { facetSchools, keywordSchools } = partitionSchoolsForSalesNav(
    getSchoolNames(config)
  );
  const titles = dedupe(config.currentJobTitles);

  let keywordText = buildKeywordQuery(config, mode, includeLowSignal).trim();
  if (keywordSchools.length) {
    const schoolKw = formatSchoolGroup(
      keywordSchools,
      resolveLogic(config).universities
    );
    keywordText = [keywordText, schoolKw].filter(Boolean).join(" AND ");
  }

  const filters: string[] = [];
  if (bucketIds.length) filters.push(buildSalesNavigatorYearsFilter(bucketIds));
  const titleFilter = buildSalesNavigatorTitleFilter(titles);
  if (titleFilter) filters.push(titleFilter);
  const schoolFilter = buildSalesNavigatorSchoolFilter(facetSchools);
  if (schoolFilter) filters.push(schoolFilter);

  const params = new URLSearchParams();
  if (keywordText) params.set("keywords", keywordText);
  if (filters.length) {
    params.set(
      "query",
      `(spellCorrectionEnabled:true,filters:List(${filters.join(",")}))`
    );
  }

  const qs = params.toString();
  return qs
    ? `https://www.linkedin.com/sales/search/people?${qs}`
    : "https://www.linkedin.com/sales/search/people";
}

export function getExperienceBucketIds(
  config: LinkedInSearchConfig
): string[] {
  return mapYearsRangeToBucketIds(config.minYears, config.maxYears);
}

export function hasEncodedExperienceFilter(
  config: LinkedInSearchConfig
): boolean {
  return getExperienceBucketIds(config).length > 0;
}

export function formatExperienceBucketsLabel(
  config: LinkedInSearchConfig
): string {
  return getExperienceBucketIds(config)
    .map((id) => bucketById(id)?.label)
    .filter(Boolean)
    .join(", ");
}

export function getSchoolNames(config: LinkedInSearchConfig): string[] {
  return dedupe(config.universities);
}

export function hasEncodedSchoolFilter(config: LinkedInSearchConfig): boolean {
  return getSchoolNames(config).length > 0;
}

export function formatSchoolsLabel(config: LinkedInSearchConfig): string {
  return getSchoolNames(config).join(", ");
}

/** Schools we can pre-select in a Sales Navigator URL (have LinkedIn ids). */
export function getSalesNavFacetSchools(config: LinkedInSearchConfig): string[] {
  return partitionSchoolsForSalesNav(getSchoolNames(config)).facetSchools.map(
    (s) => s.name
  );
}

/** Schools that must stay in keywords or be pasted manually in Sales Nav. */
export function getSalesNavManualSchools(config: LinkedInSearchConfig): string[] {
  return partitionSchoolsForSalesNav(getSchoolNames(config)).keywordSchools;
}

export interface SearchUrlOptions {
  mode?: SearchMode;
  includeLowSignal?: boolean;
  /** Branch map links: keywords-only People Search, title-only Sales Nav — no stacked AND facets. */
  branchLink?: boolean;
}

/** People Search URL with keywords only (LinkedIn docs: keywords param holds Boolean OR/NOT). */
export function buildBranchPeopleSearchUrl(query: string): string {
  const params = new URLSearchParams();
  params.set("origin", "FACETED_SEARCH");
  const trimmed = query.trim();
  if (trimmed) params.set("keywords", trimmed);
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

/** Sales Navigator: CURRENT_TITLE filter only (OR across titles). No keyword AND stack. */
export function buildBranchSalesNavigatorUrl(config: LinkedInSearchConfig): string {
  const titles = dedupe(config.currentJobTitles);
  const titleFilter = buildSalesNavigatorTitleFilter(titles);
  if (!titleFilter) {
    return "https://www.linkedin.com/sales/search/people";
  }
  const params = new URLSearchParams();
  params.set(
    "query",
    `(spellCorrectionEnabled:true,filters:List(${titleFilter}))`
  );
  return `https://www.linkedin.com/sales/search/people?${params.toString()}`;
}
/** Build a search URL that includes native facets when set. */
export function buildSearchUrl(
  target: LinkedInTarget,
  query: string,
  config?: LinkedInSearchConfig,
  options: SearchUrlOptions = {}
): string {
  const branchLink = options.branchLink ?? false;

  if (branchLink && target === "people") {
    return buildBranchPeopleSearchUrl(query);
  }

  const bucketIds = config ? getExperienceBucketIds(config) : [];
  const schools = config ? getSchoolNames(config) : [];
  const trimmed = query.trim();
  const hasFacets = bucketIds.length > 0 || schools.length > 0;

  switch (target) {
    case "sales":
      return config
        ? buildSalesNavigatorUrl(
            config,
            options.mode ?? "precision",
            options.includeLowSignal ?? false,
            { branchLink }
          )
        : trimmed
          ? `https://www.linkedin.com/sales/search/people?${new URLSearchParams({ keywords: trimmed }).toString()}`
          : "https://www.linkedin.com/sales/search/people";
    case "recruiter": {
      const params = new URLSearchParams();
      if (trimmed) params.set("keywords", trimmed);
      if (hasFacets && config && !branchLink) {
        params.set("query", buildClassicQueryObject(trimmed, bucketIds, schools));
      }
      const qs = params.toString();
      return `https://www.linkedin.com/talent/search${qs ? `?${qs}` : ""}`;
    }
    case "people":
    default: {
      const params = new URLSearchParams();
      params.set("origin", "FACETED_SEARCH");
      if (trimmed) params.set("keywords", trimmed);
      // Avoid school+years facets AND'd on top of keyword Boolean — causes zero results.
      if (hasFacets && config && !branchLink) {
        params.set("query", buildClassicQueryObject(trimmed, bucketIds, schools));
      }
      return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
    }
  }
}
