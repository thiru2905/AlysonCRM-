import {
  CandidateEducation,
  CandidateExperience,
  CandidateProfile,
  CandidateSearchFilters,
  CandidateSearchResponse,
  Seniority,
} from "@/lib/recruiting/types";
import { scoreCandidate } from "@/lib/recruiting/scoring";
import {
  CandidateDataProvider,
  ProviderNotConfiguredError,
  ProviderRequestError,
} from "../types";

// ---------------------------------------------------------------------------
// Coresignal Multi-source Employee API adapter (LIVE).
//
// Flow (see https://docs.coresignal.com/employee-api/multi-source-employee-api):
//   1. POST /v2/employee_multi_source/search/es_dsl  -> array of employee IDs
//      (costs 2 search credits per call)
//   2. GET  /v2/employee_multi_source/collect/{id}   -> full profile
//      (costs 2 collect credits per call)
//
// Because collecting is billed per profile, we only collect the profiles for
// the requested page and enforce a hard ceiling (CORESIGNAL_MAX_COLLECT).
// All Coresignal-specific field mapping stays in this file; the rest of the app
// only ever sees the normalized CandidateProfile.
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.coresignal.com/cdapi/v2";
const SEARCH_PATH = "/employee_multi_source/search/es_dsl";
const COLLECT_PATH = "/employee_multi_source/collect";

const SEARCH_CREDITS = 2;
const COLLECT_CREDITS = 2;
const DEFAULT_MAX_COLLECT = 20;

// Simple in-memory cache of collected profiles to avoid paying twice within a
// server session (e.g. search -> open detail page).
const profileCache = new Map<string, CandidateProfile>();

interface CoresignalExperience {
  position_title?: string;
  company_name?: string;
  company_industry?: string;
  location?: string;
  description?: string;
  active_experience?: number;
  date_from?: string;
  date_from_year?: number;
  date_from_month?: number;
  date_to?: string;
  date_to_year?: number;
  date_to_month?: number;
}

interface CoresignalEducation {
  institution_name?: string;
  degree?: string;
  description?: string;
  date_from_year?: number;
  date_to_year?: number;
}

interface CoresignalEmployee {
  id?: number | string;
  full_name?: string;
  headline?: string;
  summary?: string;
  location_full?: string;
  location_country?: string;
  picture_url?: string;
  professional_network_url?: string;
  active_experience_title?: string;
  active_experience_management_level?: string;
  total_experience_duration_months?: number;
  inferred_skills?: string[];
  experience?: CoresignalExperience[];
  education?: CoresignalEducation[];
  updated_at?: string;
}

function mapManagementLevel(level?: string): Seniority | undefined {
  if (!level) return undefined;
  const l = level.toLowerCase();
  if (l.includes("intern")) return "intern";
  if (l.includes("entry") || l.includes("junior")) return "junior";
  if (l.includes("senior")) return "senior";
  if (l.includes("lead")) return "lead";
  if (l.includes("principal") || l.includes("staff")) return "principal";
  if (l.includes("manager")) return "manager";
  if (l.includes("director") || l.includes("vp") || l.includes("vice")) return "director";
  if (l.includes("cxo") || l.includes("chief") || l.includes("owner") || l.includes("partner"))
    return "executive";
  if (l.includes("mid") || l.includes("middle")) return "mid";
  return undefined;
}

function fmtDate(dateStr?: string, year?: number, month?: number): string | undefined {
  if (dateStr) return dateStr.slice(0, 7);
  if (year) return month ? `${year}-${String(month).padStart(2, "0")}` : `${year}`;
  return undefined;
}

export class CoresignalCandidateProvider implements CandidateDataProvider {
  readonly id = "coresignal" as const;
  readonly label = "Coresignal";

  constructor(private readonly apiKey: string | undefined) {}

  private get maxCollect(): number {
    const raw = Number(process.env.CORESIGNAL_MAX_COLLECT);
    return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 100) : DEFAULT_MAX_COLLECT;
  }

  private ensureConfigured(): string {
    if (!this.apiKey) {
      throw new ProviderNotConfiguredError(
        "coresignal",
        "Set CORESIGNAL_API_KEY in your environment."
      );
    }
    return this.apiKey;
  }

  private headers(): HeadersInit {
    return {
      accept: "application/json",
      "Content-Type": "application/json",
      apikey: this.ensureConfigured(),
    };
  }

  /** Builds an Elasticsearch DSL bool query from the normalized filters. */
  private buildQuery(f: CandidateSearchFilters): Record<string, unknown> {
    const must: unknown[] = [];
    const should: unknown[] = [];
    const filter: unknown[] = [];

    for (const kw of f.keywords ?? []) {
      must.push({
        multi_match: {
          query: kw,
          fields: ["headline", "summary", "inferred_skills", "active_experience_title", "full_name"],
          operator: "and",
        },
      });
    }

    for (const skill of f.requiredSkills ?? []) {
      must.push({ match: { inferred_skills: { query: skill, operator: "and" } } });
    }
    for (const skill of f.optionalSkills ?? []) {
      should.push({ match: { inferred_skills: { query: skill, operator: "and" } } });
    }

    if (f.jobTitles && f.jobTitles.length) {
      must.push({
        bool: {
          should: f.jobTitles.map((t) => ({
            match: { active_experience_title: { query: t } },
          })),
          minimum_should_match: 1,
        },
      });
    }

    if (f.country) must.push({ match: { location_country: { query: f.country } } });
    if (f.city) must.push({ match: { location_full: { query: f.city } } });

    if (f.currentCompany) {
      must.push({
        nested: {
          path: "experience",
          query: {
            bool: {
              must: [
                { match: { "experience.company_name": { query: f.currentCompany } } },
                { term: { "experience.active_experience": 1 } },
              ],
            },
          },
        },
      });
    }

    if (f.previousCompanies && f.previousCompanies.length) {
      should.push({
        nested: {
          path: "experience",
          query: {
            bool: {
              should: f.previousCompanies.map((c) => ({
                match: { "experience.company_name": { query: c } },
              })),
              minimum_should_match: 1,
            },
          },
        },
      });
    }

    for (const s of f.seniority ?? []) {
      should.push({ match: { active_experience_management_level: { query: s } } });
    }

    if (f.education) {
      should.push({
        nested: {
          path: "education",
          query: {
            multi_match: {
              query: f.education,
              fields: ["education.institution_name", "education.degree"],
            },
          },
        },
      });
    }

    const monthsRange: Record<string, number> = {};
    if (f.minYearsOfExperience !== undefined) monthsRange.gte = f.minYearsOfExperience * 12;
    if (f.maxYearsOfExperience !== undefined) monthsRange.lte = f.maxYearsOfExperience * 12;
    if (Object.keys(monthsRange).length) {
      filter.push({ range: { total_experience_duration_months: monthsRange } });
    }

    // Ensure we never send a completely empty bool (Coresignal requires a query).
    if (must.length === 0 && should.length === 0 && filter.length === 0) {
      must.push({ exists: { field: "full_name" } });
    }

    return {
      query: {
        bool: {
          ...(must.length ? { must } : {}),
          ...(should.length ? { should } : {}),
          ...(filter.length ? { filter } : {}),
        },
      },
    };
  }

  /** POST the DSL query and return the list of employee IDs (relevance order). */
  private async searchIds(f: CandidateSearchFilters): Promise<string[]> {
    const res = await fetch(`${BASE_URL}${SEARCH_PATH}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(this.buildQuery(f)),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderRequestError(
        `Coresignal search failed (${res.status}): ${text.slice(0, 200)}`,
        res.status
      );
    }

    const data = await res.json();
    // The endpoint returns a JSON array of IDs; be defensive about wrappers.
    const ids: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.ids)
          ? data.ids
          : [];
    return ids.map((x) => String(x));
  }

  private async collect(id: string): Promise<CandidateProfile | null> {
    const cached = profileCache.get(id);
    if (cached) return cached;

    const res = await fetch(`${BASE_URL}${COLLECT_PATH}/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: this.headers(),
      cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderRequestError(
        `Coresignal collect failed (${res.status}): ${text.slice(0, 200)}`,
        res.status
      );
    }

    const raw = (await res.json()) as CoresignalEmployee;
    const profile = this.normalize(raw);
    profileCache.set(id, profile);
    return profile;
  }

  /** Maps a raw Coresignal employee document into the normalized shape. */
  private normalize(raw: CoresignalEmployee): CandidateProfile {
    const externalId = String(raw.id ?? "");

    const rawExp = Array.isArray(raw.experience) ? raw.experience : [];
    const experiences: CandidateExperience[] = rawExp
      .map((e) => ({
        title: e.position_title ?? "",
        company: e.company_name ?? "",
        startDate: fmtDate(e.date_from, e.date_from_year, e.date_from_month),
        endDate: e.active_experience === 1 ? undefined : fmtDate(e.date_to, e.date_to_year, e.date_to_month),
        isCurrent: e.active_experience === 1,
        location: e.location,
        description: e.description,
      }))
      .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));

    const current = rawExp.find((e) => e.active_experience === 1) ?? rawExp[0];

    const education: CandidateEducation[] = (raw.education ?? []).map((ed) => ({
      school: ed.institution_name ?? "",
      degree: ed.degree,
      fieldOfStudy: undefined,
      startYear: ed.date_from_year,
      endYear: ed.date_to_year,
    }));

    const months = raw.total_experience_duration_months;

    return {
      id: `coresignal-${externalId}`,
      provider: "coresignal",
      externalId,
      fullName: raw.full_name ?? "Unknown",
      headline: raw.headline,
      location: raw.location_full,
      country: raw.location_country && raw.location_country !== "NULL" ? raw.location_country : undefined,
      currentJobTitle: raw.active_experience_title ?? current?.position_title,
      currentCompany: current?.company_name,
      yearsOfExperience: months ? Math.round((months / 12) * 10) / 10 : undefined,
      seniority: mapManagementLevel(raw.active_experience_management_level),
      remotePreference: undefined,
      industry: current?.company_industry,
      skills: Array.isArray(raw.inferred_skills) ? raw.inferred_skills : [],
      experiences,
      education,
      profileUrl: raw.professional_network_url,
      profileImageUrl: raw.picture_url,
      summary: raw.summary,
      lastRefreshedAt: raw.updated_at ?? new Date().toISOString(),
    };
  }

  async searchCandidates(
    filters: CandidateSearchFilters
  ): Promise<CandidateSearchResponse> {
    const start = Date.now();
    this.ensureConfigured();

    const ids = await this.searchIds(filters);
    let creditsUsed = SEARCH_CREDITS;

    const perPage = filters.resultsPerPage ?? 20;
    const page = filters.page ?? 1;
    const total = ids.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const pageIds = ids.slice((page - 1) * perPage, (page - 1) * perPage + perPage);
    const collectLimit = Math.min(pageIds.length, this.maxCollect);
    const toCollect = pageIds.slice(0, collectLimit);

    // Count billable collects up front (cache hits are free).
    creditsUsed += toCollect.filter((id) => !profileCache.has(id)).length * COLLECT_CREDITS;

    // Collect profiles in small concurrent batches.
    const profiles: CandidateProfile[] = [];
    const BATCH = 5;
    for (let i = 0; i < toCollect.length; i += BATCH) {
      const batch = toCollect.slice(i, i + BATCH);
      const settled = await Promise.all(batch.map((id) => this.collect(id).catch(() => null)));
      for (const p of settled) if (p) profiles.push(p);
    }

    const results = profiles
      .map((c) => scoreCandidate(c, filters))
      .sort((a, b) => b.score - a.score);

    const notice =
      collectLimit < pageIds.length
        ? `Collected ${collectLimit} of ${pageIds.length} profiles on this page (CORESIGNAL_MAX_COLLECT=${this.maxCollect}) to conserve credits.`
        : undefined;

    return {
      results,
      page,
      perPage,
      total,
      totalPages,
      provider: "coresignal",
      tookMs: Date.now() - start,
      creditsUsed,
      notice,
    };
  }

  async getCandidate(externalId: string): Promise<CandidateProfile> {
    this.ensureConfigured();
    const profile = await this.collect(externalId);
    if (!profile) {
      throw new ProviderRequestError(`Candidate "${externalId}" not found`, 404);
    }
    return profile;
  }

  async enrichCandidate(
    candidate: Partial<CandidateProfile>
  ): Promise<CandidateProfile> {
    if (!candidate.externalId) {
      throw new ProviderRequestError("enrichCandidate requires an externalId", 400);
    }
    return this.getCandidate(candidate.externalId);
  }
}
