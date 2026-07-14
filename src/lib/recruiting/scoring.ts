import {
  CandidateProfile,
  CandidateSearchFilters,
  ScoreBreakdown,
  ScoredCandidate,
  SENIORITY_OPTIONS,
  Seniority,
} from "./types";

// ---------------------------------------------------------------------------
// Deterministic candidate scoring (v1 - no LLM).
//
//   Required skills ........ 40%
//   Relevant experience .... 25%
//   Seniority .............. 15%
//   Location / remote ...... 10%
//   Preferred skills ....... 10%
//
// The function is pure and deterministic: identical inputs always produce
// identical outputs. This keeps results reproducible and auditable.
// ---------------------------------------------------------------------------

const WEIGHTS: Record<
  "requiredSkills" | "relevantExperience" | "seniority" | "location" | "preferredSkills",
  number
> = {
  requiredSkills: 40,
  relevantExperience: 25,
  seniority: 15,
  location: 10,
  preferredSkills: 10,
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function seniorityRank(s?: Seniority): number | undefined {
  if (!s) return undefined;
  return SENIORITY_OPTIONS.find((o) => o.value === s)?.rank;
}

function matchSkills(candidateSkills: string[], wanted: string[]) {
  const set = new Set(candidateSkills.map(norm));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const w of wanted) {
    // partial containment counts as a match ("react" matches "react.js")
    const wn = norm(w);
    const hit =
      set.has(wn) ||
      candidateSkills.some((cs) => {
        const c = norm(cs);
        return c.includes(wn) || wn.includes(c);
      });
    if (hit) matched.push(w);
    else missing.push(w);
  }
  return { matched, missing };
}

export function scoreCandidate(
  candidate: CandidateProfile,
  filters: CandidateSearchFilters
): ScoredCandidate {
  const required = filters.requiredSkills ?? [];
  const optional = filters.optionalSkills ?? [];

  // 1. Required skills (40)
  const req = matchSkills(candidate.skills, required);
  const requiredScore =
    required.length === 0
      ? WEIGHTS.requiredSkills // no requirement => full marks
      : (req.matched.length / required.length) * WEIGHTS.requiredSkills;

  // 2. Relevant experience (25) - based on years vs requested range
  const yoe = candidate.yearsOfExperience ?? 0;
  const minY = filters.minYearsOfExperience;
  const maxY = filters.maxYearsOfExperience;
  let expScore: number;
  if (minY === undefined && maxY === undefined) {
    // No range given: reward experience up to ~12 years on a smooth curve.
    expScore = Math.min(1, yoe / 12) * WEIGHTS.relevantExperience;
  } else {
    const lo = minY ?? 0;
    const hi = maxY ?? Number.POSITIVE_INFINITY;
    if (yoe >= lo && yoe <= hi) {
      expScore = WEIGHTS.relevantExperience;
    } else if (yoe < lo) {
      // Below range: partial credit proportional to how close they are.
      const ratio = lo === 0 ? 1 : Math.max(0, yoe / lo);
      expScore = ratio * WEIGHTS.relevantExperience;
    } else {
      // Above the max: mild penalty (overqualified) but still strong.
      const over = yoe - hi;
      const penalty = Math.min(0.4, over * 0.05);
      expScore = (1 - penalty) * WEIGHTS.relevantExperience;
    }
  }

  // 3. Seniority (15)
  const wantedSeniorities = filters.seniority ?? [];
  let seniorityScore: number;
  if (wantedSeniorities.length === 0) {
    seniorityScore = WEIGHTS.seniority;
  } else if (candidate.seniority && wantedSeniorities.includes(candidate.seniority)) {
    seniorityScore = WEIGHTS.seniority;
  } else {
    // Partial credit by rank distance to the nearest requested seniority.
    const candRank = seniorityRank(candidate.seniority);
    if (candRank === undefined) {
      seniorityScore = WEIGHTS.seniority * 0.4;
    } else {
      const distances = wantedSeniorities
        .map((s) => seniorityRank(s))
        .filter((r): r is number => r !== undefined)
        .map((r) => Math.abs(r - candRank));
      const nearest = distances.length ? Math.min(...distances) : 3;
      const factor = Math.max(0, 1 - nearest * 0.25);
      seniorityScore = WEIGHTS.seniority * factor;
    }
  }

  // 4. Location / remote compatibility (10)
  let locationScore = WEIGHTS.location;
  const pref = filters.remotePreference ?? "any";
  const wantCountry = filters.country ? norm(filters.country) : undefined;
  const wantCity = filters.city ? norm(filters.city) : undefined;
  if (pref === "remote") {
    locationScore =
      candidate.remotePreference === "remote" || candidate.remotePreference === "hybrid"
        ? WEIGHTS.location
        : WEIGHTS.location * 0.5;
  } else if (wantCountry || wantCity) {
    const loc = norm(candidate.location ?? "");
    const country = norm(candidate.country ?? "");
    let hits = 0;
    let checks = 0;
    if (wantCountry) {
      checks++;
      if (country.includes(wantCountry) || loc.includes(wantCountry)) hits++;
    }
    if (wantCity) {
      checks++;
      if (loc.includes(wantCity)) hits++;
    }
    locationScore = checks === 0 ? WEIGHTS.location : (hits / checks) * WEIGHTS.location;
  }

  // 5. Preferred / optional skills (10)
  const opt = matchSkills(candidate.skills, optional);
  const preferredScore =
    optional.length === 0
      ? WEIGHTS.preferredSkills
      : (opt.matched.length / optional.length) * WEIGHTS.preferredSkills;

  const breakdown: ScoreBreakdown = {
    requiredSkills: round(requiredScore),
    relevantExperience: round(expScore),
    seniority: round(seniorityScore),
    locationCompatibility: round(locationScore),
    preferredSkills: round(preferredScore),
    total: 0,
  };
  breakdown.total = round(
    breakdown.requiredSkills +
      breakdown.relevantExperience +
      breakdown.seniority +
      breakdown.locationCompatibility +
      breakdown.preferredSkills
  );

  return {
    candidate,
    score: breakdown.total,
    breakdown,
    matchedRequiredSkills: req.matched,
    missingRequiredSkills: req.missing,
    matchedOptionalSkills: opt.matched,
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scoreBadgeTone(score: number): "success" | "warning" | "muted" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "muted";
}
