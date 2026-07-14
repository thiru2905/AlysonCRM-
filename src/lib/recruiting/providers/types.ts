import {
  CandidateProfile,
  CandidateSearchFilters,
  CandidateSearchResponse,
} from "@/lib/recruiting/types";

/**
 * Every candidate data source must implement this interface. The rest of the
 * application depends only on this contract and on the normalized
 * `CandidateProfile` shape - never on provider-specific responses.
 */
export interface CandidateDataProvider {
  readonly id: "mock" | "coresignal" | "pdl";
  readonly label: string;

  searchCandidates(
    filters: CandidateSearchFilters
  ): Promise<CandidateSearchResponse>;

  getCandidate(externalId: string): Promise<CandidateProfile>;

  enrichCandidate?(
    candidate: Partial<CandidateProfile>
  ): Promise<CandidateProfile>;
}

/** Thrown by adapters when a provider is not configured / not implemented. */
export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, detail?: string) {
    super(
      `Provider "${provider}" is not configured.${detail ? ` ${detail}` : ""}`
    );
    this.name = "ProviderNotConfiguredError";
  }
}

/** Thrown when an external provider call fails. Carries an HTTP-ish status. */
export class ProviderRequestError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "ProviderRequestError";
    this.status = status;
  }
}
