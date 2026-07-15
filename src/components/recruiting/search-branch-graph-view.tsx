import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Move, ZoomIn, ZoomOut } from "lucide-react";
import type { BranchGraphLayout, BranchGraphNode } from "@/lib/recruiting/linkedin/branch-graph-layout";
import { nodeVisual } from "@/lib/recruiting/linkedin/branch-graph-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  layout: BranchGraphLayout;
  selectedId: string | null;
  onSelect: (node: BranchGraphNode) => void;
  variant: "graph" | "tree";
};

type Point = { x: number; y: number };

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const CANVAS_HEIGHT = 580;
const FIT_PADDING = 48;

function truncate(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function layoutKey(layout: BranchGraphLayout, variant: string): string {
  return `${variant}:${layout.width}x${layout.height}:${layout.nodes.map((n) => n.id).join(",")}`;
}

function computeFitView(
  layout: BranchGraphLayout,
  positions: Record<string, Point>,
  containerW: number,
  containerH: number
): { pan: Point; zoom: number } {
  if (!layout.nodes.length) return { pan: { x: 0, y: 0 }, zoom: 1 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of layout.nodes) {
    const pos = positions[node.id] ?? { x: node.x, y: node.y };
    const pad = node.r + 36;
    minX = Math.min(minX, pos.x - pad);
    minY = Math.min(minY, pos.y - pad);
    maxX = Math.max(maxX, pos.x + pad);
    maxY = Math.max(maxY, pos.y + pad);
  }

  const contentW = Math.max(maxX - minX, 1);
  const contentH = Math.max(maxY - minY, 1);
  const zoom = Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      Math.min(
        (containerW - FIT_PADDING * 2) / contentW,
        (containerH - FIT_PADDING * 2) / contentH
      )
    )
  );

  const pan = {
    x: (containerW - contentW * zoom) / 2 - minX * zoom,
    y: (containerH - contentH * zoom) / 2 - minY * zoom,
  };

  return { pan, zoom };
}

export function SearchBranchGraphView({ layout, selectedId, onSelect, variant }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    startPointer: Point;
    startPos: Point;
  } | null>(null);
  const [panning, setPanning] = useState<{
    startPointer: Point;
    startPan: Point;
  } | null>(null);
  const layoutId = useMemo(() => layoutKey(layout, variant), [layout, variant]);

  const branchCount = layout.nodes.filter((n) => n.kind === "branch").length;

  useEffect(() => {
    const next: Record<string, Point> = {};
    for (const n of layout.nodes) {
      next[n.id] = { x: n.x, y: n.y };
    }
    setPositions(next);

    const el = containerRef.current;
    if (el) {
      const fit = computeFitView(layout, next, el.clientWidth, CANVAS_HEIGHT);
      setPan(fit.pan);
      setZoom(fit.zoom);
    } else {
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [layoutId, layout]);

  const byId = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes]
  );

  const clientToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const resetView = () => {
    const next: Record<string, Point> = {};
    for (const n of layout.nodes) next[n.id] = { x: n.x, y: n.y };
    setPositions(next);
    const el = containerRef.current;
    if (el) {
      const fit = computeFitView(layout, next, el.clientWidth, CANVAS_HEIGHT);
      setPan(fit.pan);
      setZoom(fit.zoom);
    }
  };

  const zoomBy = (delta: number) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  };

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging) {
        const pointer = clientToCanvas(e.clientX, e.clientY);
        setPositions((prev) => ({
          ...prev,
          [dragging.id]: {
            x: dragging.startPos.x + (pointer.x - dragging.startPointer.x),
            y: dragging.startPos.y + (pointer.y - dragging.startPointer.y),
          },
        }));
      } else if (panning) {
        setPan({
          x: panning.startPan.x + (e.clientX - panning.startPointer.x),
          y: panning.startPan.y + (e.clientY - panning.startPointer.y),
        });
      }
    }

    function onUp() {
      setDragging(null);
      setPanning(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, panning, clientToCanvas]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.1 : 0.1);
  };

  const startPan = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPanning({
      startPointer: { x: e.clientX, y: e.clientY },
      startPan: { ...pan },
    });
  };

  const startDragNode = (e: React.PointerEvent, node: BranchGraphNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pos = positions[node.id] ?? { x: node.x, y: node.y };
    setDragging({
      id: node.id,
      startPointer: clientToCanvas(e.clientX, e.clientY),
      startPos: pos,
    });
  };

  return (
    <div className="relative rounded-xl border border-border/80 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/40 shadow-sm dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border/80 bg-white/95 dark:bg-slate-900/95 p-1 shadow-md backdrop-blur-sm">
        <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => zoomBy(0.15)} title="Zoom in">
          <ZoomIn className="size-3.5" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => zoomBy(-0.15)} title="Zoom out">
          <ZoomOut className="size-3.5" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="size-7" onClick={resetView} title="Fit to view">
          <Maximize2 className="size-3.5" />
        </Button>
      </div>

      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-white/90 dark:bg-slate-900/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
          <Move className="size-3" />
          Drag · scroll zoom · pan background
        </span>
        <span className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-medium text-white shadow-sm">
          {branchCount} role branches
        </span>
      </div>

      <div
        ref={containerRef}
        className={cn("relative w-full overflow-hidden", panning ? "cursor-grabbing" : "cursor-grab")}
        style={{
          height: CANVAS_HEIGHT,
          backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)
          `,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onWheel={handleWheel}
        onPointerDown={startPan}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: layout.width,
            height: layout.height,
          }}
        >
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="img"
            aria-label={variant === "tree" ? "Search branch tree" : "Search branch graph"}
            onPointerDown={startPan}
          >
            <defs>
              <filter id="branch-node-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
              <filter id="branch-node-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect x={0} y={0} width={layout.width} height={layout.height} fill="transparent" />

            {variant === "graph" && (
              <g opacity={0.2} pointerEvents="none">
                <circle cx={layout.width / 2} cy={layout.height / 2} r={layout.height * 0.22} fill="none" stroke="#94a3b8" strokeDasharray="4 8" />
                <circle cx={layout.width / 2} cy={layout.height / 2} r={layout.height * 0.38} fill="none" stroke="#94a3b8" strokeDasharray="4 8" />
              </g>
            )}

            <g>
              {layout.edges.map((edge) => {
                const a = byId.get(edge.from);
                const b = byId.get(edge.to);
                if (!a || !b) return null;
                const aPos = positions[edge.from] ?? { x: a.x, y: a.y };
                const bPos = positions[edge.to] ?? { x: b.x, y: b.y };
                const active =
                  hoverId === null ||
                  hoverId === edge.from ||
                  hoverId === edge.to ||
                  selectedId === edge.from ||
                  selectedId === edge.to;
                return (
                  <line
                    key={edge.id}
                    x1={aPos.x}
                    y1={aPos.y}
                    x2={bPos.x}
                    y2={bPos.y}
                    stroke={active ? "#64748b" : "#cbd5e1"}
                    strokeWidth={active ? 2.5 : 1.5}
                    opacity={active ? 0.85 : 0.45}
                  />
                );
              })}
            </g>

            <g>
              {layout.nodes.map((node) => {
                const pos = positions[node.id] ?? { x: node.x, y: node.y };
                const selected = selectedId === node.id;
                const hover = hoverId === node.id;
                const visual = nodeVisual(node, selected, hover);
                const label = truncate(node.label, node.kind === "root" ? 26 : 20);
                const labelW = Math.max(label.length * 6.2, 48);
                const extraR = selected ? 5 : hover ? 3 : 0;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className={cn("cursor-grab", dragging?.id === node.id && "cursor-grabbing")}
                    onPointerDown={(e) => startDragNode(e, node)}
                    onMouseEnter={() => setHoverId(node.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(node);
                    }}
                  >
                    {selected && visual.glow && (
                      <circle cx={0} cy={0} r={node.r + 10} fill={visual.glow} opacity={0.22} />
                    )}

                    <circle
                      cx={0}
                      cy={0}
                      r={node.r + extraR}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={visual.strokeWidth}
                      filter={selected ? "url(#branch-node-glow)" : "url(#branch-node-shadow)"}
                    />

                    {node.kind === "branch" && (
                      <circle cx={0} cy={0} r={5} fill={visual.stroke} opacity={0.85} />
                    )}

                    <rect
                      x={-labelW / 2}
                      y={node.r + 8}
                      width={labelW}
                      height={18}
                      rx={9}
                      fill="white"
                      stroke={visual.stroke}
                      strokeWidth={1}
                      opacity={0.96}
                    />
                    <text
                      x={0}
                      y={node.r + 20}
                      textAnchor="middle"
                      fill={visual.labelColor}
                      fontSize={10}
                      fontWeight={selected ? 700 : 600}
                      pointerEvents="none"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
