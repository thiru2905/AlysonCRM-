import { RUNTIME_PILLARS } from "@/lib/runtime/config";
import { useRuntimeStatus, setRuntimeMock } from "@/lib/runtime/useRuntimeStatus";
import { cn } from "@/lib/utils";
import { Download, Play, ScanEye, ShieldCheck, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Download,
    label: "1 · Install",
    desc: "Download Alyson Runtime and run the installer. Takes about a minute.",
  },
  {
    icon: ScanEye,
    label: "2 · Approve",
    desc: "Approve the Chrome extension and pair the local MCP server with your workspace.",
  },
  {
    icon: Play,
    label: "3 · Work with Alyson",
    desc: "Every worker can now see the pages you visit and act in your browser when you approve.",
  },
];

export function RuntimeOverview() {
  const { state, mocked } = useRuntimeStatus();
  const isConnected = state === "connected";

  return (
    <div className="space-y-4">
      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RUNTIME_PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.label}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="h-8 w-8 rounded-md border border-border/60 grid place-items-center text-ai">
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-sm">{p.label}</div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-ai" />
          <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            How it works
          </span>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.label} className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {s.label}
                </div>
                <p className="mt-2 text-sm">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Trust + dev toggle */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              What Runtime does not do
            </span>
          </div>
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <li>· Never sends browsing data off your machine without approval.</li>
            <li>· Never touches sites outside your allowlist.</li>
            <li>· Never stores passwords or bypasses SSO.</li>
            <li>· Never runs when you quit the tray app.</li>
          </ul>
        </div>

        <div
          className={cn(
            "rounded-xl border p-4",
            mocked ? "border-ai/40 bg-ai/5" : "border-dashed border-border/70",
          )}
        >
          <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Design preview
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Simulate a connected Runtime for the current session.
          </p>
          <button
            type="button"
            onClick={() => setRuntimeMock(!mocked)}
            className={cn(
              "mt-3 w-full h-8 rounded-md text-xs transition",
              mocked
                ? "bg-ai text-ai-foreground hover:brightness-110"
                : "surface-hairline hover:bg-accent",
            )}
          >
            {mocked ? "Mock preview: on" : isConnected ? "Real Runtime connected" : "Preview connected state"}
          </button>
        </div>
      </div>
    </div>
  );
}
