import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { detectOs, RUNTIME_DOWNLOADS, RUNTIME_PILLARS, type RuntimeOs } from "@/lib/runtime/config";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Apple, ArrowRight, Download, X } from "lucide-react";

const SEEN_KEY = "alyson.runtime.introSeen";

const OS_LABEL: Record<RuntimeOs, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  unknown: "your OS",
};

export function RuntimeIntroModal() {
  const [open, setOpen] = useState(false);
  const [detectedOs, setDetectedOs] = useState<RuntimeOs>("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (!seen) setOpen(true);
    } catch {
      /* ignore */
    }
    setDetectedOs(detectOs());
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  const primary =
    RUNTIME_DOWNLOADS.find((d) => d.os === detectedOs) ?? RUNTIME_DOWNLOADS[0];
  const secondary = RUNTIME_DOWNLOADS.find((d) => d.os !== primary.os);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alyson-runtime-intro-title"
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-pop overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/60">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Meet Alyson Runtime
          </div>
          <button
            onClick={dismiss}
            className="ml-auto h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <h2 id="alyson-runtime-intro-title" className="text-display text-2xl leading-tight">
            Your co-worker, installed on your machine.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Alyson Runtime is a small app you install on your computer. It
            gives Alyson eyes (a browser extension) and hands (a local MCP
            server) so she can help with the actual work you do in Chrome —
            with your approval, always.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {RUNTIME_PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <Icon className="h-4 w-4 text-ai" />
                  <div className="mt-2 text-sm">{p.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              href={primary.url}
              download={primary.filename}
              onClick={() => {
                toast.success(`Downloading ${primary.filename}`, {
                  description:
                    "Once installed, this page will auto-connect to your local Runtime.",
                });
                dismiss();
              }}
              className={cn(
                "inline-flex items-center gap-2 h-9 px-3.5 rounded-md text-sm bg-foreground text-background hover:opacity-90 shadow-pop transition",
              )}
            >
              {primary.os === "macos" ? (
                <Apple className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Install for {OS_LABEL[primary.os]}
            </a>
            {secondary && (
              <a
                href={secondary.url}
                download={secondary.filename}
                onClick={dismiss}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md text-sm surface-hairline hover:bg-accent transition"
              >
                {secondary.os === "macos" ? (
                  <Apple className="h-3.5 w-3.5" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {OS_LABEL[secondary.os]}
              </a>
            )}
            <Link
              to="/browser-workers"
              onClick={dismiss}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              See what it does <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
