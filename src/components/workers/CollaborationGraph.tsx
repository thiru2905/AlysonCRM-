import { useMemo } from "react";
import { COLLABORATION, WORKERS, type Worker } from "@/lib/workers/data";
import { WorkerIcon } from "./WorkerIcon";
import { cn } from "@/lib/utils";

/**
 * Deterministic radial layout. No physics, no randomness — Alyson
 * graphs should re-render identically every time.
 */
export function CollaborationGraph({
  focusId,
  onFocus,
}: {
  focusId?: string;
  onFocus?: (id: string) => void;
}) {
  const layout = useMemo(() => {
    const cx = 240;
    const cy = 200;
    const r = 150;
    const n = WORKERS.length;
    return new Map<string, { x: number; y: number; w: Worker }>(
      WORKERS.map((w, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        return [
          w.id,
          { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, w },
        ];
      }),
    );
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <svg viewBox="0 0 480 400" className="w-full h-auto">
        {COLLABORATION.map((e, i) => {
          const a = layout.get(e.from);
          const b = layout.get(e.to);
          if (!a || !b) return null;
          const on = focusId && (e.from === focusId || e.to === focusId);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              className={cn(on ? "text-ai" : "text-border")}
              strokeWidth={on ? 1.5 : 0.75}
              opacity={on ? 0.9 : 0.6}
            />
          );
        })}
        {[...layout.values()].map(({ x, y, w }) => {
          const on = focusId === w.id;
          return (
            <g
              key={w.id}
              transform={`translate(${x - 14} ${y - 14})`}
              className="cursor-pointer"
              onClick={() => onFocus?.(w.id)}
            >
              <circle
                cx={14}
                cy={14}
                r={on ? 20 : 16}
                className={cn(
                  "transition",
                  on ? "fill-ai-soft stroke-ai" : "fill-background stroke-border",
                )}
                strokeWidth={1}
              />
              <foreignObject x={4} y={4} width={20} height={20}>
                <div className="flex items-center justify-center">
                  <WorkerIcon type={w.type} size="xs" />
                </div>
              </foreignObject>
              <text
                x={14}
                y={44}
                textAnchor="middle"
                className={cn(
                  "text-[10px] fill-current",
                  on ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {w.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
