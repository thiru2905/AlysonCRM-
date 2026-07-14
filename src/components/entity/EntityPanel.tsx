import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function EntityPanel({
  title,
  hint,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex items-center gap-3 px-4 h-11 border-b border-border/70">
          <div className="min-w-0">
            {title && <h3 className="text-xs font-medium truncate">{title}</h3>}
            {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
          </div>
          <div className="flex-1" />
          {actions}
        </header>
      )}
      <div className={cn(padded && "p-4")}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-sm text-foreground/80">{title}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function ProvenanceTag({
  source,
  actor,
  at,
  confidence,
}: {
  source: "human" | "worker" | "system" | "import";
  actor?: string;
  at?: string;
  confidence?: number;
}) {
  const label =
    source === "worker" ? actor ?? "Worker" :
    source === "human" ? actor ?? "Human" :
    source === "system" ? "System" : "Import";
  return (
    <span className="inline-flex items-center gap-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          source === "worker" ? "bg-ai" : source === "human" ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {label}
      {typeof confidence === "number" && <span>· {Math.round(confidence * 100)}%</span>}
      {at && <span>· {formatRelative(at)}</span>}
    </span>
  );
}

export function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.round((now - d) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.round(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}
