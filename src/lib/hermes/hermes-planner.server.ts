// ---------------------------------------------------------------------------
// Hermes Engine — DeepSeek mission planner (server-only).
// Uses the same DEEPSEEK_API_KEY as branch map and automation.
// ---------------------------------------------------------------------------

import { extractJsonObject } from "@/lib/recruiting/linkedin/deepseek-json";
import { getDeepSeekApiKey } from "@/lib/recruiting/linkedin/deepseek-env.server";
import { classifyToolRisk } from "@/lib/agent/risk";
import { isLinkedInOutreachEnabled } from "@/lib/agent/linkedin/safety";
import type { AgentPlan, AgentPlanStep } from "@/lib/agent/types";
import { buildHermesAutomationPrompt, kindLabel } from "./prompt-builder";
import type { HermesMissionKind, HermesMissionConfig } from "./types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const SYSTEM_PROMPT = `You are Hermes, Alyson's LinkedIn browser automation planner.
Return JSON only:
{
  "summary": "One sentence mission summary",
  "prompt": "Full natural-language instructions for the executor (include audience, count, URLs, templates)",
  "steps": [
    {
      "id": "step-1",
      "action": "browser.launch",
      "description": "Launch Alyson Chrome profile",
      "tool": "browser.launch",
      "args": {},
      "riskLevel": "low",
      "requiresApproval": false
    }
  ]
}

Rules:
- ONE browser/LinkedIn tool per step. Max 20 steps for multi-profile missions.
- Available tools: browser.launch, browser.navigate, browser.click, browser.type, browser.extract, browser.screenshot, browser.wait,
  linkedin.check_login, linkedin.search_people, linkedin.extract_search_profiles, linkedin.open_profile, linkedin.extract_profile, linkedin.check_connection,
  linkedin.connect_from_search, linkedin.send_connection_request, linkedin.send_message, linkedin.create_reply_draft, linkedin.read_inbox
- Connect missions: linkedin.extract_search_profiles FIRST (saves real people), then linkedin.send_connection_request per profile with profileIndex.
- Always start with browser.launch then linkedin.check_login or navigate to LinkedIn.
- If searchUrl is provided, browser.navigate to it instead of linkedin.search_people.
- For each profile (repeat per count): open_profile or navigate → extract_profile → connection/message step.
- In DRAFT mode: use linkedin.send_connection_request and linkedin.send_message with args.approved=false (never set approved=true).
- In LIVE mode: set requiresApproval=true on send steps; args.approved stays false until user approves in CRM.
- Never invent profile URLs — extract from search results or use provided searchUrl flow.
- Personalize messages using {{name}}, {{company}}, {{title}} placeholders in args.message when templating.`;

export interface HermesPlanInput {
  name: string;
  kind: HermesMissionKind;
  config: HermesMissionConfig;
}

export interface HermesPlanResult {
  prompt: string;
  plan: AgentPlan;
  source: "deepseek" | "heuristic";
}

async function callDeepSeekHermes(
  apiKey: string,
  input: HermesPlanInput
): Promise<{ summary?: string; prompt?: string; steps?: AgentPlanStep[] }> {
  const outreachEnabled = isLinkedInOutreachEnabled();
  const userPayload = {
    missionName: input.name,
    missionKind: input.kind,
    missionKindLabel: kindLabel(input.kind),
    audience: input.config.audience,
    profileCount: input.config.count,
    searchUrl: input.config.searchUrl ?? null,
    connectionNote: input.config.connectionNote ?? null,
    messageTemplate: input.config.messageTemplate ?? null,
    outreachMode: outreachEnabled ? "live_with_approval" : "draft_only",
    safetyNote:
      "Draft-only: prepare connection/message drafts; do not submit sends unless outreachMode is live_with_approval and user approves.",
  };

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload, null, 2) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DeepSeek failed (${res.status})${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");

  return extractJsonObject(content) as {
    summary?: string;
    prompt?: string;
    steps?: AgentPlanStep[];
  };
}

function normalizeSteps(steps: AgentPlanStep[] | undefined): AgentPlanStep[] {
  return (steps ?? []).map((s, i) => {
    const tool = s.tool ?? s.action ?? "browser.screenshot";
    const risk = s.riskLevel ?? classifyToolRisk(tool, { linkedin: tool.startsWith("linkedin.") });
    return {
      id: s.id ?? `step-${i + 1}`,
      action: s.action ?? tool,
      description: s.description ?? s.action ?? `Step ${i + 1}`,
      tool,
      args: s.args ?? {},
      riskLevel: risk,
      requiresApproval:
        s.requiresApproval ?? (risk !== "low" || tool.includes("send_")),
    };
  });
}

function buildHeuristicHermesPlan(input: HermesPlanInput): HermesPlanResult {
  const { name, kind, config } = input;
  const count = Math.max(1, Math.min(config.count, 25));
  const prompt = buildHermesAutomationPrompt({ name, kind, config });
  const steps: AgentPlanStep[] = [
    {
      id: "step-1",
      action: "browser.launch",
      description: "Launch Alyson Chrome profile",
      tool: "browser.launch",
      args: {},
      riskLevel: "low",
      requiresApproval: false,
    },
    {
      id: "step-2",
      action: "linkedin.check_login",
      description: "Verify LinkedIn login",
      tool: "linkedin.check_login",
      args: {},
      riskLevel: "low",
      requiresApproval: false,
    },
  ];

  if (config.searchUrl?.trim()) {
    steps.push({
      id: "step-3",
      action: "linkedin.extract_search_profiles",
      description: `Extract profiles from branch search (${count})`,
      tool: "linkedin.extract_search_profiles",
      args: {
        searchUrl: config.searchUrl.trim(),
        query: config.audience,
        limit: count,
      },
      riskLevel: "low",
      requiresApproval: false,
    });
  } else {
    steps.push({
      id: "step-3",
      action: "linkedin.extract_search_profiles",
      description: `Extract profiles: ${config.audience}`,
      tool: "linkedin.extract_search_profiles",
      args: { query: config.audience, limit: count },
      riskLevel: "low",
      requiresApproval: false,
    });
  }

  for (let i = 0; i < count; i++) {
    const n = i + 1;
    if (kind === "connect" || kind === "connect_and_message") {
      steps.push({
        id: `step-${steps.length + 1}`,
        action: "linkedin.send_connection_request",
        description: `Send connection ${n} of ${count} (approve to send)`,
        tool: "linkedin.send_connection_request",
        args: {
          profileIndex: i,
          approved: false,
          message: config.connectionNote ?? "",
        },
        riskLevel: "high",
        requiresApproval: true,
      });
      // Safety: only send 1 live connection per mission even when extracting more profiles.
      break;
    }

    steps.push(
      {
        id: `step-${steps.length + 1}`,
        action: "linkedin.extract_profile",
        description: `Extract profile ${n} of ${count}`,
        tool: "linkedin.extract_profile",
        args: { profileIndex: i },
        riskLevel: "low",
        requiresApproval: false,
      },
      {
        id: `step-${steps.length + 2}`,
        action: "browser.screenshot",
        description: `Capture profile ${n} for review`,
        tool: "browser.screenshot",
        args: {},
        riskLevel: "low",
        requiresApproval: false,
      }
    );

    if (kind === "message") {
      steps.push({
        id: `step-${steps.length + 1}`,
        action: "linkedin.send_message",
        description: `Prepare message ${n} (draft)`,
        tool: "linkedin.send_message",
        args: {
          approved: false,
          message:
            config.messageTemplate ??
            "Hi {{name}}, I noticed your work at {{company}} and would love to connect.",
        },
        riskLevel: "high",
        requiresApproval: true,
      });
    }
  }

  return {
    prompt,
    plan: {
      summary: `${kindLabel(kind)} — ${config.audience} (${count} profiles)`,
      steps: steps.slice(0, 20),
    },
    source: "heuristic",
  };
}

/** Plan a Hermes mission — connect missions always use the reliable two-phase plan. */
export async function planHermesMission(input: HermesPlanInput): Promise<HermesPlanResult> {
  const connectKinds: HermesMissionKind[] = ["connect", "connect_and_message"];
  if (connectKinds.includes(input.kind)) {
    return buildHeuristicHermesPlan(input);
  }

  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    return buildHeuristicHermesPlan(input);
  }

  try {
    const parsed = await callDeepSeekHermes(apiKey, input);
    const steps = normalizeSteps(parsed.steps);
    if (steps.length < 2) {
      console.warn("[hermes-planner] DeepSeek returned too few steps; using heuristic fallback.");
      return buildHeuristicHermesPlan(input);
    }

    const fallbackPrompt = buildHermesAutomationPrompt(input);
    return {
      prompt: parsed.prompt?.trim() || fallbackPrompt,
      plan: {
        summary: parsed.summary ?? `${input.name} — ${kindLabel(input.kind)}`,
        steps,
      },
      source: "deepseek",
    };
  } catch (err) {
    console.error("[hermes-planner] DeepSeek planning failed:", err);
    throw new Error(
      err instanceof Error
        ? `Hermes DeepSeek planner failed: ${err.message}`
        : "Hermes DeepSeek planner failed"
    );
  }
}

export function isHermesDeepSeekConfigured(): boolean {
  return Boolean(getDeepSeekApiKey());
}
