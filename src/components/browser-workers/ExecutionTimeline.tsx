import { cn } from "@/lib/utils";
import {
  MousePointerClick,
  Keyboard,
  ScrollText,
  Camera,
  Download,
  Upload,
  ScanText,
  Clipboard,
  KeyRound,
  Cookie,
  Globe2,
  Waypoints,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from "lucide-react";
import type { Action, ActionKind } from "@/lib/browser-workers/data";
import { relTime } from "@/lib/browser-workers/data";

const KIND_ICON: Record<ActionKind, typeof MousePointerClick> = {
  navigate: Globe2,
  click: MousePointerClick,
  type: Keyboard,
  scroll: ScrollText,
  download: Download,
  upload: Upload,
  ocr: ScanText,
  screenshot: Camera,
  clipboard: Clipboard,
  extract: Waypoints,
  auth: KeyRound,
  cookie: Cookie,
};

export function ExecutionTimeline({ actions }: { actions: Action[] }) {
  if (actions.length === 0)
    return (
      <div className="text-xs text-muted-foreground p-4 text-center">
        No actions recorded yet for this task.
      </div>
    );
  return (
    <ol className="relative ml-2 border-l border-border/60 space-y-2 pl-3">
      {actions.map((a) => {
        const Icon = KIND_ICON[a.kind];
        return (
          <li key={a.id} className="relative">
            <span
              className={cn(
                "absolute -left-[15px] top-1.5 h-2 w-2 rounded-full ring-2 ring-background",
                a.ok
                  ? "bg-success/70"
                  : a.recovered
                    ? "bg-ai/70"
                    : "bg-destructive/80",
              )}
            />
            <div className="flex items-start gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground text-mono">
                  <span>{a.kind}</span>
                  <span>·</span>
                  <span>{relTime(a.at)}</span>
                  {a.ok ? (
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  ) : a.recovered ? (
                    <RefreshCcw className="h-3 w-3 text-ai" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive" />
                  )}
                </div>
                <div className="text-xs text-foreground truncate">{a.target}</div>
                {a.note && (
                  <div className="text-[11px] text-muted-foreground italic">
                    {a.note}
                  </div>
                )}
              </div>
              {a.screenshotUrl && (
                <div className="shrink-0 h-8 w-12 rounded-sm surface-hairline bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center">
                  <Camera className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
