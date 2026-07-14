import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { IdentityGraph } from "@/components/identity/IdentityGraph";
import { EntityDetail } from "@/components/identity/EntityDetail";
import { KIND_ICON, KIND_TONE } from "@/components/identity/kind-visual";
import {
  KIND_LABEL,
  NODES,
  getNode,
  neighborsOf,
  type IdentityKind,
} from "@/lib/identity/data";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export const Route = createFileRoute("/relationships")({
  component: IdentityView,
});

const KIND_ORDER: IdentityKind[] = [
  "person",
  "company",
  "place",
  "project",
  "meeting",
  "email",
  "phone",
  "browser",
];

function IdentityView() {
  const [focusId, setFocusId] = useState<string>("p_lena");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<IdentityKind>>(
    () => new Set(KIND_ORDER),
  );

  const focus = getNode(focusId)!;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NODES.filter((n) => {
      if (!activeKinds.has(n.kind)) return false;
      if (!q) return true;
      return (
        n.label.toLowerCase().includes(q) ||
        (n.sublabel ?? "").toLowerCase().includes(q) ||
        (n.handle ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, activeKinds]);

  const kindCounts = useMemo(() => {
    const c = new Map<IdentityKind, number>();
    for (const k of KIND_ORDER) c.set(k, 0);
    for (const n of NODES) c.set(n.kind, (c.get(n.kind) ?? 0) + 1);
    return c;
  }, []);

  const neighborCount = neighborsOf(focusId).length;

  function toggleKind(k: IdentityKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="Relationship Graph"
        title="Every person, place, and action — connected."
        description="Not a diagram. Click any node to recenter. Search across people, companies, meetings, emails, calls and browser trails. Follow warm-intro paths, inspect shared connections, and read the full communication history."
      />

      {/* filter chips */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {KIND_ORDER.map((k) => {
          const Icon = KIND_ICON[k];
          const tone = KIND_TONE[k];
          const active = activeKinds.has(k);
          return (
            <button
              key={k}
              onClick={() => toggleKind(k)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] transition",
                "surface-hairline",
                active
                  ? cn("bg-accent text-foreground", tone.text)
                  : "text-muted-foreground opacity-70 hover:opacity-100",
              )}
            >
              <Icon className={cn("h-3 w-3", active && tone.text)} />
              {KIND_LABEL[k]}
              <span className="text-mono text-[10px] text-muted-foreground/70">
                {kindCounts.get(k) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* main three-pane layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px] gap-3 h-[640px]">
        {/* left: list */}
        <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0">
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search graph…"
                className="w-full h-8 pl-7 pr-2 rounded-md bg-background border border-border text-xs outline-none focus:border-ring transition"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto scrollbar-thin p-1">
            {filtered.map((n) => {
              const active = n.id === focusId;
              const Icon = KIND_ICON[n.kind];
              const tone = KIND_TONE[n.kind];
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setFocusId(n.id)}
                    onMouseEnter={() => setHoverId(n.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition",
                      active
                        ? "bg-accent text-foreground"
                        : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", tone.text)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{n.label}</div>
                      {n.sublabel && (
                        <div className="text-[10px] text-muted-foreground/80 truncate">
                          {n.sublabel}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                No matches.
              </li>
            )}
          </ul>
          <div className="p-2 border-t border-border/60 text-[10px] text-muted-foreground text-mono uppercase tracking-[0.12em]">
            {NODES.length} nodes · {filtered.length} shown
          </div>
        </div>

        {/* center: graph */}
        <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-mono text-[10px] uppercase tracking-[0.14em]">
                Focus
              </span>
              <span className="text-foreground">{focus.label}</span>
              <span>·</span>
              <span>{neighborCount} direct connections</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-mono uppercase tracking-[0.12em]">
              Click to recenter
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <IdentityGraph
              focusId={focusId}
              activeKinds={activeKinds}
              hoverId={hoverId}
              onFocus={setFocusId}
              onHover={setHoverId}
            />
          </div>
        </div>

        {/* right: detail */}
        <div className="rounded-md surface-hairline bg-card flex flex-col min-h-0">
          <EntityDetail node={focus} onFocus={setFocusId} />
        </div>
      </div>
    </PageContainer>
  );
}
