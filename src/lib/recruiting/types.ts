// ---------------------------------------------------------------------------
// Core candidate-sourcing domain types. Provider-agnostic. Nothing outside of
// the provider adapter files should ever import provider-specific shapes.
// Ported from the Alyson Recruiter app into the Alyson OS recruiter module.
// ---------------------------------------------------------------------------

export type ProviderId = "mock" | "coresignal" | "pdl";

export type RemotePreference = "any" | "remote" | "hybrid" | "onsite";

export type Seniority =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal"
  | "manager"
  | "director"
  | "executive";

export const SENIORITY_OPTIONS: { value: Seniority; label: string; rank: number }[] = [
  { value: "intern", label: "Intern", rank: 0 },
  { value: "junior", label: "Junior", rank: 1 },
  { value: "mid", label: "Mid-level", rank: 2 },
  { value: "senior", label: "Senior", rank: 3 },
  { value: "lead", label: "Lead", rank: 4 },
  { value: "principal", label: "Principal", rank: 5 },
  { value: "manager", label: "Manager", rank: 4 },
  { value: "director", label: "Director", rank: 6 },
  { value: "executive", label: "Executive", rank: 7 },
];

export interface CandidateExperience {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string; // undefined => current
  location?: string;
  description?: string;
  isCurrent?: boolean;
}

export interface CandidateEducation {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface CandidateProfile {
  id: string;
  provider: ProviderId;
  externalId: string;
  fullName: string;
  headline?: string;
  location?: string;
  country?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  seniority?: Seniority;
  remotePreference?: RemotePreference;
  industry?: string;
  skills: string[];
  experiences: CandidateExperience[];
  education: CandidateEducation[];
  profileUrl?: string;
  profileImageUrl?: string;
  summary?: string;
  lastRefreshedAt: string;
}

export interface CandidateSearchFilters {
  keywords?: string[];
  jobTitles?: string[];
  requiredSkills?: string[];
  optionalSkills?: string[];
  country?: string;
  city?: string;
  remotePreference?: RemotePreference;
  currentCompany?: string;
  previousCompanies?: string[];
  minYearsOfExperience?: number;
  maxYearsOfExperience?: number;
  seniority?: Seniority[];
  education?: string;
  industry?: string;
  resultsPerPage?: number;
  page?: number;
}

export interface ScoreBreakdown {
  requiredSkills: number; // 0-40
  relevantExperience: number; // 0-25
  seniority: number; // 0-15
  locationCompatibility: number; // 0-10
  preferredSkills: number; // 0-10
  total: number; // 0-100
}

export interface ScoredCandidate {
  candidate: CandidateProfile;
  score: number;
  breakdown: ScoreBreakdown;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedOptionalSkills: string[];
}

export interface CandidateSearchResponse {
  results: ScoredCandidate[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  provider: ProviderId;
  tookMs: number;
  creditsUsed?: number;
  notice?: string;
}

// ---------------------------------------------------------------------------
// Hiring pipeline
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES = [
  "sourced",
  "shortlisted",
  "contacted",
  "responded",
  "screening",
  "assessment",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_META: Record<
  PipelineStage,
  { label: string; color: string; description: string }
> = {
  sourced: { label: "Sourced", color: "#64748b", description: "Newly found candidate" },
  shortlisted: { label: "Shortlisted", color: "#6366f1", description: "Marked for review" },
  contacted: { label: "Contacted", color: "#0ea5e9", description: "Outreach sent" },
  responded: { label: "Responded", color: "#06b6d4", description: "Candidate replied" },
  screening: { label: "Screening", color: "#8b5cf6", description: "Initial screen" },
  assessment: { label: "Assessment", color: "#a855f7", description: "Take-home / test" },
  interview: { label: "Interview", color: "#f59e0b", description: "Interview stage" },
  offer: { label: "Offer", color: "#10b981", description: "Offer extended" },
  hired: { label: "Hired", color: "#22c55e", description: "Accepted offer" },
  rejected: { label: "Rejected", color: "#ef4444", description: "Not moving forward" },
};

// ---------------------------------------------------------------------------
// Jobs, shortlists, notes, pipeline events (app entities)
// ---------------------------------------------------------------------------

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  country?: string;
  city?: string;
  remotePreference?: RemotePreference;
  seniority?: Seniority;
  requiredSkills: string[];
  optionalSkills: string[];
  minYearsOfExperience?: number;
  description?: string;
  status: "open" | "on_hold" | "closed";
  createdAt: string;
}

export interface ShortlistEntry {
  candidate: CandidateProfile;
  score?: number;
  jobId?: string;
  addedAt: string;
}

export interface PipelineEntry {
  candidate: CandidateProfile;
  stage: PipelineStage;
  jobId?: string;
  score?: number;
  updatedAt: string;
}

export interface CandidateNote {
  id: string;
  candidateId: string;
  body: string;
  createdAt: string;
}

export interface PipelineEvent {
  id: string;
  candidateId: string;
  fromStage?: PipelineStage;
  toStage: PipelineStage;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: CandidateSearchFilters;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  filters: CandidateSearchFilters;
  resultCount: number;
  provider: ProviderId;
  ranAt: string;
}

// ---------------------------------------------------------------------------
// API usage tracking
// ---------------------------------------------------------------------------

export interface ProviderApiRequest {
  id: string;
  provider: ProviderId;
  endpoint: string;
  requestDate: string;
  returnedRecords: number;
  httpStatus: number;
  responseTimeMs: number;
  estimatedCredits: number;
  errorMessage?: string;
}
