import { RUNTIME_MCP_ENDPOINT, RUNTIME_MCP_TOOLS } from "@/lib/runtime/config";

export function RuntimeMcpPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Browser MCP tools</h3>
        <code className="text-[11px] text-muted-foreground">{RUNTIME_MCP_ENDPOINT}</code>
      </div>
      <div className="divide-y divide-border/70 rounded-lg border border-border/70">
        {RUNTIME_MCP_TOOLS.map((tool) => (
          <div key={tool.name} className="px-3 py-2 flex items-start justify-between gap-3">
            <code className="text-xs">{tool.name}</code>
            <span className="text-xs text-muted-foreground text-right">{tool.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
