import { useRuntimeStatus } from "@/lib/runtime/useRuntimeStatus";
import { cn } from "@/lib/utils";
import { Activity, ChevronRight } from "lucide-react";

interface LogEntry {
  at: string;
  kind: "browser" | "ext" | "mcp" | "system";
  message: string;
}

const MOCK_LOGS: LogEntry[] = [
  { at: "09:41:22", kind: "system", message: "Runtime v0.4.2 online · pid 8214" },
  { at: "09:41:23", kind: "ext", message: "Chrome extension paired · profile Default" },
  { at: "09:41:23", kind: "mcp", message: "MCP server listening on 127.0.0.1:8787" },
  { at: "09:42:07", kind: "browser", message: "browser.open_tab · https://app.hubspot.com/…" },
  { at: "09:42:12", kind: "browser", message: "browser.extract · deals[] × 24" },
  { at: "09:42:14", kind: "ext", message: "Context capture · 3 entities resolved" },
  { at: "09:43:01", kind: "mcp", message: "Approval requested · session.auth_handoff (linkedin.com)" },
  { at: "09:43:34", kind: "system", message: "User approved auth handoff · session.auth_handoff" },
  { at: "09:43:41", kind: "browser", message: "browser.screenshot · captured 1280×1800" },
  { at: "09:44:02", kind: "mcp", message: "Task completed · alyson.crm.enrich_lead" },
];

const KIND_STYLES: Record<LogEntry["kind"], string> = {
  system: "text-muted-foreground",
  ext: "text-ai",
  mcp: "text-success",
  browser: "text-foreground",
};

export function RuntimeLogsPanel() {
  const { state } = useRuntimeStatus();
  const connected = state === "connected";

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Runtime activity
        </span>
        <span
          className={cn(
            "ml-auto text-[10px] text-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
            connected ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {connected ? "streaming" : "offline"}
        </span>
      </div>
      {!connected ? (
        <div className="p-6 text-sm text-muted-foreground">
          No activity — install Runtime to see live logs from the extension and
          MCP server.
        </div>
      ) : (
        <ol className="divide-y divide-border/40">
          {MOCK_LOGS.map((l, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_auto_1fr] gap-3 px-4 py-2 items-center"
            >
              <span className="text-mono text-[10px] text-muted-foreground tabular-nums">
                {l.at}
              </span>
              <span
                className={cn(
                  "text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent",
                  KIND_STYLES[l.kind],
                )}
              >
                {l.kind}
              </span>
              <span className="text-xs truncate flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                {l.message}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
