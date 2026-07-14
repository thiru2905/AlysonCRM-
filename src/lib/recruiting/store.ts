import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CandidateNote,
  CandidateProfile,
  CandidateSearchFilters,
  Job,
  PipelineStage,
  SavedSearch,
  SearchHistoryItem,
} from "./types";

// ---------------------------------------------------------------------------
// Client-side recruiter workspace state. Persisted to localStorage so the
// module is fully usable without a database. SSR-safe: during server rendering
// there is no localStorage, so persist gets a no-op store and hydrates on the
// client.
// ---------------------------------------------------------------------------

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

interface ShortlistItem {
  candidate: CandidateProfile;
  score?: number;
  jobId?: string;
  addedAt: string;
}

interface PipelineItem {
  candidate: CandidateProfile;
  stage: PipelineStage;
  score?: number;
  jobId?: string;
  updatedAt: string;
}

const MAX_COMPARE = 4;
const MAX_HISTORY = 25;

interface RecruiterState {
  shortlist: Record<string, ShortlistItem>;
  compare: CandidateProfile[];
  pipeline: Record<string, PipelineItem>;
  savedSearches: SavedSearch[];
  history: SearchHistoryItem[];
  jobs: Job[];
  notes: Record<string, CandidateNote[]>;

  // shortlist
  toggleShortlist: (c: CandidateProfile, score?: number) => void;
  isShortlisted: (id: string) => boolean;
  removeShortlist: (id: string) => void;

  // comparison (max 4)
  toggleCompare: (c: CandidateProfile) => void;
  isComparing: (id: string) => boolean;
  clearCompare: () => void;

  // pipeline
  addToPipeline: (c: CandidateProfile, stage: PipelineStage, score?: number) => void;
  moveStage: (id: string, stage: PipelineStage) => void;
  removeFromPipeline: (id: string) => void;

  // saved searches
  saveSearch: (name: string, filters: CandidateSearchFilters) => void;
  deleteSavedSearch: (id: string) => void;

  // history
  addHistory: (item: Omit<SearchHistoryItem, "id" | "ranAt">) => void;
  clearHistory: () => void;

  // jobs
  addJob: (job: Job) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
  deleteJob: (id: string) => void;

  // notes
  addNote: (candidateId: string, body: string) => void;
  deleteNote: (candidateId: string, noteId: string) => void;
}

function id() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_JOBS: Job[] = [
  {
    id: "job-senior-backend",
    title: "Senior Backend Engineer",
    company: "Alyson",
    location: "Remote (US)",
    country: "United States",
    remotePreference: "remote",
    seniority: "senior",
    requiredSkills: ["Node.js", "TypeScript", "PostgreSQL"],
    optionalSkills: ["Kafka", "AWS", "GraphQL"],
    minYearsOfExperience: 5,
    description: "Own core backend services and APIs.",
    status: "open",
    createdAt: new Date(2026, 0, 5).toISOString(),
  },
  {
    id: "job-ai-engineer",
    title: "AI Engineer",
    company: "Alyson",
    location: "San Francisco / Remote",
    country: "United States",
    city: "San Francisco",
    remotePreference: "hybrid",
    seniority: "mid",
    requiredSkills: ["Python", "LLMs", "PyTorch"],
    optionalSkills: ["LangChain", "RAG", "Vector Databases"],
    minYearsOfExperience: 3,
    description: "Build LLM-powered features and evaluation pipelines.",
    status: "open",
    createdAt: new Date(2026, 0, 8).toISOString(),
  },
];

export const useRecruiterStore = create<RecruiterState>()(
  persist(
    (set, get) => ({
      shortlist: {},
      compare: [],
      pipeline: {},
      savedSearches: [],
      history: [],
      jobs: DEFAULT_JOBS,
      notes: {},

      toggleShortlist: (c, score) =>
        set((state) => {
          const next = { ...state.shortlist };
          if (next[c.id]) {
            delete next[c.id];
          } else {
            next[c.id] = { candidate: c, score, addedAt: new Date().toISOString() };
          }
          return { shortlist: next };
        }),
      isShortlisted: (candidateId) => Boolean(get().shortlist[candidateId]),
      removeShortlist: (candidateId) =>
        set((state) => {
          const next = { ...state.shortlist };
          delete next[candidateId];
          return { shortlist: next };
        }),

      toggleCompare: (c) =>
        set((state) => {
          const exists = state.compare.some((x) => x.id === c.id);
          if (exists) {
            return { compare: state.compare.filter((x) => x.id !== c.id) };
          }
          if (state.compare.length >= MAX_COMPARE) return state;
          return { compare: [...state.compare, c] };
        }),
      isComparing: (candidateId) => get().compare.some((x) => x.id === candidateId),
      clearCompare: () => set({ compare: [] }),

      addToPipeline: (c, stage, score) =>
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            [c.id]: {
              candidate: c,
              stage,
              score,
              updatedAt: new Date().toISOString(),
            },
          },
        })),
      moveStage: (candidateId, stage) =>
        set((state) => {
          const item = state.pipeline[candidateId];
          if (!item) return state;
          return {
            pipeline: {
              ...state.pipeline,
              [candidateId]: { ...item, stage, updatedAt: new Date().toISOString() },
            },
          };
        }),
      removeFromPipeline: (candidateId) =>
        set((state) => {
          const next = { ...state.pipeline };
          delete next[candidateId];
          return { pipeline: next };
        }),

      saveSearch: (name, filters) =>
        set((state) => ({
          savedSearches: [
            { id: id(), name, filters, createdAt: new Date().toISOString() },
            ...state.savedSearches,
          ],
        })),
      deleteSavedSearch: (searchId) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== searchId),
        })),

      addHistory: (item) =>
        set((state) => ({
          history: [
            { ...item, id: id(), ranAt: new Date().toISOString() },
            ...state.history,
          ].slice(0, MAX_HISTORY),
        })),
      clearHistory: () => set({ history: [] }),

      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      updateJob: (jobId, patch) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
        })),
      deleteJob: (jobId) =>
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== jobId) })),

      addNote: (candidateId, body) =>
        set((state) => {
          const note: CandidateNote = {
            id: id(),
            candidateId,
            body,
            createdAt: new Date().toISOString(),
          };
          return {
            notes: {
              ...state.notes,
              [candidateId]: [note, ...(state.notes[candidateId] ?? [])],
            },
          };
        }),
      deleteNote: (candidateId, noteId) =>
        set((state) => ({
          notes: {
            ...state.notes,
            [candidateId]: (state.notes[candidateId] ?? []).filter(
              (n) => n.id !== noteId
            ),
          },
        })),
    }),
    {
      name: "alyson-os-recruiter-store",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
    }
  )
);

export const MAX_COMPARE_CANDIDATES = MAX_COMPARE;
