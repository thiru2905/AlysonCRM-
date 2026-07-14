import { RUNTIME_MCP_ENDPOINT, RUNTIME_MCP_TOOLS } from "@/lib/runtime/config";
import { useRuntimeStatus } from "@/lib/runtime/useRuntimeStatus";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Copy, Terminal } from "lucide-react";

const CONFIG_SNIPPET = `{
  "mcpServers": {
    "alyson-runtime": {
      "url": "${RUNTIME_MCP_ENDPOINT}",
      "transport": "http"
    }
  }
}`;

export function RuntimeMcpPanel() {
  const { state, version } = useRuntimeStatus();
  const connected = state === "connected";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-ai" />
          <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Local MCP endpoint
          </span>
          <span
            className={cn(
              "ml-auto text-[10px] text-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
              connected ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            {connected ? `Live · v${version ?? "0.4"}` : "Offline"}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 text-mono text-xs px-2.5 py-2 rounded-md bg-muted/40 truncate">
            {RUNTIME_MCP_ENDPOINT}
          </code>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(RUNTIME_MCP_ENDPOINT);
              toast.success("Endpoint copied");
            }}
            className="h-8 w-8 grid place-items-center rounded-md surface-hairline hover:bg-accent"
            aria-label="Copy MCP endpoint"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-5 text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Tools exposed to Alyson · {RUNTIME_MCP_TOOLS.length}
        </div>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {RUNTIME_MCP_TOOLS.map((t) => (
            <li
              key={t.name}
              className="flex items-start gap-2 rounded-md border border-border/40 px-2.5 py-2"
            >
              <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-ai/70 shrink-0" />
              <div className="min-w-0">
                <code className="text-mono text-xs truncate block">{t.name}</code>
                <div className="text-[11px] text-muted-foreground leading-snug">
                  {t.desc}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 h-fit">
        <div className="flex items-center justify-between">
          <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Config for other MCP clients
          </div>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(CONFIG_SNIPPET);
              toast.success("Config copied");
            }}
            className="h-7 w-7 grid place-items-center rounded-md surface-hairline hover:bg-accent"
            aria-label="Copy config"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <pre className="mt-2 text-mono text-[11px] leading-relaxed bg-muted/30 rounded-md p-3 overflow-x-auto">
          {CONFIG_SNIPPET}
        </pre>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Point Claude Desktop, Cursor, or Codex at this endpoint to reuse the
          same local browser tools.
        </p>
      </div>
    </div>
  );
}
