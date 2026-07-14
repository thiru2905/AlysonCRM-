import { useEffect, useState } from "react";
import { detectOs, RUNTIME_DOWNLOADS, type RuntimeOs } from "@/lib/runtime/config";
import { useRuntimeStatus } from "@/lib/runtime/useRuntimeStatus";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Apple, CheckCircle2, Download, RefreshCcw, Sparkles } from "lucide-react";

const OS_LABEL: Record<RuntimeOs, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  unknown: "your OS",
};

export function RuntimeHero() {
  const status = useRuntimeStatus();
  const [detectedOs, setDetectedOs] = useState<RuntimeOs>("unknown");

  useEffect(() => {
    setDetectedOs(detectOs());
  }, []);

  const isConnected = status.state === "connected";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-6 p-6">
        <div className="min-w-0">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Alyson Runtime · v0.4
          </div>
          <h1 className="mt-2 text-display text-3xl leading-tight">
            Your co-worker, installed on your machine.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Alyson Runtime lets Alyson <span className="text-foreground">see what you see</span>{" "}
            and <span className="text-foreground">act in your browser</span> — locally, on
            your terms. Install it once and every worker gets hands and eyes.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {RUNTIME_DOWNLOADS.map((d) => {
              const primary = d.os === detectedOs;
              return (
                <a
                  key={d.os}
                  href={d.url}
                  download={d.filename}
                  onClick={() =>
                    toast.success(`Downloading ${d.filename}`, {
                      description:
                        "Once installed, this page will auto-connect to your local Runtime.",
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-2 h-9 px-3.5 rounded-md text-sm transition",
                    primary
                      ? "bg-foreground text-background hover:opacity-90 shadow-pop"
                      : "surface-hairline text-foreground hover:bg-accent",
                  )}
                >
                  {d.os === "macos" ? (
                    <Apple className="h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download for {OS_LABEL[d.os]}
                  <span className="text-[10px] text-mono opacity-70">
                    · {d.sizeMb.toFixed(0)} MB
                  </span>
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => status.refresh()}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title="Re-check for local Runtime"
            >
              <RefreshCcw className="h-3 w-3" /> Check for install
            </button>
          </div>

          {detectedOs === "linux" && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              Linux build is on the way — use Windows or macOS for now.
            </div>
          )}
        </div>

        {/* Status card */}
        <div
          className={cn(
            "rounded-lg border p-4 min-w-[240px] flex flex-col justify-between",
            isConnected
              ? "border-success/40 bg-success/5"
              : status.state === "disconnected"
                ? "border-warning/40 bg-warning/5"
                : "border-border bg-muted/30",
          )}
        >
          <div>
            <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {isConnected ? (
                <CheckCircle2 className="h-3 w-3 text-success" />
              ) : (
                <Sparkles className="h-3 w-3 text-muted-foreground" />
              )}
              Runtime status
            </div>
            <div className="mt-1.5 text-lg text-display">
              {isConnected
                ? "Connected"
                : status.state === "disconnected"
                  ? "Disconnected"
                  : status.state === "checking"
                    ? "Checking…"
                    : "Not installed"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isConnected
                ? `v${status.version} · running on 127.0.0.1:8787`
                : status.state === "disconnected"
                  ? "The local Runtime stopped responding. Reopen the app on your machine."
                  : status.state === "checking"
                    ? "Looking for a local Runtime on this device."
                    : "Install Runtime to let Alyson see and act in your browser."}
            </div>
          </div>
          {status.mocked && (
            <div className="mt-3 text-[10px] text-mono uppercase tracking-[0.14em] text-ai">
              Mock preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
