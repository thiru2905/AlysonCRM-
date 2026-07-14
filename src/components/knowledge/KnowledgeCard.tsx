import { formatRelative } from "@/components/entity/EntityPanel";
import { SourceIcon } from "./SourceIcon";
import { kEntity, sourceMeta, type KFact } from "@/lib/knowledge/data";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function KnowledgeCard({
  fact,
  compact,
  onEntityClick,
}: {
  fact: KFact;
  compact?: boolean;
  onEntityClick?: (id: string) => void;
}) {
  const src = sourceMeta(fact.source);
  return (
    <article
      className={cn(
        "group rounded-xl border border-border bg-card px-4 py-3.5 transition",
        "hover:border-border-strong hover:bg-card/80",
      )}
    >
      <div className="flex items-start gap-3">
        <SourceIcon kind={fact.source} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] text-mono uppercase tracking-wider text-muted-foreground">
            <span>{src.label}</span>
            <span>·</span>
            <span>{formatRelative(fact.at)}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-ai">
              <Sparkles className="h-2.5 w-2.5" />
              {Math.round(fact.confidence * 100)}%
            </span>
          </div>
          <h3 className="text-sm font-medium leading-snug mt-1">{fact.title}</h3>
          {!compact && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
              {fact.excerpt}
            </p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {fact.entities.map((eid) => {
              const e = kEntity(eid);
              return (
                <button
                  key={eid}
                  onClick={() => onEntityClick?.(eid)}
                  className="text-[11px] px-1.5 h-5 inline-flex items-center rounded bg-accent text-foreground/80 hover:bg-accent/70 transition"
                >
                  {e.label}
                </button>
              );
            })}
            <span className="ml-auto text-[10px] text-mono text-muted-foreground/70 truncate">
              {fact.citation}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
