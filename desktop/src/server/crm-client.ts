let resolvedCrmUrl: string | null = null;
let lastReachableCheck = 0;
let lastReachable = false;

export function getCrmUrlCandidates(): string[] {
  return [
    ...new Set(
      [
        process.env.ALYSON_CRM_URL?.trim(),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter(Boolean) as string[]
    ),
  ];
}

export function getConfiguredCrmUrl(): string {
  return process.env.ALYSON_CRM_URL?.trim() ?? "http://localhost:3000";
}

export async function probeCrmUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

/** Pick the first CRM base URL that responds (localhost vs 127.0.0.1). */
export async function resolveCrmUrl(force = false): Promise<string> {
  if (!force && resolvedCrmUrl) return resolvedCrmUrl;

  for (const url of getCrmUrlCandidates()) {
    if (await probeCrmUrl(url)) {
      resolvedCrmUrl = url;
      lastReachable = true;
      lastReachableCheck = Date.now();
      if (url !== getConfiguredCrmUrl()) {
        console.warn(
          `[desktop] CRM reachable at ${url} (configured: ${getConfiguredCrmUrl()}). Using ${url} for automation events.`
        );
      }
      return url;
    }
  }

  resolvedCrmUrl = getConfiguredCrmUrl();
  lastReachable = false;
  lastReachableCheck = Date.now();
  return resolvedCrmUrl;
}

export async function isCrmReachable(): Promise<boolean> {
  if (Date.now() - lastReachableCheck < 10_000) return lastReachable;
  const url = await resolveCrmUrl(true);
  lastReachable = await probeCrmUrl(url);
  lastReachableCheck = Date.now();
  return lastReachable;
}

export async function postCrmEvent(
  type: string,
  payload: Record<string, unknown>,
  slimResult?: (result: Record<string, unknown>) => Record<string, unknown>
): Promise<boolean> {
  const body: Record<string, unknown> = { ...payload };
  if (type === "tool.completed" && body.result && typeof body.result === "object" && slimResult) {
    body.result = slimResult(body.result as Record<string, unknown>);
  }

  const candidates = [await resolveCrmUrl(), ...getCrmUrlCandidates()].filter(
    (url, i, arr) => arr.indexOf(url) === i
  );

  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/agent/automation/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: payload.runId,
          type,
          payload: body,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        resolvedCrmUrl = base;
        lastReachable = true;
        lastReachableCheck = Date.now();
        return true;
      }
      const text = await res.text().catch(() => "");
      console.error(`[desktop] CRM event failed (${type}) @ ${base}: ${res.status} ${text.slice(0, 120)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[desktop] CRM event error (${type}) @ ${base}: ${message}`);
    }
  }

  lastReachable = false;
  lastReachableCheck = Date.now();
  return false;
}
