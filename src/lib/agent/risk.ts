import type { RiskLevel } from "./types";

const ALWAYS_APPROVE = new Set([
  "linkedin.send_connection_request",
  "linkedin.connect_from_search",
  "linkedin.send_message",
  "browser.upload",
  "browser.submit",
]);

const MEDIUM_RISK = new Set([
  "browser.type",
  "browser.click",
]);

export function classifyToolRisk(tool: string, context?: { linkedin?: boolean }): RiskLevel {
  const name = tool.toLowerCase();
  if (ALWAYS_APPROVE.has(name) || name.includes("send_") || name.includes("message")) {
    return "critical";
  }
  if (context?.linkedin && (name.includes("click") || name.includes("type"))) {
    return "high";
  }
  if (MEDIUM_RISK.has(name) || name.includes("edit") || name.includes("create")) {
    return "medium";
  }
  return "low";
}

export function requiresApproval(risk: RiskLevel): boolean {
  return risk === "medium" || risk === "high" || risk === "critical";
}

export function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "Automatically allowed";
    case "medium":
      return "Approval required";
    case "high":
      return "Approval required";
    case "critical":
      return "Always requires approval";
  }
}
