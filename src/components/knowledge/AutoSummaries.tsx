import { formatRelative } from "@/components/entity/EntityPanel";
import { SourceIcon } from "./SourceIcon";
import { K_SUMMARIES, kEntity } from "@/lib/knowledge/data";
import { RefreshCw, Sparkles } from "lucide-react";

export function AutoSummaries() {
  return (
    <div className="space-y-3">
      {K_SUMMARIES.map((s) => {
        const e = kEntity(s.entityId);
        return (
          <article
            key={s.entityId}
            className="rounded-xl border border-border bg-card p-4"
          >
            <header className="flex items-center gap-2">
              <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {e.kind} · {e.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-ai text-mono uppercase tracking-wider">
                <Sparkles className="h-2.5 w-2.5" />
                auto-generated · {formatRelative(s.updatedAt)}
              </span>
              <div className="flex-1" />
              <button className="inline-flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition">
                <RefreshCw className="h-3 w-3" />
                regenerate
              </button>
            </header>
            <h3 className="text-sm font-medium mt-2 leading-snug">
              {s.headline}
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {s.body}
            </p>
            <ul className="space-y-1.5 mt-3">
              {s.bullets.map((b) => (
                <li key={b} className="text-sm text-foreground/85 flex gap-2">
                  <span className="mt-2 h-1 w-1 rounded-full bg-ai shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <footer className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-mono uppercase tracking-wider text-muted-foreground">
                Synthesized from
              </span>
              {s.sourcesUsed.map((sk) => (
                <SourceIcon key={sk} kind={sk} size="xs" />
              ))}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
