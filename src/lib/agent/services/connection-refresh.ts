import { getAgentDb } from "../db/client";
import { updateProspectLinkedInConnectionState } from "./browser-workers";

const BROWSER_AGENT_URL =
  process.env.ALYSON_BROWSER_AGENT_URL?.trim() ?? "http://127.0.0.1:8820";

async function checkProfileOnLinkedIn(profileUrl: string): Promise<{
  status: string;
  name?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${BROWSER_AGENT_URL}/api/agent/tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "linkedin.check_connection",
        args: { profileUrl },
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { status: "unknown", error: text || res.statusText };
    }
    const body = (await res.json()) as {
      status?: string;
      data?: { status?: string; name?: string };
      error?: string;
    };
    return {
      status: body.data?.status ?? body.status ?? "unknown",
      name: body.data?.name,
      error: body.error,
    };
  } catch (err) {
    return {
      status: "unknown",
      error: err instanceof Error ? err.message : "Browser agent unavailable",
    };
  }
}

/** Re-check LinkedIn for sent invites — updates accepted vs pending in CRM. */
export async function refreshHermesConnectionStatuses(limit = 12): Promise<{
  checked: number;
  accepted: number;
  stillPending: number;
  errors: string[];
}> {
  const db = getAgentDb();
  const rows = db
    .prepare(
      `SELECT profile_url as profileUrl, name
       FROM linkedin_prospects
       WHERE json_extract(metadata_json, '$.source') = 'hermes'
         AND status IN ('connection_sent', 'invite_pending', 'connected')
       ORDER BY COALESCE(last_action_at, created_at) DESC
       LIMIT ?`
    )
    .all(limit) as Array<{ profileUrl: string; name: string }>;

  let accepted = 0;
  let stillPending = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const result = await checkProfileOnLinkedIn(row.profileUrl);
    if (result.error) {
      errors.push(`${row.name}: ${result.error}`);
      continue;
    }

    const state =
      result.status === "connected"
        ? "connected"
        : result.status === "pending"
          ? "pending"
          : result.status === "none"
            ? "none"
            : "unknown";

    updateProspectLinkedInConnectionState({
      profileUrl: row.profileUrl,
      linkedinState: state,
      name: result.name ?? row.name,
    });

    if (state === "connected") accepted += 1;
    else if (state === "pending") stillPending += 1;
  }

  return { checked: rows.length, accepted, stillPending, errors };
}
