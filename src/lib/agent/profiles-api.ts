import type { ProfileWithMission } from "./services/mission-profiles";

/** Client-safe fetch — same data as listProfilesFn, via REST (avoids server-fn DB path issues). */
export async function fetchSavedProfiles(): Promise<ProfileWithMission[]> {
  const res = await fetch("/api/agent/profiles", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load profiles (${res.status})`);
  }
  const body = (await res.json()) as { profiles?: ProfileWithMission[] };
  return body.profiles ?? [];
}
