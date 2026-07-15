const STATUS_LABELS: Record<string, string> = {
  new: "New",
  draft_saved: "Draft ready",
  pending_approval: "Awaiting approval",
  connection_sent: "Request sent",
  connected: "Connected",
  pending: "Pending",
  messaged: "Messaged",
  replied: "Replied",
};

export function profileStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function profileStatusTone(status: string): string {
  switch (status) {
    case "connected":
    case "replied":
      return "border-emerald-500/40 text-emerald-700 dark:text-emerald-400";
    case "connection_sent":
    case "messaged":
      return "border-blue-500/40 text-blue-700 dark:text-blue-400";
    case "draft_saved":
    case "pending_approval":
      return "border-amber-500/40 text-amber-700 dark:text-amber-400";
    default:
      return "";
  }
}

export function formatProfileDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}
