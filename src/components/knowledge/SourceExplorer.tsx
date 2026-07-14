import { K_FACTS, SOURCES, type SourceKind } from "@/lib/knowledge/data";
import { SourceIcon } from "./SourceIcon";
import { cn } from "@/lib/utils";

export function SourceExplorer({
  active,
  onSelect,
}: {
  active: SourceKind | "all";
  onSelect: (k: SourceKind | "all") => void;
}) {
  const counts = new Map<SourceKind, number>();
  for (const f of K_FACTS) counts.set(f.source, (counts.get(f.source) ?? 0) + 1);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
        <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Sources
        </div>
        <div className="flex-1" />
        <div className="text-mono text-[10px] text-muted-foreground">
          {K_FACTS.length} signals · continuously syncing
        </div>
      </div>
      <ul>
        <li>
          <button
            onClick={() => onSelect("all")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm border-b border-border/60 hover:bg-accent transition",
              active === "all" && "bg-accent",
            )}
          >
            <span className="h-6 w-6 rounded-md border border-border grid place-items-center text-[10px] text-mono">
              ∀
            </span>
            <span className="font-medium">All sources</span>
            <div className="flex-1" />
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {K_FACTS.length}
            </span>
          </button>
        </li>
        {SOURCES.map((s) => {
          const c = counts.get(s.kind) ?? 0;
          const on = active === s.kind;
          return (
            <li key={s.kind}>
              <button
                onClick={() => onSelect(s.kind)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm border-b border-border/60 last:border-b-0 hover:bg-accent transition",
                  on && "bg-accent",
                )}
              >
                <SourceIcon kind={s.kind} size="sm" />
                <span className="font-medium">{s.label}</span>
                <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c > 0 ? "live" : "idle"}
                </span>
                <div className="flex-1" />
                <span className="text-mono text-[10px] text-muted-foreground">
                  {c}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
