/** User-facing connection invite lifecycle for Hermes / Browser Workers. */

export type InviteStatus =
  | "not_sent"
  | "draft"
  | "awaiting_approval"
  | "sent_pending"
  | "accepted"
  | "unknown";

export function inviteStatusFromProspect(status: string): InviteStatus {
  switch (status) {
    case "pending_approval":
      return "awaiting_approval";
    case "draft_saved":
      return "draft";
    case "connection_sent":
    case "invite_pending":
      return "sent_pending";
    case "connected":
      return "accepted";
    case "new":
      return "not_sent";
    default:
      return "unknown";
  }
}

export function inviteStatusLabel(status: InviteStatus): string {
  switch (status) {
    case "not_sent":
      return "Not sent";
    case "draft":
      return "Draft only";
    case "awaiting_approval":
      return "Awaiting your approval";
    case "sent_pending":
      return "Sent — awaiting accept";
    case "accepted":
      return "Accepted";
    case "unknown":
      return "Unknown";
  }
}

export function inviteStatusTone(status: InviteStatus): string {
  switch (status) {
    case "accepted":
      return "bg-emerald-600 text-white";
    case "sent_pending":
      return "bg-blue-600 text-white";
    case "awaiting_approval":
      return "bg-amber-500 text-white";
    case "draft":
      return "bg-muted text-foreground";
    case "not_sent":
      return "bg-muted text-foreground";
    default:
      return "bg-muted text-foreground";
  }
}

export function requestWasSent(inviteStatus: InviteStatus): boolean {
  return inviteStatus === "sent_pending" || inviteStatus === "accepted";
}
