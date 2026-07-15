/** Drop manual test rows and non-LinkedIn placeholders from UI lists. */

const TEST_NAME_RE =
  /^(direct test|test user|sample engineer|linkedin prospect|unknown)$/i;

const TEST_URL_RE =
  /sample-engineer|\/in\/me\b|\/in\/test\b|example\.com|localhost/i;

export function isTestProspect(input: {
  name: string;
  profileUrl: string;
}): boolean {
  const name = input.name.trim();
  const url = input.profileUrl.trim();
  if (!name || !url) return true;
  if (TEST_NAME_RE.test(name)) return true;
  if (!url.includes("linkedin.com/in/")) return true;
  if (TEST_URL_RE.test(url)) return true;
  return false;
}

export function isHermesProspect(metadata_json: string | null | undefined): boolean {
  if (!metadata_json) return false;
  try {
    const meta = JSON.parse(metadata_json) as Record<string, unknown>;
    return meta.source === "hermes" || Boolean(meta.runId) || Boolean(meta.missionId);
  } catch {
    return false;
  }
}

/** Profiles worth showing in Saved profiles / outreach monitoring. */
export function isDisplayableProspect(input: {
  name: string;
  profileUrl: string;
  status: string;
  metadata_json?: string | null;
  missionId?: string | null;
  missionName?: string | null;
}): boolean {
  if (isTestProspect(input)) return false;
  if (input.missionId || input.missionName) return true;
  if (isHermesProspect(input.metadata_json)) return true;
  if (input.status !== "new") return true;
  return false;
}
