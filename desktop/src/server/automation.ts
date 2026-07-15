import { classifyToolRisk } from "./risk.js";

interface PlanStep {
  id?: string;
  tool?: string;
  action?: string;
  description?: string;
  args?: Record<string, unknown>;
  requiresApproval?: boolean;
}

interface RunInput {
  runId: string;
  prompt: string;
  plan?: { summary: string; steps: PlanStep[] };
  browserAgentUrl: string;
  crmUrl: string;
  onEvent: (type: string, payload: Record<string, unknown>) => Promise<void>;
}

type SearchProfile = {
  name: string;
  profileUrl: string;
  title?: string;
  company?: string;
};

type RunContext = {
  profiles: SearchProfile[];
  lastProfile: SearchProfile | null;
};

const APPROVAL_POLL_MS = 2000;
const APPROVAL_TIMEOUT_MS = 10 * 60 * 1000;

async function callBrowserTool(
  browserAgentUrl: string,
  tool: string,
  args: Record<string, unknown>
) {
  const invoke = async () => {
    const res = await fetch(`${browserAgentUrl}/api/agent/tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, args }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Tool ${tool} failed`);
    }
    return res.json();
  };

  try {
    return await invoke();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/9222|Chrome|MCP|fetch failed|ECONNREFUSED/i.test(message)) throw err;
    await new Promise((r) => setTimeout(r, 1500));
    return invoke();
  }
}

async function waitForApproval(
  crmUrl: string,
  runId: string,
  tool: string,
  profileUrl?: string
): Promise<"approved" | "rejected"> {
  const deadline = Date.now() + APPROVAL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const params = new URLSearchParams({ runId, tool });
    if (profileUrl) params.set("profileUrl", profileUrl);
    const res = await fetch(`${crmUrl}/api/agent/approval/status?${params.toString()}`);
    if (res.ok) {
      const body = (await res.json()) as { status?: string };
      if (body.status === "approved") return "approved";
      if (body.status === "rejected") return "rejected";
    }
    await new Promise((r) => setTimeout(r, APPROVAL_POLL_MS));
  }
  throw new Error(`Approval timed out for ${tool}`);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function absorbToolResult(ctx: RunContext, tool: string, result: Record<string, unknown>): void {
  const data = asRecord(result.data);
  if (
    (tool === "linkedin.extract_search_profiles" || tool === "linkedin.search_people") &&
    Array.isArray(data.profiles)
  ) {
    ctx.profiles = (data.profiles as SearchProfile[]).filter((p) => p.profileUrl);
  }
  const profileUrl = String(data.profileUrl ?? "").trim();
  const name = String(data.name ?? "").trim();
  if (profileUrl && name) {
    ctx.lastProfile = {
      name,
      profileUrl,
      title: data.title ? String(data.title) : undefined,
      company: data.company ? String(data.company) : undefined,
    };
  }
}

function resolveStepArgs(args: Record<string, unknown>, ctx: RunContext): Record<string, unknown> {
  const resolved = { ...args };
  const profileIndex =
    resolved.profileIndex !== undefined ? Number(resolved.profileIndex) : undefined;

  if (profileIndex !== undefined && !Number.isNaN(profileIndex) && ctx.profiles[profileIndex]) {
    const profile = ctx.profiles[profileIndex];
    resolved.profileUrl = profile.profileUrl;
    resolved.name = resolved.name ?? profile.name;
    resolved.title = resolved.title ?? profile.title;
    resolved.company = resolved.company ?? profile.company;
  } else if (!resolved.profileUrl && ctx.lastProfile?.profileUrl) {
    resolved.profileUrl = ctx.lastProfile.profileUrl;
    resolved.name = resolved.name ?? ctx.lastProfile.name;
    resolved.title = resolved.title ?? ctx.lastProfile.title;
    resolved.company = resolved.company ?? ctx.lastProfile.company;
  }

  return resolved;
}

export async function runAutomation(input: RunInput): Promise<void> {
  const { runId, prompt, plan, browserAgentUrl, crmUrl, onEvent } = input;
  await onEvent("automation.started", { runId, prompt });

  const steps =
    plan?.steps?.length
      ? plan.steps
      : [
          { id: "step-1", tool: "browser.launch", description: "Launch browser" },
          {
            id: "step-2",
            tool: "browser.navigate",
            args: { url: "https://www.linkedin.com" },
            description: "Open LinkedIn",
          },
        ];

  const summaries: string[] = [];
  const ctx: RunContext = { profiles: [], lastProfile: null };

  try {
    for (const step of steps) {
      const tool = step.tool ?? step.action ?? "browser.screenshot";
      const stepId = step.id ?? tool;
      await onEvent("automation.step.started", { runId, stepId, action: step.description ?? tool });

      const risk = classifyToolRisk(tool);
      const needsApproval =
        (step.requiresApproval ?? false) || risk === "high" || risk === "critical";

      let args = resolveStepArgs({ ...(step.args ?? {}), runId }, ctx);
      let result = await callBrowserTool(browserAgentUrl, tool, args);
      absorbToolResult(ctx, tool, result);

      if (result.status === "error") {
        const errMsg = String(result.error ?? `${tool} failed`);
        summaries.push(`${tool}: error`);
        await onEvent("tool.completed", { runId, tool, args, result });
        await onEvent("automation.step.completed", { runId, stepId, result });
        throw new Error(errMsg);
      }

      if (result.status === "pending_approval") {
        const payload = (result.data ?? {}) as Record<string, unknown>;
        const profileUrl = String(payload.profileUrl ?? args.profileUrl ?? "");

        await onEvent("tool.completed", { runId, tool, args, result });

        await onEvent("approval.required", {
          runId,
          title: step.description ?? `Approve: ${tool}`,
          description: profileUrl
            ? `Send connection request to ${payload.name ?? profileUrl}?`
            : "Review this action before Alyson continues.",
          tool,
          payload: result.data ?? args,
        });

        const decision = await waitForApproval(crmUrl, runId, tool, profileUrl || undefined);
        if (decision === "rejected") {
          summaries.push(`${tool}: rejected by user`);
          await onEvent("automation.step.completed", {
            runId,
            stepId,
            result: { status: "rejected", tool },
          });
          continue;
        }

        args = resolveStepArgs(
          {
            ...args,
            ...payload,
            approved: true,
            profileUrl: profileUrl || payload.profileUrl,
            message: payload.message ?? args.message ?? args.connectionNote,
          },
          ctx
        );

        result = await callBrowserTool(browserAgentUrl, tool, args);
        absorbToolResult(ctx, tool, result);
      } else if (needsApproval && tool.includes("send_")) {
        summaries.push(`${tool}: skipped (expected approval flow)`);
        await onEvent("automation.step.completed", { runId, stepId, result });
        continue;
      }

      summaries.push(`${tool}: ${result.status ?? "done"}`);
      await onEvent("tool.completed", { runId, tool, args, result });
      await onEvent("automation.step.completed", { runId, stepId, result });
    }

    const summary = summaries.join("; ") || `Completed: ${prompt}`;
    await onEvent("automation.completed", { runId, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await onEvent("automation.failed", { runId, error: message });
  }
}
