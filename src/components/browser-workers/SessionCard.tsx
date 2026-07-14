import { cn } from "@/lib/utils";
import {
  Chrome,
  Monitor,
  MonitorSmartphone,
  MousePointer2,
  Wifi,
  WifiOff,
  AlertTriangle,
  KeyRound,
  Pause,
} from "lucide-react";
import type { BrowserSession } from "@/lib/browser-workers/data";
import { relTime, STATUS_TONE } from "@/lib/browser-workers/data";

const BROWSER_ICON: Record<BrowserSession["browser"], typeof Chrome> = {
  Chrome,
  Arc: MonitorSmartphone,
  Edge: Monitor,
  Brave: Chrome,
};

function StatusDot({ status }: { status: BrowserSession["status"] }) {
  const s = String(status);
  if (s === "active")
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
    );
  if (s === "error")
    return <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />;
  if (s === "waiting_auth")
    return <span className="h-2 w-2 rounded-full bg-warning shrink-0" />;
  if (s === "idle")
    return <span className="h-2 w-2 rounded-full bg-muted-foreground/60 shrink-0" />;
  return <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />;
}

function StatusIcon({ status }: { status: BrowserSession["status"] }) {
  const s = String(status);
  if (s === "offline") return <WifiOff className="h-3 w-3" />;
  if (s === "error") return <AlertTriangle className="h-3 w-3" />;
  if (s === "waiting_auth") return <KeyRound className="h-3 w-3" />;
  if (s === "paused") return <Pause className="h-3 w-3" />;
  return <Wifi className="h-3 w-3" />;
}

export function SessionCard({
  session,
  active,
  onClick,
}: {
  session: BrowserSession;
  active: boolean;
  onClick: () => void;
}) {
  const BIcon = BROWSER_ICON[session.browser];
  const label = String(session.status).replace("_", " ");
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md surface-hairline p-2.5 transition",
        "hover:bg-accent/60",
        active && "bg-accent ring-1 ring-ai/40",
      )}
    >
      <div className="flex items-start gap-2">
        <StatusDot status={session.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{session.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
            <BIcon className="h-3 w-3" />
            <span className="truncate">
              {session.browser} · {session.os}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-mono",
            STATUS_TONE[session.status] ?? "text-muted-foreground",
          )}
        >
          <StatusIcon status={session.status} />
          {label}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
        <Mini label="CPU" value={`${session.cpuPct}%`} />
        <Mini label="Mem" value={`${session.memMb}mb`} />
        <Mini label="Queue" value={String(session.queuedCount)} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <MousePointer2 className="h-2.5 w-2.5" />
          {session.cookiesCount} cookies
        </span>
        <span>heartbeat {relTime(session.lastHeartbeat)}</span>
      </div>
    </button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-muted/50 px-1.5 py-1">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80">
        {label}
      </div>
      <div className="text-[11px] text-foreground text-mono">{value}</div>
    </div>
  );
}
