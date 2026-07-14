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
// People Data Labs (PDL) Person Search adapter (LIVE).
//
// Flow (see https://docs.peopledatalabs.com/docs/person-search-api):
//   POST /v5/person/search  -> full person records matching an ES query
//     (billed 1 credit per RETURNED record; the free tier is ~100 / month)
//
// Because search returns full profiles, no separate "collect" call is needed
// (unlike Coresignal). We cap the number of records requested per search via
// PDL_MAX_SIZE to protect the small free-tier quota. getCandidate() reuses a
// short-lived in-memory cache first, then falls back to the Enrich API.
//
// All PDL-specific field mapping stays in this file; the rest of the app only
// ever sees the normalized CandidateProfile.
// ---------------------------------------------------------------------------

const PDL_BASE_URL = "https://api.peopledatalabs.com/v5";
const SEARCH_PATH = "/person/search";
const ENRICH_PATH = "/person/enrich";

const DEFAULT_MAX_SIZE = 10; // conservative default for the free tier
const CREDIT_PER_RECORD = 1;

// Reuse profiles collected during a search when the detail page is opened, so
// we never pay twice within a server session.
const profileCache = new Map<string, CandidateProfile>();

interface PdlExperience {
  title?: { name?: string; role?: string; levels?: string[] };
  company?: { name?: string; industry?: string };
  location_names?: string[];
  summary?: string;
  start_date?: string;
  end_date?: string;
  is_primary?: boolean;
}

interface PdlEducation {
  school?: { name?: string };
  degrees?: string[];
  majors?: string[];
  start_date?: string;
  end_date?: string;
}

interface PdlRawPerson {
  id?: string;
  full_name?: string;
  job_title?: string;
  job_title_role?: string;
  job_title_levels?: string[];
  job_company_name?: string;
  job_company_industry?: string;
  industry?: string;
  location_name?: string;
  location_country?: string;
  inferred_years_experience?: number;
  skills?: string[];
  experience?: PdlExperience[];
  education?: PdlEducation[];
  linkedin_url?: string;
  summary?: string;
}

interface PdlSearchResponse {
  status?: number;
  data?: PdlRawPerson[];
  total?: number;
  error?: { message?: string };
}

// PDL job_title_levels -> our Seniority scale.
function mapLevel(levels?: string[]): Seniority | undefined {
  if (!levels || levels.length === 0) return undefined;
  const set = levels.map((l) => l.toLowerCase());
  if (set.some((l) => l.includes("cxo") || l.includes("owner") || l.includes("partner")))
    return "executive";
  if (set.some((l) => l.includes("vp") || l.includes("director"))) return "director";
  if (set.some((l) => l.includes("manager"))) return "manager";
  if (set.some((l) => l.includes("senior"))) return "senior";
  if (set.some((l) => l.includes("entry") || l.includes("training"))) return "junior";
  return undefined;
}

function normalizeUrl(url?: unknown): string | undefined {
  const s = str(url);
  if (!s) return undefined;
  return s.startsWith("http") ? s : `https://${s}`;
}

function parseYear(d?: string): number | undefined {
  if (!d) return undefined;
  const y = Number(String(d).slice(0, 4));
  return Number.isFinite(y) && y > 1900 && y < 2100 ? y : undefined;
}

// The free tier redacts `inferred_years_experience`, but the full experience
// list (with dates) is returned - so derive total career length from it:
// earliest start year -> latest end year (or now, if any role is current).
function deriveYears(experiences: CandidateExperience[]): number | undefined {
  const starts = experiences
    .map((e) => parseYear(e.startDate))
    .filter((y): y is number => y !== undefined);
  if (starts.length === 0) return undefined;

  const nowYear = new Date().getFullYear();
  const anyCurrent = experiences.some((e) => e.isCurrent || !e.endDate);
  const ends = experiences
    .map((e) => parseYear(e.endDate))
    .filter((y): y is number => y !== undefined);
  const latest = anyCurrent ? nowYear : ends.length ? Math.max(...ends) : nowYear;

  const years = latest - Math.min(...starts);
  return years >= 0 && years <= 60 ? years : undefined;
}

// Fallback seniority inference from the job title when job_title_levels is
// redacted/empty on the free tier.
function inferSeniority(title?: string): Seniority | undefined {
  if (!title) return undefined;
  const t = title.toLowerCase();
  if (t.includes("intern")) return "intern";
  if (t.includes("chief") || /\bc[teofpi]o\b/.test(t) || t.includes("founder")) return "executive";
  if (t.includes("vp") || t.includes("vice president")) return "director";
  if (t.includes("director") || t.includes("head of")) return "director";
  if (t.includes("principal") || t.includes("staff")) return "principal";
  if (t.includes("lead")) return "lead";
  if (t.includes("manager")) return "manager";
  if (t.includes("senior") || t.includes("sr.")) return "senior";
  if (t.includes("junior") || t.includes("jr.") || t.includes("associate") || t.includes("entry"))
    return "junior";
  return undefined;
}

// The PDL free tier redacts premium fields by returning `true` (or omitting
// them) instead of the real value. These guards keep those placeholders out of
// the normalized profile so the UI never shows "true" as a location, etc.
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function objArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export class PeopleDataLabsCandidateProvider implements CandidateDataProvider {
  readonly id = "pdl" as const;
  readonly label = "People Data Labs";

  constructor(private readonly apiKey: string | undefined) {}

  private get maxSize(): number {
    const raw = Number(process.env.PDL_MAX_SIZE);
    return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 100) : DEFAULT_MAX_SIZE;
  }

  private ensureConfigured(): string {
    if (!this.apiKey) {
      throw new ProviderNotConfiguredError(
        "pdl",
        "Set PDL_API_KEY in your environment (free key at dashboard.peopledatalabs.com)."
      );
    }
    return this.apiKey;
  }

  private headers(): HeadersInit {
    return {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": this.ensureConfigured(),
    };
  }

  /**
   * Builds an Elasticsearch bool query from the normalized filters.
   *
   * `relax` progressively loosens the query so a fully-filled form still
   * returns results instead of an empty screen. Higher levels move the least
   * important constraints from `must` (AND / required) to `should` (OR / boost):
   *   0  strict  - everything required
   *   1  drop city
   *   2  + drop years range, industry becomes optional
   *   3  + only the first required skill stays required; company optional
   *   4  + all skills and country become optional
   *   5  + job titles become optional (effectively an OR across all terms)
   */
  private buildQuery(f: CandidateSearchFilters, relax = 0): Record<string, unknown> {
    const must: unknown[] = [];
    const should: unknown[] = [];

    // PDL's ES dialect has no multi_match; spread each keyword across a few
    // fields as `should` matches (boosts ranking; also acts as the required
    // clause when it's a keyword-only search).
    for (const kw of f.keywords ?? []) {
      should.push({ match: { job_title: kw } });
      should.push({ match: { skills: kw.toLowerCase() } });
      should.push({ match: { summary: kw } });
    }

    // Required skills (PDL stores skills lowercase). Relaxed one at a time.
    (f.requiredSkills ?? []).forEach((skill, i) => {
      const clause = { term: { skills: skill.toLowerCase() } };
      const optional = relax >= 4 || (relax >= 3 && i > 0);
      (optional ? should : must).push(clause);
    });
    for (const skill of f.optionalSkills ?? []) {
      should.push({ term: { skills: skill.toLowerCase() } });
    }

    // "Any of these titles" -> a single space-joined match. PDL only supports
    // the simple `match` form ({ field: value }); a text match ORs its terms by
    // default, and rejects nested bools with minimum_should_match.
    if (f.jobTitles && f.jobTitles.length) {
      (relax >= 5 ? should : must).push({ match: { job_title: f.jobTitles.join(" ") } });
    }

    if (f.country) {
      (relax >= 4 ? should : must).push({
        term: { location_country: f.country.toLowerCase() },
      });
    }
    // City is the most brittle filter (exact locality token); drop it first.
    if (f.city && relax < 1) {
      must.push({ term: { location_locality: f.city.toLowerCase() } });
    }

    if (f.currentCompany) {
      (relax >= 3 ? should : must).push({ match: { job_company_name: f.currentCompany } });
    }

    for (const c of f.previousCompanies ?? []) {
      should.push({ match: { "experience.company.name": c } });
    }

    for (const s of f.seniority ?? []) {
      // Map a couple of our values to PDL's coarser level vocabulary.
      const level = s === "junior" ? "entry" : s === "executive" ? "cxo" : s;
      should.push({ term: { job_title_levels: level } });
    }

    if (f.industry) {
      (relax >= 2 ? should : must).push({ match: { industry: f.industry } });
    }

    if (f.education) should.push({ match: { "education.school.name": f.education } });

    if (relax < 2) {
      const range: Record<string, number> = {};
      if (f.minYearsOfExperience !== undefined) range.gte = f.minYearsOfExperience;
      if (f.maxYearsOfExperience !== undefined) range.lte = f.maxYearsOfExperience;
      if (Object.keys(range).length) {
        must.push({ range: { inferred_years_experience: range } });
      }
    }

    // PDL rejects a completely empty query; ensure at least one clause.
    if (must.length === 0 && should.length === 0) {
      must.push({ exists: { field: "job_title" } });
    }

    return {
      bool: {
        ...(must.length ? { must } : {}),
        ...(should.length ? { should } : {}),
      },
    };
  }

  /** Highest relaxation level attempted before giving up. */
  private static readonly MAX_RELAX = 5;

  private mapExperiences(raw: PdlRawPerson): CandidateExperience[] {
    return objArray<PdlExperience>(raw.experience)
      .map((e) => ({
        title: str(e.title?.name) ?? "",
        company: str(e.company?.name) ?? "",
        startDate: str(e.start_date),
        endDate: e.is_primary ? undefined : str(e.end_date),
        isCurrent: Boolean(e.is_primary) || !e.end_date,
        location: strArray(e.location_names)[0],
        description: str(e.summary),
      }))
      .filter((e) => e.title || e.company)
      .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  }

  private mapEducation(raw: PdlRawPerson): CandidateEducation[] {
    return objArray<PdlEducation>(raw.education)
      .map((ed) => {
        const start = str(ed.start_date);
        const end = str(ed.end_date);
        return {
          school: str(ed.school?.name) ?? "",
          degree: strArray(ed.degrees)[0],
          fieldOfStudy: strArray(ed.majors)[0],
          startYear: start ? Number(start.slice(0, 4)) || undefined : undefined,
          endYear: end ? Number(end.slice(0, 4)) || undefined : undefined,
        };
      })
      .filter((e) => e.school);
  }

  /** Maps a raw PDL person into the normalized CandidateProfile. */
  private normalize(raw: PdlRawPerson): CandidateProfile {
    const externalId = str(raw.id) ?? str(raw.linkedin_url) ?? "";
    const primary = objArray<PdlExperience>(raw.experience).find((e) => e.is_primary);

    const experiences = this.mapExperiences(raw);
    const currentJobTitle = str(raw.job_title) ?? str(primary?.title?.name);

    const name = str(raw.full_name);
    const profile: CandidateProfile = {
      id: `pdl-${externalId}`,
      provider: "pdl",
      externalId,
      fullName: name ? name.replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown",
      headline: currentJobTitle,
      location: str(raw.location_name),
      country: str(raw.location_country),
      currentJobTitle,
      currentCompany: str(raw.job_company_name) ?? str(primary?.company?.name),
      // Prefer PDL's inferred value; fall back to deriving it from work history
      // (the free tier omits the inferred field but returns the experience list).
      yearsOfExperience: num(raw.inferred_years_experience) ?? deriveYears(experiences),
      seniority: mapLevel(strArray(raw.job_title_levels)) ?? inferSeniority(currentJobTitle),
      industry: str(raw.industry) ?? str(raw.job_company_industry) ?? str(primary?.company?.industry),
      skills: strArray(raw.skills),
      experiences,
      education: this.mapEducation(raw),
      profileUrl: normalizeUrl(raw.linkedin_url),
      summary: str(raw.summary),
      lastRefreshedAt: new Date().toISOString(),
    };
    if (externalId) profileCache.set(externalId, profile);
    return profile;
  }

  /** Runs one PDL search call at a given relaxation level. */
  private async runSearch(
    filters: CandidateSearchFilters,
    relax: number,
    size: number
  ): Promise<{ records: PdlRawPerson[]; matchedTotal: number }> {
    const res = await fetch(`${PDL_BASE_URL}${SEARCH_PATH}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ query: this.buildQuery(filters, relax), size }),
      cache: "no-store",
    });

    // 404 = zero matches at this level; caller relaxes and retries (0 credits).
    if (res.status === 404) return { records: [], matchedTotal: 0 };

    const body = (await res.json().catch(() => ({}))) as PdlSearchResponse;

    if (!res.ok) {
      const msg = body?.error?.message ?? JSON.stringify(body).slice(0, 200);
      throw new ProviderRequestError(`PDL search failed (${res.status}): ${msg}`, res.status);
    }

    const records = Array.isArray(body.data) ? body.data : [];
    const matchedTotal = typeof body.total === "number" ? body.total : records.length;
    return { records, matchedTotal };
  }

  async searchCandidates(
    filters: CandidateSearchFilters
  ): Promise<CandidateSearchResponse> {
    const start = Date.now();
    this.ensureConfigured();

    const perPage = filters.resultsPerPage ?? 20;
    const size = Math.min(perPage, this.maxSize);

    // Try strict first, then progressively relax until we get candidates.
    // 404 / empty levels cost no credits, so only the level that returns data
    // is billed.
    let records: PdlRawPerson[] = [];
    let matchedTotal = 0;
    let relaxUsed = 0;
    for (let relax = 0; relax <= PeopleDataLabsCandidateProvider.MAX_RELAX; relax++) {
      const attempt = await this.runSearch(filters, relax, size);
      if (attempt.records.length > 0) {
        records = attempt.records;
        matchedTotal = attempt.matchedTotal;
        relaxUsed = relax;
        break;
      }
    }

    if (records.length === 0) {
      return {
        results: [],
        page: 1,
        perPage: size,
        total: 0,
        totalPages: 1,
        provider: "pdl",
        tookMs: Date.now() - start,
        creditsUsed: 0,
        notice:
          "No candidates found, even after broadening the search. Try different job titles, skills, or country.",
      };
    }

    // Score against the ORIGINAL filters so relaxed results still rank by the
    // recruiter's true intent.
    const results = records
      .map((r) => scoreCandidate(this.normalize(r), filters))
      .sort((a, b) => b.score - a.score);

    const notes: string[] = [];
    if (relaxUsed > 0) {
      notes.push(
        "Some filters were automatically relaxed to find matches - the closest candidates are shown first."
      );
    }
    if (matchedTotal > records.length) {
      notes.push(
        `PDL matched ~${matchedTotal.toLocaleString()} people; showing ${records.length} (PDL_MAX_SIZE=${this.maxSize}) to conserve free-tier credits.`
      );
    }

    return {
      results,
      page: 1,
      perPage: size,
      total: records.length,
      totalPages: 1,
      provider: "pdl",
      tookMs: Date.now() - start,
      creditsUsed: records.length * CREDIT_PER_RECORD,
      notice: notes.join(" ") || undefined,
    };
  }

  async getCandidate(externalId: string): Promise<CandidateProfile> {
    this.ensureConfigured();

    const cached = profileCache.get(externalId);
    if (cached) return cached;

    // Fall back to the Enrich API (also 1 credit). PDL persistent ids resolve
    // via pdl_id; a LinkedIn URL resolves via the `profile` param.
    const param = externalId.includes("linkedin.com")
      ? `profile=${encodeURIComponent(externalId)}`
      : `pdl_id=${encodeURIComponent(externalId)}`;

    const res = await fetch(`${PDL_BASE_URL}${ENRICH_PATH}?${param}`, {
      method: "GET",
      headers: this.headers(),
      cache: "no-store",
    });

    if (res.status === 404) {
      throw new ProviderRequestError(`Candidate "${externalId}" not found`, 404);
    }

    const body = (await res.json().catch(() => ({}))) as {
      data?: PdlRawPerson;
      error?: { message?: string };
    };

    if (!res.ok || !body.data) {
      const msg = body?.error?.message ?? JSON.stringify(body).slice(0, 200);
      throw new ProviderRequestError(`PDL enrich failed (${res.status}): ${msg}`, res.status);
    }

    return this.normalize(body.data);
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
