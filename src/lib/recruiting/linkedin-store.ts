import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LinkedInSavedSearch } from "./linkedin/types";

// SSR-safe storage: during server rendering there is no localStorage, so we
// hand persist a no-op store and let it hydrate on the client.
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ls_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type NewSearch = Omit<LinkedInSavedSearch, "id" | "createdAt" | "updatedAt">;

interface LinkedInStore {
  linkedinSearches: LinkedInSavedSearch[];
  saveLinkedinSearch: (search: NewSearch) => string;
  updateLinkedinSearch: (
    id: string,
    patch: Partial<Omit<LinkedInSavedSearch, "id" | "createdAt">>
  ) => void;
  deleteLinkedinSearch: (id: string) => void;
  duplicateLinkedinSearch: (id: string) => void;
}

export const useLinkedInStore = create<LinkedInStore>()(
  persist(
    (set, get) => ({
      linkedinSearches: [],

      saveLinkedinSearch: (search) => {
        const id = newId();
        const now = new Date().toISOString();
        const record: LinkedInSavedSearch = {
          ...search,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ linkedinSearches: [record, ...s.linkedinSearches] }));
        return id;
      },

      updateLinkedinSearch: (id, patch) => {
        set((s) => ({
          linkedinSearches: s.linkedinSearches.map((x) =>
            x.id === id
              ? { ...x, ...patch, updatedAt: new Date().toISOString() }
              : x
          ),
        }));
      },

      deleteLinkedinSearch: (id) => {
        set((s) => ({
          linkedinSearches: s.linkedinSearches.filter((x) => x.id !== id),
        }));
      },

      duplicateLinkedinSearch: (id) => {
        const original = get().linkedinSearches.find((x) => x.id === id);
        if (!original) return;
        const now = new Date().toISOString();
        const copy: LinkedInSavedSearch = {
          ...original,
          id: newId(),
          name: `${original.name} (copy)`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ linkedinSearches: [copy, ...s.linkedinSearches] }));
      },
    }),
    {
      name: "alyson-recruiting-linkedin-searches",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
    }
  )
);
