import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 pb-6 border-b border-border/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-display text-2xl md:text-[28px] leading-tight break-words">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}


export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-6xl mx-auto px-5 md:px-8 py-8", className)}>{children}</div>
  );
}
