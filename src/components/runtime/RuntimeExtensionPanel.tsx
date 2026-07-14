import { RUNTIME_EXTENSION_CAPS } from "@/lib/runtime/config";
import { useRuntimeStatus } from "@/lib/runtime/useRuntimeStatus";
import { cn } from "@/lib/utils";
import { notifySoon } from "@/lib/actions";
import { Chrome, Copy, Globe, ToggleRight } from "lucide-react";
import { toast } from "sonner";

const ALLOWLIST = [
  { host: "app.alyson.dev", tone: "success" as const, note: "Trusted" },
  { host: "*.hubspot.com", tone: "success" as const, note: "CRM" },
  { host: "*.linkedin.com", tone: "warning" as const, note: "Ask before act" },
  { host: "*.gmail.com", tone: "warning" as const, note: "Ask before act" },
  { host: "*.notion.so", tone: "muted" as const, note: "Read only" },
];

export function RuntimeExtensionPanel() {
  const { state } = useRuntimeStatus();
  const connected = state === "connected";
  const pairingCode = "ALY-4G7K-92XM";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <Chrome className="h-3.5 w-3.5 text-ai" />
            <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Chrome extension
            </span>
            <span
              className={cn(
                "ml-auto text-[10px] text-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
                connected ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {connected ? "Enabled" : "Not paired"}
            </span>
          </div>
          <p className="mt-2 text-sm">
            The extension observes the pages you visit and turns them into
            structured context Alyson can reason about.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RUNTIME_EXTENSION_CAPS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="rounded-md border border-border/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs">{c.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Per-site permissions
            </span>
          </div>
          <ul className="divide-y divide-border/40">
            {ALLOWLIST.map((a) => (
              <li
                key={a.host}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className="text-mono text-xs flex-1 truncate">{a.host}</span>
                <span
                  className={cn(
                    "text-[10px] text-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
                    a.tone === "success" && "bg-success/15 text-success",
                    a.tone === "warning" && "bg-warning/15 text-warning",
                    a.tone === "muted" && "bg-muted text-muted-foreground",
                  )}
                >
                  {a.note}
                </span>
                <button
                  onClick={() => notifySoon("Edit permissions", a.host)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Edit permissions for ${a.host}`}
                >
                  <ToggleRight className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pairing */}
      <div className="rounded-xl border border-border/60 bg-card p-4 h-fit">
        <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Pairing code
        </div>
        <div className="mt-2 flex items-center gap-2">
          <code className="text-display text-xl tabular-nums flex-1">
            {pairingCode}
          </code>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(pairingCode);
              toast.success("Pairing code copied");
            }}
            className="h-8 w-8 grid place-items-center rounded-md surface-hairline hover:bg-accent"
            aria-label="Copy pairing code"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Open Alyson Runtime on your machine and paste this code to pair the
          extension with this workspace.
        </p>
      </div>
    </div>
  );
}
