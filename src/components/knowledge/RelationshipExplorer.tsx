import { useMemo, useState } from "react";
import { K_EDGES, K_ENTITIES, K_FACTS, kEntity } from "@/lib/knowledge/data";
import { SourceIcon } from "./SourceIcon";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/components/entity/EntityPanel";
import { ArrowRight } from "lucide-react";

export function RelationshipExplorer({
  focusId,
  onFocus,
}: {
  focusId: string;
  onFocus: (id: string) => void;
}) {
  const focus = kEntity(focusId);
  const [minStrength, setMinStrength] = useState(0);

  const related = useMemo(() => {
    return K_EDGES.filter(
      (e) =>
        (e.from === focusId || e.to === focusId) && e.strength >= minStrength,
    )
      .map((e) => {
        const otherId = e.from === focusId ? e.to : e.from;
        return { edge: e, other: kEntity(otherId) };
      })
      .sort((a, b) => b.edge.strength - a.edge.strength);
  }, [focusId, minStrength]);

  const factsForFocus = useMemo(
    () =>
      K_FACTS.filter((f) => f.entities.includes(focusId))
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 6),
    [focusId],
  );

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6">
      <aside className="space-y-1">
        <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground px-2 pb-2">
          Focus on
        </div>
        {K_ENTITIES.map((e) => {
          const on = e.id === focusId;
          return (
            <button
              key={e.id}
              onClick={() => onFocus(e.id)}
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center gap-2 transition",
                on
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              )}
            >
              <span className="flex-1 truncate">{e.label}</span>
              <span className="text-mono text-[9px] uppercase tracking-wider opacity-70">
                {e.kind}
              </span>
            </button>
          );
        })}
      </aside>

      <div className="space-y-6">
        <header className="flex items-end gap-4">
          <div>
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {focus.kind}
            </div>
            <h2 className="text-display text-xl mt-0.5">{focus.label}</h2>
          </div>
          <div className="flex-1" />
          <label className="text-[11px] text-muted-foreground flex items-center gap-2">
            min strength
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={minStrength}
              onChange={(e) => setMinStrength(parseFloat(e.target.value))}
              className="accent-primary"
            />
            <span className="text-mono w-8 text-right">
              {Math.round(minStrength * 100)}%
            </span>
          </label>
        </header>

        <section>
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Direct relationships
          </div>
          <ul className="rounded-xl border border-border bg-card overflow-hidden">
            {related.map(({ edge, other }) => (
              <li
                key={other.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0"
              >
                <span className="text-sm font-medium">{focus.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => onFocus(other.id)}
                  className="text-sm font-medium hover:text-ai transition"
                >
                  {other.label}
                </button>
                <span className="text-xs text-muted-foreground truncate">
                  · {edge.reason}
                </span>
                <div className="flex-1" />
                <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {Math.round(edge.strength * 100)}%
                </span>
                <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full ai-gradient-bg rounded-full"
                    style={{ width: `${edge.strength * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {related.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground text-center">
                No relationships above threshold.
              </li>
            )}
          </ul>
        </section>

        <section>
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Recent signals mentioning {focus.label}
          </div>
          <ul className="space-y-2">
            {factsForFocus.map((f) => (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <SourceIcon kind={f.source} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug">{f.title}</div>
                  <div className="text-[10px] text-mono uppercase tracking-wider text-muted-foreground mt-1">
                    {f.citation} · {formatRelative(f.at)}
                  </div>
                </div>
              </li>
            ))}
            {factsForFocus.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No signals for this entity yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
