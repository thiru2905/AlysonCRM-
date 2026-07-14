import { ProviderId } from "@/lib/recruiting/types";
import { CandidateDataProvider } from "./types";
import { MockCandidateProvider } from "./mock/provider";
import { CoresignalCandidateProvider } from "./coresignal/provider";
import { PeopleDataLabsCandidateProvider } from "./pdl/provider";

export type { CandidateDataProvider } from "./types";
export {
  ProviderNotConfiguredError,
  ProviderRequestError,
} from "./types";

/** Which provider is active, driven by the CANDIDATE_PROVIDER env var. */
export function getActiveProviderId(): ProviderId {
  const raw = (process.env.CANDIDATE_PROVIDER ?? "mock").toLowerCase();
  if (raw === "coresignal" || raw === "pdl" || raw === "mock") return raw;
  return "mock";
}

/** Instantiates a provider by id. Adapters own their own key handling. */
export function createProvider(id: ProviderId): CandidateDataProvider {
  switch (id) {
    case "coresignal":
      return new CoresignalCandidateProvider(process.env.CORESIGNAL_API_KEY);
    case "pdl":
      return new PeopleDataLabsCandidateProvider(process.env.PDL_API_KEY);
    case "mock":
    default:
      return new MockCandidateProvider();
  }
}

/** Returns the currently-configured provider. Server-only. */
export function getProvider(): CandidateDataProvider {
  return createProvider(getActiveProviderId());
}

export const AVAILABLE_PROVIDERS: {
  id: ProviderId;
  label: string;
  configured: () => boolean;
}[] = [
  { id: "mock", label: "Mock Provider", configured: () => true },
  {
    id: "coresignal",
    label: "Coresignal",
    configured: () => Boolean(process.env.CORESIGNAL_API_KEY),
  },
  {
    id: "pdl",
    label: "People Data Labs",
    configured: () => Boolean(process.env.PDL_API_KEY),
  },
];
