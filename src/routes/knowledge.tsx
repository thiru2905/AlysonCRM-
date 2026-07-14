import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/shell/Page";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { KnowledgeTimeline } from "@/components/knowledge/KnowledgeTimeline";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { SourceExplorer } from "@/components/knowledge/SourceExplorer";
import { SemanticSearch } from "@/components/knowledge/SemanticSearch";
import { RelationshipExplorer } from "@/components/knowledge/RelationshipExplorer";
import { AutoSummaries } from "@/components/knowledge/AutoSummaries";
import { SourceIcon } from "@/components/knowledge/SourceIcon";
import {
  K_ENTITIES,
  K_FACTS,
  SOURCES,
  type SourceKind,
} from "@/lib/knowledge/data";
import { cn } from "@/lib/utils";
import {
  Activity,
  Clock,
  Network,
  Database,
  Search,
  Sparkles,
  GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/knowledge")({
  component: KnowledgeManager,
});

type View =
  | "feed"
  | "summaries"
  | "timeline"
  | "graph"
  | "relationships"
  | "sources"
  | "search";

const VIEWS: { id: View; label: string; icon: typeof Activity; hint: string }[] = [
  { id: "feed", label: "Feed", icon: Activity, hint: "Live signals as they arrive" },
  { id: "summaries", label: "Summaries", icon: Sparkles, hint: "Auto-generated per entity" },
  { id: "timeline", label: "Timeline", icon: Clock, hint: "Everything, by day" },
  { id: "graph", label: "Graph", icon: Network, hint: "Entities and their ties" },
  { id: "relationships", label: "Relationships", icon: GitBranch, hint: "Explore any entity" },
  { id: "sources", label: "Sources", icon: Database, hint: "What's connected, what's syncing" },
  { id: "search", label: "Search", icon: Search, hint: "Ask anything, cited answers" },
];

function KnowledgeManager() {
  const [view, setView] = useState<View>("feed");
  const [sourceFilter, setSourceFilter] = useState<SourceKind | "all">("all");
  const [focusId, setFocusId] = useState<string>("e_northwind");

  const filteredFacts = useMemo(
    () =>
      sourceFilter === "all"
        ? K_FACTS
        : K_FACTS.filter((f) => f.source === sourceFilter),
    [sourceFilter],
  );

  return (
    <PageContainer className="max-w-[1200px]">
      {/* Header */}
      <header className="pb-6 border-b border-border/60">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
              Knowledge Manager
            </div>
            <h1 className="text-display text-2xl md:text-[28px] leading-tight">
              Organizational knowledge, alive.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Alyson continuously reads your world — mail, calendar, meetings,
              browser, Slack, CRM, ATS, documents, notes, calls — and turns it
              into a graph you can ask questions of, with every answer cited.
            </p>
          </div>
          <LiveBadge />
        </div>

        {/* Source strip */}
        <div className="mt-5 flex items-center gap-1.5 flex-wrap">
          {SOURCES.map((s) => (
            <button
              key={s.kind}
              onClick={() => {
                setSourceFilter(s.kind);
                setView("feed");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-md border text-xs transition",
                sourceFilter === s.kind
                  ? "border-border-strong bg-accent"
                  : "border-border bg-card hover:bg-accent",
              )}
              title={`${s.label} · synced`}
            >
              <SourceIcon kind={s.kind} size="xs" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-0 z-10 -mx-5 md:-mx-8 mt-2 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="px-5 md:px-8 flex items-center gap-0.5 overflow-x-auto">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const on = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 h-11 px-3 text-sm transition whitespace-nowrap",
                  on
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
                {on && (
                  <span className="absolute left-2 right-2 -bottom-px h-px bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="pt-6">
        {view === "feed" && (
          <FeedView
            facts={filteredFacts}
            sourceFilter={sourceFilter}
            onSource={setSourceFilter}
            onEntity={(id) => {
              setFocusId(id);
              setView("relationships");
            }}
          />
        )}
        {view === "summaries" && <AutoSummaries />}
        {view === "timeline" && <KnowledgeTimeline facts={filteredFacts} />}
        {view === "graph" && (
          <div className="space-y-4">
            <KnowledgeGraph focusId={focusId} onFocus={setFocusId} />
            <p className="text-xs text-muted-foreground text-center">
              {K_ENTITIES.length} entities · continuously updated as new signals
              arrive
            </p>
          </div>
        )}
        {view === "relationships" && (
          <RelationshipExplorer focusId={focusId} onFocus={setFocusId} />
        )}
        {view === "sources" && (
          <div className="grid md:grid-cols-[minmax(0,360px)_1fr] gap-6">
            <SourceExplorer active={sourceFilter} onSelect={setSourceFilter} />
            <div>
              <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                Latest from{" "}
                {sourceFilter === "all" ? "all sources" : sourceFilter}
              </div>
              <div className="space-y-2.5">
                {filteredFacts.slice(0, 8).map((f) => (
                  <KnowledgeCard key={f.id} fact={f} compact />
                ))}
              </div>
            </div>
          </div>
        )}
        {view === "search" && <SemanticSearch />}
      </div>
    </PageContainer>
  );
}

function FeedView({
  facts,
  sourceFilter,
  onSource,
  onEntity,
}: {
  facts: typeof K_FACTS;
  sourceFilter: SourceKind | "all";
  onSource: (k: SourceKind | "all") => void;
  onEntity: (id: string) => void;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_minmax(0,320px)] gap-6">
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>Live feed</span>
          {sourceFilter !== "all" && (
            <>
              <span>·</span>
              <span>filtered by {sourceFilter}</span>
              <button
                onClick={() => onSource("all")}
                className="ml-1 underline hover:text-foreground"
              >
                clear
              </button>
            </>
          )}
          <div className="flex-1" />
          <span>{facts.length} signals</span>
        </div>
        {facts.map((f) => (
          <KnowledgeCard key={f.id} fact={f} onEntityClick={onEntity} />
        ))}
      </div>
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-ai" />
            Alyson · daily digest
          </div>
          <p className="text-sm mt-2 leading-relaxed">
            Northwind renewal is the highest-leverage motion this week. The
            budget just expanded, but the SOC2 gap is still the pacing item.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Synthesized from {facts.length} signals across{" "}
            {new Set(facts.map((f) => f.source)).size} sources.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Trending entities
          </div>
          <ul className="space-y-1.5">
            {trendingEntities(facts)
              .slice(0, 5)
              .map(([id, count]) => {
                const e = K_ENTITIES.find((x) => x.id === id);
                if (!e) return null;
                return (
                  <li key={id}>
                    <button
                      onClick={() => onEntity(id)}
                      className="w-full flex items-center gap-2 text-sm py-1 hover:text-ai transition"
                    >
                      <span className="flex-1 text-left truncate">
                        {e.label}
                      </span>
                      <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.kind}
                      </span>
                      <span className="text-mono text-[10px] text-muted-foreground w-6 text-right">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function trendingEntities(facts: typeof K_FACTS): [string, number][] {
  const counts = new Map<string, number>();
  for (const f of facts)
    for (const e of f.entities) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function LiveBadge() {
  return (
    <div className="hidden md:inline-flex items-center gap-2 h-7 px-2.5 rounded-md border border-border bg-card text-[11px] text-muted-foreground shrink-0">
      <span className="relative h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-emerald-400" />
        <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
      </span>
      <span className="text-mono uppercase tracking-wider text-[10px]">
        Syncing · 10 sources
      </span>
    </div>
  );
}
