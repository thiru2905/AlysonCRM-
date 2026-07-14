// Browser Workers — the fleet of desktop instances that consume tasks
// from Alyson OS. State always lives in the cloud; this is what the
// operator sees.

export type SessionStatus = "active" | "idle" | "paused" | "offline" | "error";
export type TaskStatus =
  | "queued"
  | "running"
  | "waiting_auth"
  | "succeeded"
  | "failed"
  | "recovered";

export type ActionKind =
  | "navigate"
  | "click"
  | "type"
  | "scroll"
  | "download"
  | "upload"
  | "ocr"
  | "screenshot"
  | "clipboard"
  | "extract"
  | "auth"
  | "cookie";

export interface BrowserSession {
  id: string;
  label: string; // "Maya's Mac", "Ops runner #3"
  host: string; // hostname
  os: "macOS" | "Windows" | "Linux";
  browser: "Chrome" | "Arc" | "Edge" | "Brave";
  extensionVersion: string;
  status: SessionStatus;
  lastHeartbeat: string; // ISO
  cpuPct: number;
  memMb: number;
  cookiesCount: number;
  activeTaskId?: string;
  queuedCount: number;
  ownerId: string; // person who owns the runner
  region: string;
}

export interface BrowserTask {
  id: string;
  title: string;
  status: TaskStatus;
  sessionId?: string;
  projectId?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  progress: number; // 0..1
  attempts: number;
  eta?: string;
  needsHuman?: string; // reason if waiting_auth
}

export interface Action {
  id: string;
  taskId: string;
  at: string;
  kind: ActionKind;
  target: string; // URL or DOM label
  ok: boolean;
  recovered?: boolean;
  screenshotUrl?: string;
  note?: string;
}

export interface Download {
  id: string;
  taskId: string;
  filename: string;
  sizeMb: number;
  at: string;
  fromUrl: string;
}

export interface Failure {
  id: string;
  taskId: string;
  at: string;
  reason: string;
  recovered: boolean;
  recovery?: string;
}

// --------------------------------------------------------------------
// Capabilities matrix
// --------------------------------------------------------------------

export const CAPABILITIES = [
  { key: "sessions", label: "Browser sessions", desc: "Persistent, per-user profiles." },
  { key: "extension", label: "Chrome extension", desc: "Injected controller & event bridge." },
  { key: "downloads", label: "Downloads", desc: "Streamed back to Alyson storage." },
  { key: "uploads", label: "Uploads", desc: "Files pushed into remote flows." },
  { key: "ocr", label: "OCR", desc: "Screen text extraction on demand." },
  { key: "screen", label: "Screen understanding", desc: "Layout & element reasoning." },
  { key: "keyboard", label: "Keyboard", desc: "Typing, shortcuts, IME support." },
  { key: "mouse", label: "Mouse", desc: "Click, hover, drag, wheel." },
  { key: "clipboard", label: "Clipboard", desc: "Copy in / paste out." },
  { key: "auth", label: "Authentication", desc: "Hand-off to human when required." },
  { key: "cookies", label: "Cookies", desc: "Scoped, encrypted at rest." },
  { key: "recovery", label: "Recovered actions", desc: "Retry with alternate selectors." },
] as const;

// --------------------------------------------------------------------
// Seed data
// --------------------------------------------------------------------

export const SESSIONS: BrowserSession[] = [
  {
    id: "bs_maya_mac",
    label: "Maya's Mac",
    host: "maya-mbp.local",
    os: "macOS",
    browser: "Chrome",
    extensionVersion: "2.4.1",
    status: "active",
    lastHeartbeat: "2025-03-22T14:12:18Z",
    cpuPct: 34,
    memMb: 812,
    cookiesCount: 214,
    activeTaskId: "bt_scrape_pricing",
    queuedCount: 3,
    ownerId: "p_maya",
    region: "us-west",
  },
  {
    id: "bs_ops_runner_3",
    label: "Ops runner #3",
    host: "runner-3.ops.alyson",
    os: "Linux",
    browser: "Chrome",
    extensionVersion: "2.4.1",
    status: "active",
    lastHeartbeat: "2025-03-22T14:12:20Z",
    cpuPct: 61,
    memMb: 1240,
    cookiesCount: 87,
    activeTaskId: "bt_fill_forms",
    queuedCount: 5,
    ownerId: "p_dev",
    region: "us-east",
  },
  {
    id: "bs_sara_arc",
    label: "Sara's Arc",
    host: "sara-arc.local",
    os: "macOS",
    browser: "Arc",
    extensionVersion: "2.4.0",
    status: "waiting_auth" as unknown as SessionStatus, // shown as needs attention
    lastHeartbeat: "2025-03-22T14:11:44Z",
    cpuPct: 12,
    memMb: 402,
    cookiesCount: 156,
    activeTaskId: "bt_renewal_portal",
    queuedCount: 1,
    ownerId: "p_sara",
    region: "eu-west",
  },
  {
    id: "bs_ops_runner_7",
    label: "Ops runner #7",
    host: "runner-7.ops.alyson",
    os: "Linux",
    browser: "Chrome",
    extensionVersion: "2.4.1",
    status: "idle",
    lastHeartbeat: "2025-03-22T14:11:59Z",
    cpuPct: 4,
    memMb: 180,
    cookiesCount: 22,
    queuedCount: 0,
    ownerId: "p_dev",
    region: "us-east",
  },
  {
    id: "bs_dev_win",
    label: "Dev's Windows",
    host: "dev-win.local",
    os: "Windows",
    browser: "Edge",
    extensionVersion: "2.4.1",
    status: "error",
    lastHeartbeat: "2025-03-22T13:48:02Z",
    cpuPct: 0,
    memMb: 0,
    cookiesCount: 41,
    queuedCount: 2,
    ownerId: "p_dev",
    region: "us-east",
  },
  {
    id: "bs_ines_brave",
    label: "Inés · Brave",
    host: "ines-brave.local",
    os: "macOS",
    browser: "Brave",
    extensionVersion: "2.4.1",
    status: "offline",
    lastHeartbeat: "2025-03-22T09:02:11Z",
    cpuPct: 0,
    memMb: 0,
    cookiesCount: 63,
    queuedCount: 0,
    ownerId: "p_sara",
    region: "eu-west",
  },
];

export const TASKS: BrowserTask[] = [
  {
    id: "bt_scrape_pricing",
    title: "Scrape Northwind pricing pages",
    status: "running",
    sessionId: "bs_maya_mac",
    projectId: "pr_northwind",
    createdAt: "2025-03-22T14:05:00Z",
    startedAt: "2025-03-22T14:06:20Z",
    progress: 0.62,
    attempts: 1,
    eta: "2m",
  },
  {
    id: "bt_fill_forms",
    title: "Submit vendor onboarding · Meridian",
    status: "running",
    sessionId: "bs_ops_runner_3",
    projectId: "pr_meridian",
    createdAt: "2025-03-22T13:58:00Z",
    startedAt: "2025-03-22T14:01:12Z",
    progress: 0.34,
    attempts: 2,
    eta: "6m",
  },
  {
    id: "bt_renewal_portal",
    title: "Open Halcyon renewal portal (SSO)",
    status: "waiting_auth",
    sessionId: "bs_sara_arc",
    projectId: "pr_halcyon",
    createdAt: "2025-03-22T14:00:00Z",
    startedAt: "2025-03-22T14:00:22Z",
    progress: 0.4,
    attempts: 1,
    needsHuman: "Duo push required for SSO login",
  },
  {
    id: "bt_download_invoices",
    title: "Download Q1 invoices from Stripe",
    status: "queued",
    createdAt: "2025-03-22T14:08:41Z",
    progress: 0,
    attempts: 0,
    eta: "queued",
  },
  {
    id: "bt_screenshot_hero",
    title: "Screenshot competitor hero pages ×12",
    status: "queued",
    createdAt: "2025-03-22T14:09:11Z",
    progress: 0,
    attempts: 0,
    eta: "queued",
  },
  {
    id: "bt_upload_contracts",
    title: "Upload signed contracts to DocuSign",
    status: "recovered",
    sessionId: "bs_ops_runner_3",
    projectId: "pr_northwind",
    createdAt: "2025-03-22T12:14:00Z",
    startedAt: "2025-03-22T12:15:00Z",
    endedAt: "2025-03-22T12:22:41Z",
    progress: 1,
    attempts: 3,
  },
  {
    id: "bt_verify_pricing",
    title: "Verify pricing changes on landing",
    status: "succeeded",
    sessionId: "bs_maya_mac",
    projectId: "pr_meridian",
    createdAt: "2025-03-22T11:41:00Z",
    startedAt: "2025-03-22T11:41:20Z",
    endedAt: "2025-03-22T11:43:04Z",
    progress: 1,
    attempts: 1,
  },
  {
    id: "bt_scrape_reviews",
    title: "Scrape G2 reviews (last 30d)",
    status: "failed",
    sessionId: "bs_dev_win",
    createdAt: "2025-03-22T10:22:00Z",
    startedAt: "2025-03-22T10:22:41Z",
    endedAt: "2025-03-22T10:25:19Z",
    progress: 0.71,
    attempts: 3,
  },
];

export const ACTIONS: Action[] = [
  { id: "a1", taskId: "bt_scrape_pricing", at: "2025-03-22T14:12:11Z", kind: "extract", target: "table.pricing tbody tr", ok: true, screenshotUrl: "shot://price-table" },
  { id: "a2", taskId: "bt_scrape_pricing", at: "2025-03-22T14:12:04Z", kind: "scroll", target: "window · +820px", ok: true },
  { id: "a3", taskId: "bt_scrape_pricing", at: "2025-03-22T14:11:58Z", kind: "click", target: "button[data-tab='enterprise']", ok: true, screenshotUrl: "shot://enterprise-tab" },
  { id: "a4", taskId: "bt_scrape_pricing", at: "2025-03-22T14:11:49Z", kind: "navigate", target: "northwind.co/pricing", ok: true, screenshotUrl: "shot://landing" },
  { id: "a5", taskId: "bt_fill_forms", at: "2025-03-22T14:12:00Z", kind: "type", target: "input#legalName", ok: true },
  { id: "a6", taskId: "bt_fill_forms", at: "2025-03-22T14:11:52Z", kind: "click", target: "button.continue", ok: false, recovered: true, note: "Selector shifted — retried via aria-label" },
  { id: "a7", taskId: "bt_fill_forms", at: "2025-03-22T14:11:48Z", kind: "upload", target: "vendor-w9.pdf → input[type=file]", ok: true },
  { id: "a8", taskId: "bt_renewal_portal", at: "2025-03-22T14:00:44Z", kind: "auth", target: "SSO · waiting Duo push", ok: false, note: "Needs human" },
  { id: "a9", taskId: "bt_verify_pricing", at: "2025-03-22T11:42:50Z", kind: "ocr", target: "hero heading region", ok: true, screenshotUrl: "shot://hero-ocr" },
  { id: "a10", taskId: "bt_verify_pricing", at: "2025-03-22T11:42:20Z", kind: "clipboard", target: "copy → 'Starts at $12/mo'", ok: true },
];

export const DOWNLOADS: Download[] = [
  { id: "d1", taskId: "bt_upload_contracts", filename: "MSA_northwind_signed.pdf", sizeMb: 1.2, at: "2025-03-22T12:22:41Z", fromUrl: "docusign.net/…" },
  { id: "d2", taskId: "bt_scrape_pricing", filename: "pricing_snapshot_2025-03-22.csv", sizeMb: 0.04, at: "2025-03-22T14:12:12Z", fromUrl: "generated://" },
  { id: "d3", taskId: "bt_scrape_reviews", filename: "g2_partial_reviews.json", sizeMb: 0.18, at: "2025-03-22T10:25:00Z", fromUrl: "g2.com/…" },
];

export const FAILURES: Failure[] = [
  {
    id: "f1",
    taskId: "bt_scrape_reviews",
    at: "2025-03-22T10:25:19Z",
    reason: "Cloudflare challenge could not be solved",
    recovered: false,
  },
  {
    id: "f2",
    taskId: "bt_fill_forms",
    at: "2025-03-22T14:11:52Z",
    reason: "Selector .continue not found",
    recovered: true,
    recovery: "Fallback to [aria-label='Continue']",
  },
  {
    id: "f3",
    taskId: "bt_upload_contracts",
    at: "2025-03-22T12:19:03Z",
    reason: "Session timeout — DocuSign SSO expired",
    recovered: true,
    recovery: "Re-auth via cached refresh token",
  },
];

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

export const STATUS_TONE: Record<SessionStatus | TaskStatus, string> = {
  active: "text-success",
  idle: "text-muted-foreground",
  paused: "text-warning",
  offline: "text-muted-foreground",
  error: "text-destructive",
  running: "text-ai",
  queued: "text-muted-foreground",
  waiting_auth: "text-warning",
  succeeded: "text-success",
  failed: "text-destructive",
  recovered: "text-ai",
};

export function tasksForSession(sessionId: string) {
  return TASKS.filter((t) => t.sessionId === sessionId);
}

export function actionsForTask(taskId: string) {
  return ACTIONS.filter((a) => a.taskId === taskId).sort(
    (a, b) => +new Date(b.at) - +new Date(a.at),
  );
}

export function relTime(iso: string): string {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}
