import type { AgentPlan, AgentPlanStep } from "../types";
import { classifyToolRisk } from "../risk";
import { getDeepSeekApiKey } from "@/lib/recruiting/linkedin/deepseek-env.server";

export interface AgentModelProvider {
  createPlan(prompt: string, context?: Record<string, unknown>): Promise<AgentPlan>;
  chooseAction(
    prompt: string,
    observation: string,
    plan: AgentPlan,
    stepIndex: number
  ): Promise<{ tool: string; args: Record<string, unknown>; rationale: string }>;
  verifyResult(
    prompt: string,
    observation: string,
    lastAction: string
  ): Promise<{ ok: boolean; summary: string; shouldContinue: boolean }>;
  summarizeRun(prompt: string, steps: string[]): Promise<string>;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

export class DeepSeekAgentProvider implements AgentModelProvider {
  constructor(private apiKey: string) {}

  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000,
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
    if (!content) throw new Error("DeepSeek returned empty response");
    return content;
  }

  async createPlan(prompt: string, context?: Record<string, unknown>): Promise<AgentPlan> {
    const system = `You are Alyson, a browser automation planner. Return JSON:
{"summary":"string","steps":[{"id":"step-1","action":"browser.navigate","description":"...","tool":"browser.navigate","args":{},"riskLevel":"low","requiresApproval":false}]}
Rules: ONE browser action per step. Max 12 steps. Use tools: browser.launch, browser.navigate, browser.click, browser.type, browser.extract, browser.screenshot, linkedin.search_people, linkedin.extract_profile.`;
    const raw = await this.chat(system, JSON.stringify({ prompt, context }, null, 2));
    const parsed = extractJson(raw) as {
      summary?: string;
      steps?: AgentPlanStep[];
    };
    const steps = (parsed.steps ?? []).map((s, i) => ({
      id: s.id ?? `step-${i + 1}`,
      action: s.action ?? s.tool ?? "observe",
      description: s.description ?? s.action ?? "Step",
      tool: s.tool,
      args: s.args ?? {},
      riskLevel: s.riskLevel ?? classifyToolRisk(s.tool ?? s.action),
      requiresApproval:
        s.requiresApproval ?? classifyToolRisk(s.tool ?? s.action) !== "low",
    }));
    return { summary: parsed.summary ?? "Automation plan", steps };
  }

  async chooseAction(
    prompt: string,
    observation: string,
    plan: AgentPlan,
    stepIndex: number
  ): Promise<{ tool: string; args: Record<string, unknown>; rationale: string }> {
    const step = plan.steps[stepIndex];
    if (step?.tool) {
      return {
        tool: step.tool,
        args: step.args ?? {},
        rationale: step.description,
      };
    }
    const system = `Choose the next single browser action. Return JSON: {"tool":"browser.navigate","args":{},"rationale":"..."}`;
    const raw = await this.chat(
      system,
      JSON.stringify({ prompt, observation, plan, stepIndex }, null, 2)
    );
    const parsed = extractJson(raw) as {
      tool?: string;
      args?: Record<string, unknown>;
      rationale?: string;
    };
    return {
      tool: parsed.tool ?? "browser.screenshot",
      args: parsed.args ?? {},
      rationale: parsed.rationale ?? "Continue automation",
    };
  }

  async verifyResult(
    prompt: string,
    observation: string,
    lastAction: string
  ): Promise<{ ok: boolean; summary: string; shouldContinue: boolean }> {
    const system = `Verify the last browser action. Return JSON: {"ok":true,"summary":"...","shouldContinue":true}`;
    const raw = await this.chat(
      system,
      JSON.stringify({ prompt, observation, lastAction }, null, 2)
    );
    const parsed = extractJson(raw) as {
      ok?: boolean;
      summary?: string;
      shouldContinue?: boolean;
    };
    return {
      ok: parsed.ok ?? true,
      summary: parsed.summary ?? "Step completed",
      shouldContinue: parsed.shouldContinue ?? true,
    };
  }

  async summarizeRun(prompt: string, steps: string[]): Promise<string> {
    const system = `Summarize the automation run for the user in 2-3 sentences. Return JSON: {"summary":"..."}`;
    const raw = await this.chat(system, JSON.stringify({ prompt, steps }, null, 2));
    const parsed = extractJson(raw) as { summary?: string };
    return parsed.summary ?? "Automation completed.";
  }
}

export function getAgentModelProvider(): AgentModelProvider {
  const apiKey = getDeepSeekApiKey();
  if (apiKey) return new DeepSeekAgentProvider(apiKey);
  return new HeuristicAgentProvider();
}

/** Fallback planner when DEEPSEEK_API_KEY is not set — enables local MVP demos. */
export class HeuristicAgentProvider implements AgentModelProvider {
  async createPlan(prompt: string): Promise<AgentPlan> {
    const lower = prompt.toLowerCase();
    const steps: AgentPlanStep[] = [];
    if (lower.includes("linkedin") || lower.includes("connect")) {
      steps.push(
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
          action: "browser.navigate",
          description: "Open LinkedIn",
          tool: "browser.navigate",
          args: { url: "https://www.linkedin.com" },
          riskLevel: "low",
          requiresApproval: false,
        },
        {
          id: "step-3",
          action: "linkedin.search_people",
          description: "Search for matching profiles",
          tool: "linkedin.search_people",
          args: { query: prompt, limit: 5 },
          riskLevel: "low",
          requiresApproval: false,
        },
        {
          id: "step-4",
          action: "linkedin.create_reply_draft",
          description: "Create outreach draft (you send manually — safer for your account)",
          tool: "linkedin.create_reply_draft",
          args: {},
          riskLevel: "low",
          requiresApproval: false,
        }
      );
    } else {
      steps.push(
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
          action: "browser.navigate",
          description: "Open CRM leads page",
          tool: "browser.navigate",
          args: { url: "http://localhost:3000/crm" },
          riskLevel: "low",
          requiresApproval: false,
        },
        {
          id: "step-3",
          action: "browser.extract",
          description: "Extract today's leads from the page",
          tool: "browser.extract",
          args: { selector: "main" },
          riskLevel: "low",
          requiresApproval: false,
        },
        {
          id: "step-4",
          action: "browser.screenshot",
          description: "Capture screenshot for review",
          tool: "browser.screenshot",
          args: {},
          riskLevel: "low",
          requiresApproval: false,
        }
      );
    }
    return {
      summary: `Execute: ${prompt.slice(0, 80)}`,
      steps,
    };
  }

  async chooseAction(
    _prompt: string,
    _observation: string,
    plan: AgentPlan,
    stepIndex: number
  ) {
    const step = plan.steps[stepIndex];
    return {
      tool: step?.tool ?? "browser.screenshot",
      args: step?.args ?? {},
      rationale: step?.description ?? "Continue",
    };
  }

  async verifyResult() {
    return { ok: true, summary: "Step completed", shouldContinue: true };
  }

  async summarizeRun(prompt: string, steps: string[]) {
    return `Completed "${prompt}" in ${steps.length} steps.`;
  }
}
