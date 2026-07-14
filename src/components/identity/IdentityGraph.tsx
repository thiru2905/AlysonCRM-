import { useMemo } from "react";
import { KIND_ICON, KIND_TONE } from "./kind-visual";
import {
  EDGES,
  EDGE_LABEL,
  NODES,
  neighborsOf,
  type IdentityKind,
  type IdentityNode,
} from "@/lib/identity/data";
import { cn } from "@/lib/utils";

/**
 * Deterministic radial layout centered on the focused node.
 * Ring 1: direct neighbors (respect kind filter).
 * Ring 2: neighbors of neighbors, deduped.
 *
 * Not a static diagram — nodes are clickable to refocus, hoverable to
 * highlight relationships, and animate strength via stroke opacity/width.
 */

interface Props {
  focusId: string;
  activeKinds: Set<IdentityKind>;
  hoverId: string | null;
  onFocus: (id: string) => void;
  onHover: (id: string | null) => void;
}

interface Placed {
  node: IdentityNode;
  x: number;
  y: number;
  r: number;
  ring: 0 | 1 | 2;
}

export function IdentityGraph({
  focusId,
  activeKinds,
  hoverId,
  onFocus,
  onHover,
}: Props) {
  const layout = useMemo(() => computeLayout(focusId, activeKinds), [
    focusId,
    activeKinds,
  ]);

  const byId = new Map(layout.placed.map((p) => [p.node.id, p]));

  // edges we render: only where both endpoints are placed
  const visibleEdges = EDGES.filter(
    (e) => byId.has(e.source) && byId.has(e.target),
  );

  const width = 780;
  const height = 560;

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        role="img"
        aria-label="Interactive identity graph"
      >
        {/* rings */}
        <g opacity={0.4}>
          <circle cx={width / 2} cy={height / 2} r={140} fill="none" stroke="var(--border)" strokeDasharray="2 4" />
          <circle cx={width / 2} cy={height / 2} r={240} fill="none" stroke="var(--border)" strokeDasharray="2 4" />
        </g>

        {/* edges */}
        <g>
          {visibleEdges.map((e) => {
            const a = byId.get(e.source)!;
            const b = byId.get(e.target)!;
            const isHovered =
              hoverId != null &&
              (hoverId === e.source || hoverId === e.target);
            const isFocused =
              focusId === e.source || focusId === e.target;
            const opacity =
              hoverId == null
                ? isFocused
                  ? 0.35 + e.strength * 0.6
                  : 0.1 + e.strength * 0.3
                : isHovered
                  ? 0.4 + e.strength * 0.6
                  : 0.05;
            const width = isHovered ? 1.6 : isFocused ? 1.2 : 0.75;
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--foreground)"
                strokeOpacity={opacity}
                strokeWidth={width}
                className="transition-all duration-200"
              />
            );
          })}
        </g>

        {/* nodes */}
        <g>
          {layout.placed.map((p) => {
            const tone = KIND_TONE[p.node.kind];
            const active = p.node.id === focusId;
            const hovered = p.node.id === hoverId;
            const r = active ? p.r + 4 : hovered ? p.r + 2 : p.r;
            return (
              <g
                key={p.node.id}
                transform={`translate(${p.x} ${p.y})`}
                className="cursor-pointer"
                onMouseEnter={() => onHover(p.node.id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onFocus(p.node.id)}
              >
                {active && (
                  <circle
                    r={r + 8}
                    fill="none"
                    stroke={tone.svg}
                    strokeOpacity={0.35}
                    strokeWidth={1.25}
                  />
                )}
                <circle
                  r={r}
                  fill="var(--surface-elevated)"
                  stroke={tone.svg}
                  strokeOpacity={active ? 1 : hovered ? 0.9 : 0.55}
                  strokeWidth={active ? 1.75 : 1.25}
                  className="transition-all duration-200"
                />
                {/* kind glyph */}
                <foreignObject x={-8} y={-8} width={16} height={16}>
                  <div className={cn("h-4 w-4 flex items-center justify-center", tone.text)}>
                    <KindGlyph kind={p.node.kind} />
                  </div>
                </foreignObject>
                {p.ring !== 2 && (
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    className="fill-foreground text-[10px]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {p.node.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* hover tooltip */}
      {hoverId && hoverId !== focusId && byId.has(hoverId) && (
        <HoverCard focusId={focusId} hoverId={hoverId} />
      )}
    </div>
  );
}

function KindGlyph({ kind }: { kind: IdentityKind }) {
  const Icon = KIND_ICON[kind];
  return <Icon className="h-3.5 w-3.5" />;
}

function HoverCard({ focusId, hoverId }: { focusId: string; hoverId: string }) {
  const node = NODES.find((n) => n.id === hoverId)!;
  const edge = EDGES.find(
    (e) =>
      (e.source === focusId && e.target === hoverId) ||
      (e.source === hoverId && e.target === focusId),
  );
  const tone = KIND_TONE[node.kind];
  return (
    <div className="pointer-events-none absolute top-3 right-3 max-w-[240px] rounded-md surface-hairline bg-popover/95 backdrop-blur px-3 py-2 shadow-pop">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", tone.bg)} />
        <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {node.kind}
        </span>
      </div>
      <div className="mt-1 text-sm font-medium">{node.label}</div>
      {node.sublabel && (
        <div className="text-xs text-muted-foreground">{node.sublabel}</div>
      )}
      {edge && (
        <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          Relationship: <span className="text-foreground">{EDGE_LABEL[edge.kind]}</span>
          {" · "}
          strength {(edge.strength * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}

// ---------- layout ----------

function computeLayout(focusId: string, activeKinds: Set<IdentityKind>) {
  const focus = NODES.find((n) => n.id === focusId)!;
  const cx = 390;
  const cy = 280;

  const placed: Placed[] = [{ node: focus, x: cx, y: cy, r: 14, ring: 0 }];
  const seen = new Set<string>([focus.id]);

  const ring1 = neighborsOf(focus.id, activeKinds);
  const r1Radius = 140;
  ring1.forEach((entry, i) => {
    const t = (i / Math.max(1, ring1.length)) * Math.PI * 2 - Math.PI / 2;
    placed.push({
      node: entry.node,
      x: cx + Math.cos(t) * r1Radius,
      y: cy + Math.sin(t) * r1Radius,
      r: 9,
      ring: 1,
    });
    seen.add(entry.node.id);
  });

  // ring 2: neighbors of ring1 (dedup, cap density)
  const ring2Candidates: { node: IdentityNode; parentIdx: number }[] = [];
  ring1.forEach((entry, i) => {
    const nbrs = neighborsOf(entry.node.id, activeKinds).slice(0, 3);
    for (const n of nbrs) {
      if (seen.has(n.node.id)) continue;
      seen.add(n.node.id);
      ring2Candidates.push({ node: n.node, parentIdx: i });
    }
  });

  const r2Radius = 240;
  ring2Candidates.slice(0, 24).forEach((c) => {
    // place near parent for readability
    const parent = placed[c.parentIdx + 1]; // +1 because focus at 0
    const angleToParent = Math.atan2(parent.y - cy, parent.x - cx);
    const jitter = ((c.node.id.charCodeAt(0) % 5) - 2) * 0.09;
    const t = angleToParent + jitter;
    placed.push({
      node: c.node,
      x: cx + Math.cos(t) * r2Radius,
      y: cy + Math.sin(t) * r2Radius,
      r: 6,
      ring: 2,
    });
  });

  return { placed };
}
