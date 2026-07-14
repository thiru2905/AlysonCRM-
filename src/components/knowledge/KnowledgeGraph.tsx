import { useMemo, useState } from "react";
import { K_EDGES, K_ENTITIES, kEntity } from "@/lib/knowledge/data";
import { cn } from "@/lib/utils";

/* Deterministic layout: place nodes on a circle, plus a center pull for a
   selected focus node. Not a real force sim — visually calm and predictable. */

const KIND_COLOR: Record<string, string> = {
  person: "hsl(210 80% 65%)",
  company: "hsl(280 60% 70%)",
  project: "hsl(160 60% 60%)",
  place: "hsl(40 70% 65%)",
};

export function KnowledgeGraph({
  focusId,
  onFocus,
}: {
  focusId?: string;
  onFocus?: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const width = 720;
  const height = 460;
  const cx = width / 2;
  const cy = height / 2;

  const positions = useMemo(() => {
    const n = K_ENTITIES.length;
    const R = 175;
    const map = new Map<string, { x: number; y: number }>();
    K_ENTITIES.forEach((e, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      map.set(e.id, {
        x: cx + Math.cos(angle) * R,
        y: cy + Math.sin(angle) * R,
      });
    });
    if (focusId && map.has(focusId)) {
      map.set(focusId, { x: cx, y: cy });
      // spread others tighter around
      const others = K_ENTITIES.filter((e) => e.id !== focusId);
      others.forEach((e, i) => {
        const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
        map.set(e.id, {
          x: cx + Math.cos(angle) * R,
          y: cy + Math.sin(angle) * R,
        });
      });
    }
    return map;
  }, [focusId, cx, cy]);

  const focus = hover ?? focusId ?? null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[460px]"
        role="img"
        aria-label="Knowledge graph"
      >
        <defs>
          <radialGradient id="kg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--ai) / 0.18)" />
            <stop offset="100%" stopColor="hsl(var(--ai) / 0)" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#kg-glow)" />

        {/* edges */}
        {K_EDGES.map((edge, i) => {
          const a = positions.get(edge.from);
          const b = positions.get(edge.to);
          if (!a || !b) return null;
          const active =
            focus === null || focus === edge.from || focus === edge.to;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              className={cn(
                "transition-all",
                active ? "text-foreground/40" : "text-foreground/10",
              )}
              strokeWidth={0.5 + edge.strength * 1.6}
            />
          );
        })}

        {/* nodes */}
        {K_ENTITIES.map((e) => {
          const p = positions.get(e.id)!;
          const isFocus = focus === e.id;
          const dim = focus !== null && !isFocus &&
            !K_EDGES.some(
              (ed) =>
                (ed.from === focus && ed.to === e.id) ||
                (ed.to === focus && ed.from === e.id),
            );
          const r = e.id === focusId ? 22 : 14;
          return (
            <g
              key={e.id}
              transform={`translate(${p.x} ${p.y})`}
              onMouseEnter={() => setHover(e.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onFocus?.(e.id)}
              className={cn(
                "cursor-pointer transition-opacity",
                dim ? "opacity-30" : "opacity-100",
              )}
            >
              <circle
                r={r + 6}
                fill={KIND_COLOR[e.kind]}
                opacity={isFocus ? 0.18 : 0}
                className="transition-opacity"
              />
              <circle
                r={r}
                fill="hsl(var(--card))"
                stroke={KIND_COLOR[e.kind]}
                strokeWidth={isFocus ? 2 : 1.25}
              />
              <text
                y={r + 14}
                textAnchor="middle"
                className="fill-foreground/80"
                style={{ font: "500 11px var(--font-sans, system-ui)" }}
              >
                {e.label}
              </text>
              <text
                y={r + 26}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{
                  font: "500 9px var(--font-mono, ui-monospace)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {e.kind}
              </text>
            </g>
          );
        })}
      </svg>

      {focus && (
        <div className="border-t border-border px-4 py-3 flex items-center gap-3 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: KIND_COLOR[kEntity(focus).kind] }}
          />
          <span className="font-medium">{kEntity(focus).label}</span>
          <span className="text-muted-foreground">
            · {K_EDGES.filter((e) => e.from === focus || e.to === focus).length}{" "}
            relationships
          </span>
          <div className="flex-1" />
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            hover to focus · click to pin
          </span>
        </div>
      )}
    </div>
  );
}
