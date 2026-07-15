import type { BuiltSearch, LinkedInSearchConfig, LinkedInTarget, SearchMode } from "./types";

/** A single sourcing branch — one focused job-title angle on the base search. */
export interface SearchBranch {
  id: string;
  label: string;
  /** Primary job title for this branch (goes into currentJobTitles). */
  title: string;
  /** Optional OR variants within the same branch. */
  relatedTitles: string[];
  /** Extra skills specific to this branch (merged with base). */
  skills: string[];
  /** Extra keywords specific to this branch (merged with base). */
  keywords: string[];
  rationale: string;
  category: "core" | "adjacent" | "senior" | "junior" | "specialist";
  enabled: boolean;
}

export interface SearchBranchPlan {
  summary: string;
  baseRole: string;
  branches: SearchBranch[];
}

export interface BuiltSearchBranch extends SearchBranch {
  config: LinkedInSearchConfig;
  /** Primary built search (matches session target). */
  built: BuiltSearch;
  /** Ready-to-open URLs for each LinkedIn destination. */
  urls: Record<LinkedInTarget, string>;
  /** Boolean queries per destination (Sales Nav splits title vs keywords). */
  queries: Record<LinkedInTarget, string>;
}

export interface GenerateBranchesRequest {
  config: LinkedInSearchConfig;
  mode: SearchMode;
  target: LinkedInTarget;
  includeLowSignal: boolean;
  /** How many branches to generate (5–20). */
  count?: number;
  /** Optional free-text role brief for DeepSeek. */
  roleBrief?: string;
}
