type RiskLevel = "low" | "medium" | "high" | "critical";

const HIGH_RISK = new Set([
  "browser.upload",
  "browser.download",
  "linkedin.send_connection_request",
  "linkedin.connect_from_search",
  "linkedin.send_message",
]);

const CRITICAL = new Set([
  "linkedin.send_message",
]);

export function classifyToolRisk(tool: string): RiskLevel {
  if (CRITICAL.has(tool)) return "critical";
  if (HIGH_RISK.has(tool)) return "high";
  if (tool.startsWith("linkedin.")) return "medium";
  return "low";
}
