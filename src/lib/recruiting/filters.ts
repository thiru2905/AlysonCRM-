import { CandidateSearchFilters, RemotePreference, Seniority } from "./types";

const LIST_KEYS = [
  "keywords",
  "jobTitles",
  "requiredSkills",
  "optionalSkills",
  "previousCompanies",
  "seniority",
] as const;

const STRING_KEYS = [
  "country",
  "city",
  "currentCompany",
  "education",
  "industry",
  "remotePreference",
] as const;

const NUMBER_KEYS = [
  "minYearsOfExperience",
  "maxYearsOfExperience",
  "resultsPerPage",
  "page",
] as const;

export function filtersToSearchParams(
  filters: CandidateSearchFilters
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of LIST_KEYS) {
    const raw = filters[key];
    // Be resilient to legacy values that may be a plain string.
    const v = Array.isArray(raw)
      ? raw
      : typeof raw === "string" && raw
        ? [raw]
        : undefined;
    if (v && v.length) params.set(key, v.join(","));
  }
  for (const key of STRING_KEYS) {
    const v = filters[key];
    if (v) params.set(key, String(v));
  }
  for (const key of NUMBER_KEYS) {
    const v = filters[key];
    if (v !== undefined && v !== null) params.set(key, String(v));
  }
  return params;
}

/** Plain object variant, convenient for TanStack Router `search`. */
export function filtersToSearch(
  filters: CandidateSearchFilters
): Record<string, string> {
  return Object.fromEntries(filtersToSearchParams(filters));
}

export function searchParamsToFilters(
  params: URLSearchParams
): CandidateSearchFilters {
  const filters: CandidateSearchFilters = {};

  const keywords = params.get("keywords");
  if (keywords) filters.keywords = splitList(keywords);
  const jobTitles = params.get("jobTitles");
  if (jobTitles) filters.jobTitles = splitList(jobTitles);
  const requiredSkills = params.get("requiredSkills");
  if (requiredSkills) filters.requiredSkills = splitList(requiredSkills);
  const optionalSkills = params.get("optionalSkills");
  if (optionalSkills) filters.optionalSkills = splitList(optionalSkills);
  const previousCompanies = params.get("previousCompanies");
  if (previousCompanies) filters.previousCompanies = splitList(previousCompanies);
  const seniority = params.get("seniority");
  if (seniority) filters.seniority = splitList(seniority) as Seniority[];

  const country = params.get("country");
  if (country) filters.country = country;
  const city = params.get("city");
  if (city) filters.city = city;
  const currentCompany = params.get("currentCompany");
  if (currentCompany) filters.currentCompany = currentCompany;
  const education = params.get("education");
  if (education) filters.education = education;
  const industry = params.get("industry");
  if (industry) filters.industry = industry;
  const remotePreference = params.get("remotePreference");
  if (remotePreference) filters.remotePreference = remotePreference as RemotePreference;

  const minY = params.get("minYearsOfExperience");
  if (minY) filters.minYearsOfExperience = Number(minY);
  const maxY = params.get("maxYearsOfExperience");
  if (maxY) filters.maxYearsOfExperience = Number(maxY);
  const perPage = params.get("resultsPerPage");
  if (perPage) filters.resultsPerPage = Number(perPage);
  const page = params.get("page");
  if (page) filters.page = Number(page);

  return filters;
}

/** Build filters from a plain search-record (TanStack Router `useSearch`). */
export function searchToFilters(
  search: Record<string, unknown>
): CandidateSearchFilters {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  return searchParamsToFilters(params);
}

function splitList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countActiveFilters(filters: CandidateSearchFilters): number {
  let n = 0;
  for (const key of [...LIST_KEYS, ...STRING_KEYS]) {
    const v = filters[key as keyof CandidateSearchFilters];
    if (Array.isArray(v) ? v.length : v) n++;
  }
  if (filters.minYearsOfExperience !== undefined) n++;
  if (filters.maxYearsOfExperience !== undefined) n++;
  return n;
}
