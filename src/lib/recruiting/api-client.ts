import {
  CandidateProfile,
  CandidateSearchFilters,
  CandidateSearchResponse,
} from "./types";
import {
  searchCandidatesFn,
  getCandidateFn,
  usageFn,
  statusFn,
  type UsageResponse,
  type StatusResponse,
} from "./server";

// Thin client-side wrappers around the TanStack Start server functions so the
// UI code reads like plain async calls.

export async function searchCandidates(
  filters: CandidateSearchFilters
): Promise<CandidateSearchResponse> {
  return searchCandidatesFn({ data: filters });
}

export async function fetchCandidate(externalId: string): Promise<CandidateProfile> {
  return getCandidateFn({ data: externalId });
}

export async function fetchUsage(limit = 100): Promise<UsageResponse> {
  return usageFn({ data: limit });
}

export async function fetchStatus(): Promise<StatusResponse> {
  return statusFn();
}

export type { UsageResponse, StatusResponse };
