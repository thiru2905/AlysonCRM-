// ---------------------------------------------------------------------------
// Bulk college list parsing — shared helpers (client + server).
// ---------------------------------------------------------------------------

import { dedupe, normalizeTerm } from "./query-builder";

export const MAX_BULK_COLLEGE_INPUT_CHARS = 12_000;
export const MAX_BULK_COLLEGE_COUNT = 100;

export interface ParseCollegesResult {
  colleges: string[];
  source: "ai" | "heuristic";
}

/** Fast local split when AI is unavailable or as a sanity fallback. */
export function parseCollegesHeuristic(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks = normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/[,;|•]/))
    .map((part) => part.replace(/^\s*[-–—*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter((part) => part.length >= 2);

  return dedupe(chunks).slice(0, MAX_BULK_COLLEGE_COUNT);
}

export function mergeCollegeLists(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map(normalizeTerm));
  const out = [...existing];
  for (const college of incoming) {
    const trimmed = college.trim();
    const key = normalizeTerm(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function normalizeCollegeList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    const key = normalizeTerm(trimmed);
    if (!trimmed || trimmed.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.slice(0, MAX_BULK_COLLEGE_COUNT);
}
