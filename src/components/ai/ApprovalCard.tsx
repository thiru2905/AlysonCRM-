import { Check, X, ChevronRight } from "lucide-react";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { cn } from "@/lib/utils";
import { notifyDone, notifySoon } from "@/lib/actions";
import type { ReactNode } from "react";

export interface ApprovalAction {
  label: string;
  value: string;
}

export function ApprovalCard({
  worker,
  title,
  rationale,
  confidence,
  children,
  onApprove,
  onReject,
  className,
}: {
  worker: string;
  title: string;
  rationale: string;
  confidence: number;
  children?: ReactNode;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card overflow-hidden transition hover:border-border-strong",
        className,
      )}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/70">
        <div className="h-5 w-5 rounded-md ai-gradient-bg shrink-0" />
        <span className="text-xs text-muted-foreground text-mono uppercase tracking-wider">
          {worker}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-xs text-muted-foreground">proposes</span>
        <div className="flex-1" />
        <ConfidenceMeter value={confidence} />
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{rationale}</p>
        {children && <div className="pt-2">{children}</div>}
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t border-border/70 bg-surface">
        <button
          type="button"
          onClick={onReject ?? (() => notifyDone("Rejected", title))}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <X className="h-3 w-3" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => notifySoon("Edit proposal", title)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          Edit
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onApprove ?? (() => notifyDone("Approved", title))}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 transition"
        >
          <Check className="h-3 w-3" />
          Approve
          <kbd className="bg-primary-foreground/10 text-primary-foreground border-transparent">↵</kbd>
        </button>
      </div>
    </div>
  );
}
