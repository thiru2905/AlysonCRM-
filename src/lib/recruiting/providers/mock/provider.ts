import {
  CandidateProfile,
  CandidateSearchFilters,
  CandidateSearchResponse,
} from "@/lib/recruiting/types";
import { scoreCandidate } from "@/lib/recruiting/scoring";
import { CandidateDataProvider, ProviderRequestError } from "../types";
import { getMockCandidates } from "./data";

function norm(s: string) {
  return s.trim().toLowerCase();
}

function textMatches(candidate: CandidateProfile, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return true;
  const haystack = [
    candidate.fullName,
    candidate.headline,
    candidate.currentJobTitle,
    candidate.currentCompany,
    candidate.summary,
    candidate.skills.join(" "),
    candidate.industry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  // Every keyword (which may be a multi-word phrase) must be present.
  return keywords
    .map((k) => norm(k))
    .filter(Boolean)
    .every((keyword) => haystack.includes(keyword));
}

function anyMatch(values: string[] | undefined, target: string | undefined): boolean {
  if (!values || values.length === 0) return true;
  if (!target) return false;
  const t = norm(target);
  return values.some((v) => t.includes(norm(v)) || norm(v).includes(t));
}

function hasAnySkill(candidate: CandidateProfile, wanted?: string[]): boolean {
  if (!wanted || wanted.length === 0) return true;
  const set = candidate.skills.map(norm);
  return wanted.some((w) => set.some((s) => s.includes(norm(w)) || norm(w).includes(s)));
}

function passesHardFilters(
  c: CandidateProfile,
  f: CandidateSearchFilters
): boolean {
  if (!textMatches(c, f.keywords)) return false;

  // job titles: candidate title should relate to at least one requested title
  if (f.jobTitles && f.jobTitles.length) {
    const title = norm(c.currentJobTitle ?? "");
    const ok = f.jobTitles.some((t) => title.includes(norm(t)) || norm(t).includes(title));
    if (!ok) return false;
  }

  // required skills: candidate must have at least one (scoring rewards coverage)
  if (!hasAnySkill(c, f.requiredSkills)) return false;

  if (f.country && !norm(c.country ?? "").includes(norm(f.country)) &&
      !norm(c.location ?? "").includes(norm(f.country))) {
    return false;
  }
  if (f.city && !norm(c.location ?? "").includes(norm(f.city))) return false;

  if (f.remotePreference && f.remotePreference !== "any") {
    if (c.remotePreference !== f.remotePreference) {
      // allow hybrid to satisfy remote requests
      if (!(f.remotePreference === "remote" && c.remotePreference === "hybrid")) {
        return false;
      }
    }
  }

  if (f.currentCompany && !anyMatch([f.currentCompany], c.currentCompany)) return false;

  if (f.previousCompanies && f.previousCompanies.length) {
    const companies = c.experiences.map((e) => norm(e.company));
    const ok = f.previousCompanies.some((pc) =>
      companies.some((co) => co.includes(norm(pc)))
    );
    if (!ok) return false;
  }

  const yoe = c.yearsOfExperience ?? 0;
  if (f.minYearsOfExperience !== undefined && yoe < f.minYearsOfExperience) return false;
  if (f.maxYearsOfExperience !== undefined && yoe > f.maxYearsOfExperience) return false;

  if (f.seniority && f.seniority.length && c.seniority) {
    if (!f.seniority.includes(c.seniority)) return false;
  }

  if (f.industry && !norm(c.industry ?? "").includes(norm(f.industry))) return false;

  if (f.education) {
    const schools = c.education.map((e) => norm(`${e.school} ${e.degree ?? ""} ${e.fieldOfStudy ?? ""}`));
    if (!schools.some((s) => s.includes(norm(f.education!)))) return false;
  }

  return true;
}

export class MockCandidateProvider implements CandidateDataProvider {
  readonly id = "mock" as const;
  readonly label = "Mock Provider";

  private simulateLatency(): Promise<void> {
    // deterministic-ish small delay so loading states are visible
    return new Promise((r) => setTimeout(r, 250));
  }

  async searchCandidates(
    filters: CandidateSearchFilters
  ): Promise<CandidateSearchResponse> {
    const start = Date.now();
    await this.simulateLatency();

    const all = getMockCandidates();
    const matched = all.filter((c) => passesHardFilters(c, filters));

    const scored = matched
      .map((c) => scoreCandidate(c, filters))
      .sort((a, b) => b.score - a.score || a.candidate.fullName.localeCompare(b.candidate.fullName));

    const perPage = filters.resultsPerPage ?? 20;
    const page = filters.page ?? 1;
    const total = scored.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startIdx = (page - 1) * perPage;
    const results = scored.slice(startIdx, startIdx + perPage);

    return {
      results,
      page,
      perPage,
      total,
      totalPages,
      provider: "mock",
      tookMs: Date.now() - start,
      creditsUsed: 0,
    };
  }

  async getCandidate(externalId: string): Promise<CandidateProfile> {
    await this.simulateLatency();
    const found = getMockCandidates().find((c) => c.externalId === externalId);
    if (!found) {
      throw new ProviderRequestError(`Candidate "${externalId}" not found`, 404);
    }
    return { ...found, lastRefreshedAt: new Date().toISOString() };
  }

  async enrichCandidate(
    candidate: Partial<CandidateProfile>
  ): Promise<CandidateProfile> {
    if (candidate.externalId) {
      try {
        return await this.getCandidate(candidate.externalId);
      } catch {
        // fall through to echo
      }
    }
    return {
      id: candidate.id ?? candidate.externalId ?? "unknown",
      provider: "mock",
      externalId: candidate.externalId ?? "unknown",
      fullName: candidate.fullName ?? "Unknown Candidate",
      skills: candidate.skills ?? [],
      experiences: candidate.experiences ?? [],
      education: candidate.education ?? [],
      lastRefreshedAt: new Date().toISOString(),
      ...candidate,
    } as CandidateProfile;
  }
}
