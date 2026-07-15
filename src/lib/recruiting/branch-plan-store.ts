import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchBranchPlan } from "./linkedin/branch-types";
import {
  EMPTY_CONFIG,
  type LinkedInSearchConfig,
  type LinkedInTarget,
  type SearchMode,
} from "./linkedin/types";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface BranchPlanSession {
  plan: SearchBranchPlan | null;
  config: LinkedInSearchConfig;
  mode: SearchMode;
  target: LinkedInTarget;
  includeLowSignal: boolean;
  updatedAt: string | null;
}

interface BranchPlanStore extends BranchPlanSession {
  setSession: (input: {
    plan: SearchBranchPlan;
    config: LinkedInSearchConfig;
    mode: SearchMode;
    target: LinkedInTarget;
    includeLowSignal: boolean;
  }) => void;
  clearSession: () => void;
}

const INITIAL: BranchPlanSession = {
  plan: null,
  config: EMPTY_CONFIG,
  mode: "precision",
  target: "people",
  includeLowSignal: false,
  updatedAt: null,
};

export const useBranchPlanStore = create<BranchPlanStore>()(
  persist(
    (set) => ({
      ...INITIAL,
      setSession: (input) =>
        set({
          plan: input.plan,
          config: input.config,
          mode: input.mode,
          target: input.target,
          includeLowSignal: input.includeLowSignal,
          updatedAt: new Date().toISOString(),
        }),
      clearSession: () => set({ ...INITIAL }),
    }),
    {
      name: "alyson-linkedin-branch-plan",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
    }
  )
);
