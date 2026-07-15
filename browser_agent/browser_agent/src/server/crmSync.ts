const CRM_URL = process.env.ALYSON_CRM_URL?.trim() ?? "http://localhost:3000";

function slimResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const copy = { ...(result as Record<string, unknown>) };
  if (typeof copy.screenshot === "string" && copy.screenshot.length > 0) {
    copy.screenshot = "[captured]";
  }
  return copy;
}

export async function reportToolToCrm(
  runId: string | undefined,
  tool: string,
  args: Record<string, unknown>,
  result: unknown
): Promise<void> {
  if (!runId || !tool.startsWith("linkedin.")) return;

  try {
    const res = await fetch(`${CRM_URL}/api/agent/automation/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId,
        type: "tool.completed",
        payload: {
          runId,
          tool,
          args,
          result: slimResult(result),
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[browser-agent] CRM sync failed (${tool}): ${res.status} ${text.slice(0, 200)}`
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[browser-agent] CRM sync error (${tool}): ${message}`);
  }
}

export async function reportApprovalToCrm(
  runId: string | undefined,
  tool: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!runId || !tool.startsWith("linkedin.")) return;

  try {
    await fetch(`${CRM_URL}/api/agent/automation/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId,
        type: "approval.required",
        payload: {
          runId,
          title: `Review: ${tool}`,
          description: "Review this LinkedIn action before continuing.",
          tool,
          payload: data,
        },
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[browser-agent] CRM approval sync error (${tool}): ${message}`);
  }
}
