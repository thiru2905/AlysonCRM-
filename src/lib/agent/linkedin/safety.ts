/**
 * LinkedIn automation safety guardrails.
 * Outreach actions are DISABLED by default — LinkedIn actively restricts automated accounts.
 */

const OUTREACH_ENABLED =
  process.env.LINKEDIN_OUTREACH_ENABLED?.trim().toLowerCase() === "true";

const SEND_ON_APPROVE =
  process.env.LINKEDIN_SEND_ON_APPROVE?.trim().toLowerCase() !== "false";

const MAX_CONNECTIONS_PER_DAY = Number(process.env.LINKEDIN_MAX_CONNECTIONS_PER_DAY ?? "10");

const BLOCKED_TOOLS = new Set([
  "linkedin.send_connection_request",
  "linkedin.send_message",
]);

export function isLinkedInOutreachEnabled(): boolean {
  return OUTREACH_ENABLED || SEND_ON_APPROVE;
}

export function assertLinkedInToolAllowed(tool: string, approved = false): void {
  if (!BLOCKED_TOOLS.has(tool)) return;

  if (approved && SEND_ON_APPROVE) return;

  if (!isLinkedInOutreachEnabled()) {
    throw new Error(
      "LinkedIn outreach is disabled. Set LINKEDIN_SEND_ON_APPROVE=true in .env and approve each send in Hermes."
    );
  }

  if (!OUTREACH_ENABLED && !approved) {
    throw new Error("Approve this connection in Hermes to send on LinkedIn.");
  }

  if (OUTREACH_ENABLED && MAX_CONNECTIONS_PER_DAY <= 0) {
    throw new Error(
      "LinkedIn connection limit is 0. Set LINKEDIN_MAX_CONNECTIONS_PER_DAY to a safe value (5–10/day)."
    );
  }
}

export const LINKEDIN_SAFETY_MESSAGE =
  "LinkedIn restricts accounts that automate connection requests. " +
  "Use Alyson for search and drafts only unless you explicitly enable outreach in .env.";

export function getLinkedInSafetyMessage(): string {
  if (isLinkedInOutreachEnabled()) {
    return (
      "Live outreach enabled with human-paced delays between actions. " +
      "Approve each person in Hermes; Chrome sends the invite with randomized timing to mimic manual use. " +
      "Stay within your daily cap."
    );
  }
  return LINKEDIN_SAFETY_MESSAGE;
}
