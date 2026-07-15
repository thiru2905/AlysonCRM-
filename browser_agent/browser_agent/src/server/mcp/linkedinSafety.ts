/** LinkedIn safety — approve-to-send + optional global outreach. */

const OUTREACH_ENABLED =
  process.env.LINKEDIN_OUTREACH_ENABLED?.trim().toLowerCase() === "true";

const SEND_ON_APPROVE =
  process.env.LINKEDIN_SEND_ON_APPROVE?.trim().toLowerCase() !== "false";

const MAX_PER_DAY = Number(process.env.LINKEDIN_MAX_CONNECTIONS_PER_DAY ?? "10");

const BLOCKED = new Set([
  "linkedin.send_connection_request",
  "linkedin.send_message",
]);

export function isLinkedInOutreachEnabled(): boolean {
  return OUTREACH_ENABLED || SEND_ON_APPROVE;
}

export function assertLinkedInToolAllowed(tool: string, approved = false): void {
  if (!BLOCKED.has(tool)) return;

  if (approved && SEND_ON_APPROVE) {
    return;
  }

  if (!OUTREACH_ENABLED && !SEND_ON_APPROVE) {
    throw new Error(
      "LinkedIn outreach is disabled. Set LINKEDIN_SEND_ON_APPROVE=true and approve each request in Hermes."
    );
  }

  if (!OUTREACH_ENABLED && !approved) {
    throw new Error(
      "Approve this connection in Hermes to send with human-paced timing."
    );
  }
}

export function getMaxConnectionsPerDay(): number {
  return Number.isFinite(MAX_PER_DAY) && MAX_PER_DAY > 0 ? MAX_PER_DAY : 10;
}
