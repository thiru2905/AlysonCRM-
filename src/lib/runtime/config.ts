import {
  Chrome,
  Cpu,
  Eye,
  Fingerprint,
  Hand,
  KeyRound,
  Lock,
  MousePointerClick,
  ScanText,
  ShieldCheck,
  Terminal,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Local runtime endpoint that the .exe / .dmg installer exposes.
 * The web app pings this to detect a paired install.
 */
export const RUNTIME_HEALTH_URL = "http://127.0.0.1:8787/alyson/health";
export const RUNTIME_POLL_MS = 15_000;

export type RuntimeOs = "windows" | "macos" | "linux" | "unknown";

export interface RuntimeDownload {
  os: RuntimeOs;
  label: string;
  filename: string;
  sizeMb: number;
  url: string;
}

/** Download URLs are placeholders until the installer ships. */
export const RUNTIME_DOWNLOADS: RuntimeDownload[] = [
  {
    os: "windows",
    label: "Windows 10 / 11",
    filename: "AlysonRuntime-Setup.exe",
    sizeMb: 84.2,
    url: "https://downloads.alyson.dev/runtime/latest/AlysonRuntime-Setup.exe",
  },
  {
    os: "macos",
    label: "macOS 13+ (Apple Silicon & Intel)",
    filename: "AlysonRuntime.dmg",
    sizeMb: 92.6,
    url: "https://downloads.alyson.dev/runtime/latest/AlysonRuntime.dmg",
  },
];

export const RUNTIME_VERSION = "0.4.2";

export interface Capability {
  icon: LucideIcon;
  label: string;
  desc: string;
}

/** What the local runtime does, framed for the "co-worker" narrative. */
export const RUNTIME_PILLARS: Capability[] = [
  {
    icon: Eye,
    label: "See what you see",
    desc: "The extension observes the pages you visit and quietly harvests the context Alyson needs to reason.",
  },
  {
    icon: Hand,
    label: "Act in your browser",
    desc: "An MCP server drives Chrome to click, type, and extract — with your permission and your session.",
  },
  {
    icon: Lock,
    label: "Local, on your terms",
    desc: "Runs on your machine, under your account. Nothing leaves without you saying so.",
  },
];

export const RUNTIME_EXTENSION_CAPS: Capability[] = [
  {
    icon: ScanText,
    label: "Page context capture",
    desc: "Snapshots of the DOM you're looking at, distilled to structured facts.",
  },
  {
    icon: Fingerprint,
    label: "Entity resolution",
    desc: "Matches people, companies, and deals on the page to entities in Alyson.",
  },
  {
    icon: Zap,
    label: "In-page actions",
    desc: "Suggests one-click tasks (log a call, add note, draft a reply) inline.",
  },
  {
    icon: ShieldCheck,
    label: "Per-site permissions",
    desc: "You control which domains the extension is allowed to touch.",
  },
];

export interface McpTool {
  name: string;
  desc: string;
}

/** Tool surface the local MCP server exposes to Alyson workers. */
export const RUNTIME_MCP_TOOLS: McpTool[] = [
  { name: "browser.open_tab", desc: "Open a URL in a new Chrome tab." },
  { name: "browser.click", desc: "Click an element by selector or accessible name." },
  { name: "browser.type", desc: "Type text into an input, respecting IME." },
  { name: "browser.extract", desc: "Extract structured data from the current page." },
  { name: "browser.screenshot", desc: "Full-page or element screenshot for review." },
  { name: "browser.wait_for", desc: "Wait for a selector, network idle, or condition." },
  { name: "session.auth_handoff", desc: "Pause and ask you to sign in when a wall appears." },
  { name: "fs.download", desc: "Save a file to your Downloads folder." },
];

export const RUNTIME_MCP_ENDPOINT = "http://127.0.0.1:8787/mcp";

/** Best-effort OS sniff for highlighting the right download. */
export function detectOs(): RuntimeOs {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform ?? "").toLowerCase();
  if (ua.includes("windows") || platform.includes("win")) return "windows";
  if (
    ua.includes("mac os") ||
    ua.includes("macintosh") ||
    platform.includes("mac")
  )
    return "macos";
  if (ua.includes("linux") || platform.includes("linux")) return "linux";
  return "unknown";
}

/** Icons used across runtime panels — re-exported for convenience. */
export const RuntimeIcons = {
  Chrome,
  Cpu,
  KeyRound,
  MousePointerClick,
  Terminal,
};
