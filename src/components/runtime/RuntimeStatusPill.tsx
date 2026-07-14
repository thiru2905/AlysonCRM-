import { Link } from "@tanstack/react-router";
import { useRuntimeStatus } from "@/lib/runtime/useRuntimeStatus";
import { cn } from "@/lib/utils";
import { CircleDot, Download } from "lucide-react";

export function RuntimeStatusPill({ className }: { className?: string }) {
  const { state } = useRuntimeStatus();

  const meta =
    state === "connected"
      ? {
          label: "Runtime",
          dot: "bg-success",
          text: "text-success",
          hint: "Connected",
        }
      : state === "disconnected"
        ? {
            label: "Runtime",
            dot: "bg-warning",
            text: "text-warning",
            hint: "Disconnected",
          }
        : state === "checking"
          ? {
              label: "Runtime",
              dot: "bg-muted-foreground/60 animate-pulse",
              text: "text-muted-foreground",
              hint: "Checking…",
            }
          : {
              label: "Install Runtime",
              dot: "bg-muted-foreground/40",
              text: "text-muted-foreground",
              hint: "Not installed",
            };

  return (
    <Link
      to="/browser-workers"
      className={cn(
        "hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs surface-hairline hover:bg-accent transition",
        meta.text,
        className,
      )}
      title={`Alyson Runtime · ${meta.hint}`}
    >
      {state === "not_installed" ? (
        <Download className="h-3.5 w-3.5" />
      ) : (
        <span className="relative flex h-2 w-2">
          {state === "connected" && (
            <span className="absolute inset-0 rounded-full bg-success/60 animate-ping" />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
        </span>
      )}
      <span className="hidden md:inline">{meta.label}</span>
      <CircleDot className="h-3 w-3 opacity-0" aria-hidden />
    </Link>
  );
}
