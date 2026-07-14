import { createServerFn } from "@tanstack/react-start";
import {
  CandidateProfile,
  CandidateSearchFilters,
  CandidateSearchResponse,
  ProviderApiRequest,
  ProviderId,
} from "./types";
import { candidateSearchFiltersSchema } from "./validation";
import type { UsageSummary } from "./usage";
import type {
  LinkedInAIScoreRequest,
  LinkedInAIScoreResult,
} from "./linkedin/ai-score";
import type { ParseCollegesResult } from "./linkedin/parse-colleges";

// ---------------------------------------------------------------------------
// TanStack Start server functions. These run only on the server; provider
// modules (and any API keys they read) are dynamically imported inside the
// handlers so nothing sensitive is ever included in the client bundle.
// ---------------------------------------------------------------------------

export interface UsageResponse {
  rows: ProviderApiRequest[];
  summary: UsageSummary;
  activeProvider: ProviderId;
  providers: { id: ProviderId; label: string; configured: boolean }[];
}

export interface StatusResponse {
  activeProvider: ProviderId;
  providers: { id: ProviderId; label: string; configured: boolean }[];
  env: Record<string, string | boolean>;
}

export const searchCandidatesFn = createServerFn({ method: "POST" })
  .validator((filters: CandidateSearchFilters) => filters)
  .handler(async ({ data }): Promise<CandidateSearchResponse> => {
    const {
      getActiveProviderId,
      getProvider,
      ProviderNotConfiguredError,
      ProviderRequestError,
    } = await import("./providers");
    const { recordUsage } = await import("./usage");

    const providerId = getActiveProviderId();
    const started = Date.now();

    const parsed = candidateSearchFiltersSchema.safeParse(data ?? {});
    if (!parsed.success) {
      throw new Error("Invalid search filters");
    }

    try {
      const provider = getProvider();
      const response = await provider.searchCandidates(parsed.data);

      await recordUsage({
        provider: providerId,
        endpoint: "searchCandidates",
        returnedRecords: response.results.length,
        httpStatus: 200,
        responseTimeMs: Date.now() - started,
        estimatedCredits: response.creditsUsed,
      });

      return response;
    } catch (err) {
      const status =
        err instanceof ProviderRequestError
          ? err.status
          : err instanceof ProviderNotConfiguredError
            ? 503
            : 500;
      const message = err instanceof Error ? err.message : "Unknown error";

      await recordUsage({
        provider: providerId,
        endpoint: "searchCandidates",
        returnedRecords: 0,
        httpStatus: status,
        responseTimeMs: Date.now() - started,
        errorMessage: message,
      });

      throw new Error(message);
    }
  });

export const getCandidateFn = createServerFn({ method: "GET" })
  .validator((externalId: string) => externalId)
  .handler(async ({ data: externalId }): Promise<CandidateProfile> => {
    const {
      getActiveProviderId,
      getProvider,
      ProviderNotConfiguredError,
      ProviderRequestError,
    } = await import("./providers");
    const { recordUsage } = await import("./usage");

    const providerId = getActiveProviderId();
    const started = Date.now();

    if (!externalId) throw new Error("Missing candidate id");

    try {
      const provider = getProvider();
      const candidate = await provider.getCandidate(externalId);

      await recordUsage({
        provider: providerId,
        endpoint: "getCandidate",
        returnedRecords: 1,
        httpStatus: 200,
        responseTimeMs: Date.now() - started,
        estimatedCredits: providerId === "coresignal" ? 2 : providerId === "pdl" ? 1 : 0,
      });

      return candidate;
    } catch (err) {
      const status =
        err instanceof ProviderRequestError
          ? err.status
          : err instanceof ProviderNotConfiguredError
            ? 503
            : 500;
      const message = err instanceof Error ? err.message : "Unknown error";

      await recordUsage({
        provider: providerId,
        endpoint: "getCandidate",
        returnedRecords: 0,
        httpStatus: status,
        responseTimeMs: Date.now() - started,
        errorMessage: message,
      });

      throw new Error(message);
    }
  });

export const usageFn = createServerFn({ method: "GET" })
  .validator((limit?: number) => (typeof limit === "number" ? limit : 100))
  .handler(async ({ data: limit }): Promise<UsageResponse> => {
    const { listUsage, summarizeUsage } = await import("./usage");
    const { getActiveProviderId, AVAILABLE_PROVIDERS } = await import("./providers");

    const rows = await listUsage(Number.isFinite(limit) ? limit : 100);
    const summary = summarizeUsage(rows);

    return {
      rows,
      summary,
      activeProvider: getActiveProviderId(),
      providers: AVAILABLE_PROVIDERS.map((p) => ({
        id: p.id,
        label: p.label,
        configured: p.configured(),
      })),
    };
  });

export const statusFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StatusResponse> => {
    const { getActiveProviderId, AVAILABLE_PROVIDERS } = await import("./providers");
    return {
      activeProvider: getActiveProviderId(),
      providers: AVAILABLE_PROVIDERS.map((p) => ({
        id: p.id,
        label: p.label,
        configured: p.configured(),
      })),
      env: {
        CANDIDATE_PROVIDER: process.env.CANDIDATE_PROVIDER ?? "mock",
        CORESIGNAL_API_KEY: Boolean(process.env.CORESIGNAL_API_KEY),
        PDL_API_KEY: Boolean(process.env.PDL_API_KEY),
        DEEPSEEK_API_KEY: Boolean(process.env.DEEPSEEK_API_KEY),
      },
    };
  }
);

export const scoreLinkedInSearchFn = createServerFn({ method: "POST" })
  .validator((payload: LinkedInAIScoreRequest) => payload)
  .handler(async ({ data }): Promise<LinkedInAIScoreResult> => {
    const { scoreLinkedInSearch } = await import("./linkedin/ai-score.server");
    return scoreLinkedInSearch(data);
  });

export const parseCollegesFn = createServerFn({ method: "POST" })
  .validator((payload: { text: string }) => payload)
  .handler(async ({ data }): Promise<ParseCollegesResult> => {
    const { parseCollegesWithAI } = await import("./linkedin/parse-colleges.server");
    return parseCollegesWithAI(data.text);
  });
