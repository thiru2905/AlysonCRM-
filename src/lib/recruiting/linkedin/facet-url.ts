// ---------------------------------------------------------------------------
// Native LinkedIn facet encoding for search URLs.
//
// LinkedIn only exposes fixed experience buckets (not exact min/max years).
// We map the recruiter's range onto every overlapping bucket.
// ---------------------------------------------------------------------------

import { dedupe } from "./query-builder";
import type { LinkedInSearchConfig, LinkedInTarget } from "./types";

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

function encodeFacetText(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "%2520");
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
      return `(id:${id},text:${encodeFacetText(bucket.label)},selectionType:INCLUDED)`;
    })
    .filter(Boolean)
    .join(",");

  return `(type:YEARS_OF_EXPERIENCE,values:List(${values}))`;
}

function buildSalesNavigatorSchoolFilter(schools: string[]): string {
  const values = schools
    .map(
      (school) =>
        `(text:${encodeFacetText(school.trim())},selectionType:INCLUDED)`
    )
    .join(",");

  return `(type:SCHOOL,values:List(${values}))`;
}

function buildSalesNavigatorQueryObject(
  query: string,
  bucketIds: string[],
  schools: string[]
): string {
  const parts = ["spellCorrectionEnabled:true"];
  const trimmed = query.trim();

  if (trimmed) {
    parts.push(`keywords:${encodeFacetText(trimmed)}`);
  }

  const filters: string[] = [];
  if (bucketIds.length) {
    filters.push(buildSalesNavigatorYearsFilter(bucketIds));
  }
  if (schools.length) {
    filters.push(buildSalesNavigatorSchoolFilter(schools));
  }
  if (filters.length) {
    parts.push(`filters:List(${filters.join(",")})`);
  }

  return `(${parts.join(",")})`;
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

/** Build a search URL that includes native years-of-experience facets when set. */
export function buildSearchUrl(
  target: LinkedInTarget,
  query: string,
  config?: LinkedInSearchConfig
): string {
  const bucketIds = config ? getExperienceBucketIds(config) : [];
  const schools = config ? getSchoolNames(config) : [];
  const trimmed = query.trim();
  const hasFacets = bucketIds.length > 0 || schools.length > 0;

  switch (target) {
    case "sales": {
      if (!trimmed && !hasFacets) {
        return "https://www.linkedin.com/sales/search/people";
      }
      const queryObj = buildSalesNavigatorQueryObject(trimmed, bucketIds, schools);
      return `https://www.linkedin.com/sales/search/people?query=${encodeURIComponent(queryObj)}`;
    }
    case "recruiter": {
      const params = new URLSearchParams();
      if (trimmed) params.set("keywords", trimmed);
      if (hasFacets) {
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
      if (hasFacets) {
        params.set("query", buildClassicQueryObject(trimmed, bucketIds, schools));
      }
      return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
    }
  }
}
