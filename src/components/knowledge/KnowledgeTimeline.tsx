import { useMemo } from "react";
import { formatRelative } from "@/components/entity/EntityPanel";
import { SourceIcon } from "./SourceIcon";
import { kEntity, sourceMeta, type KFact } from "@/lib/knowledge/data";
import { cn } from "@/lib/utils";

function dayKey(iso: string): string {
  const d = new Date(iso);
  return d.toDateString();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor(
    (today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) /
      (24 * 3600 * 1000),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function KnowledgeTimeline({ facts }: { facts: KFact[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, KFact[]>();
    for (const f of facts) {
      const key = dayKey(f.at);
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [facts]);

  return (
    <div className="space-y-8">
      {groups.map(([key, items]) => (
        <section key={key}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {dayLabel(items[0].at)}
            </div>
            <div className="flex-1 h-px bg-border/60" />
            <div className="text-mono text-[10px] text-muted-foreground">
              {items.length} {items.length === 1 ? "signal" : "signals"}
            </div>
          </div>
          <ol className="relative">
            <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" aria-hidden />
            {items.map((f) => {
              const src = sourceMeta(f.source);
              return (
                <li key={f.id} className="relative pl-8 py-2.5">
                  <span
                    className={cn(
                      "absolute left-0 top-3.5 h-[22px] w-[22px] rounded-full grid place-items-center border border-border bg-card",
                    )}
                  >
                    <SourceIcon kind={f.source} size="xs" className="!h-3 !w-3" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm leading-snug">{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {f.excerpt}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-mono uppercase tracking-wider text-muted-foreground">
                      <span>{src.label}</span>
                      <span>·</span>
                      <span>{formatRelative(f.at)}</span>
                      <span>·</span>
                      <span className="text-ai">{Math.round(f.confidence * 100)}%</span>
                      <div className="flex-1" />
                      {f.entities.slice(0, 2).map((eid) => (
                        <span
                          key={eid}
                          className="normal-case tracking-normal text-[10px] px-1.5 h-4 inline-flex items-center rounded bg-accent text-foreground/80"
                        >
                          {kEntity(eid).label}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
