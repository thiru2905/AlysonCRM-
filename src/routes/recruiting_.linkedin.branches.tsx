import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  GitBranch,
  Network,
  RefreshCw,
  Sparkles,
  TreePine,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { SearchBranchGraphView } from "@/components/recruiting/search-branch-graph-view";
import { SearchBranchNodeDetail } from "@/components/recruiting/search-branch-node-detail";
import { BranchQuickList } from "@/components/recruiting/branch-quick-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranchPlanStore } from "@/lib/recruiting/branch-plan-store";
import { buildBranchSearches, sanitizeBranchSummary, isHeuristicPlanSummary } from "@/lib/recruiting/linkedin/branch-builder";
import { fetchStatus } from "@/lib/recruiting/api-client";
import {
  buildBranchTree,
  layoutBranchGraph,
  layoutBranchTree,
  type BranchGraphNode,
} from "@/lib/recruiting/linkedin/branch-graph-layout";
import type { GenerateBranchesRequest } from "@/lib/recruiting/linkedin/branch-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recruiting_/linkedin/branches")({
  component: BranchMapPage,
});

type ViewMode = "graph" | "tree";

function notify(message: string, tone?: "success" | "error" | "info") {
  if (tone === "success") toast.success(message);
  else if (tone === "error") toast.error(message);
  else toast(message);
}

function BranchMapPage() {
  const session = useBranchPlanStore();
  const [view, setView] = useState<ViewMode>("tree");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetchStatus()
      .then((s) => setAiReady(Boolean(s.env.DEEPSEEK_API_KEY)))
      .catch(() => setAiReady(null));
  }, []);

  const built = useMemo(() => {
    if (!session.plan) return [];
    return buildBranchSearches(
      {
        config: session.config,
        mode: session.mode,
        target: session.target,
        includeLowSignal: session.includeLowSignal,
      },
      session.plan
    );
  }, [session]);

  const graphLayout = useMemo(() => {
    if (!session.plan || !built.length) return null;
    return layoutBranchGraph(session.plan, built);
  }, [session.plan, built]);

  const treeLayout = useMemo(() => {
    if (!session.plan || !built.length) return null;
    const tree = buildBranchTree(session.plan, built);
    return layoutBranchTree(tree);
  }, [session.plan, built]);

  const layout = view === "graph" ? graphLayout : treeLayout;

  const selectedNode = useMemo(() => {
    if (!layout || !selectedId) return null;
    return layout.nodes.find((n) => n.id === selectedId) ?? null;
  }, [layout, selectedId]);

  useEffect(() => {
    if (!layout || selectedId) return;
    const firstBranch = layout.nodes.find((n) => n.kind === "branch");
    if (firstBranch) setSelectedId(firstBranch.id);
  }, [layout, selectedId]);

  function handleSelect(node: BranchGraphNode) {
    setSelectedId(node.id);
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`, "success");
    } catch {
      notify("Could not copy — please copy manually", "error");
    }
  }

  async function regenerate() {
    setGenerating(true);
    try {
      const { generateSearchBranchesFn } = await import("@/lib/recruiting/server");
      const payload: GenerateBranchesRequest = {
        config: session.config,
        mode: session.mode,
        target: session.target,
        includeLowSignal: session.includeLowSignal,
        count: session.plan?.branches.length ?? 15,
      };
      const plan = await generateSearchBranchesFn({ data: payload });
      session.setSession({
        plan,
        config: session.config,
        mode: session.mode,
        target: session.target,
        includeLowSignal: session.includeLowSignal,
      });
      setSelectedId(null);
      notify(`Regenerated ${plan.branches.length} branches`, "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Regeneration failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  const empty = !session.plan || built.length === 0;
  const staleHeuristic =
    Boolean(session.plan) &&
    isHeuristicPlanSummary(session.plan?.summary ?? "") &&
    aiReady === true;

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Search branch map"
        description="Explore AI-generated LinkedIn search branches as a graph or tree — click any role node to copy or open its search link."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/recruiting/linkedin">
              <ArrowLeft /> Search builder
            </Link>
          </Button>
        }
      />

      <RecruitingSubnav />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
          {(
            [
              { id: "graph" as const, label: "Graph", icon: Network },
              { id: "tree" as const, label: "Tree", icon: TreePine },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium transition-colors",
                view === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {!empty && (
          <>
            <Badge variant="secondary">{built.length} branches</Badge>
            <Badge variant="outline">Base: {session.plan?.baseRole}</Badge>
            <Button size="sm" variant="outline" disabled={generating} onClick={regenerate}>
              <RefreshCw className={cn(generating && "animate-spin")} />
              Regenerate
            </Button>
          </>
        )}
      </div>

      {empty ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center max-w-lg mx-auto">
          <GitBranch className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No branch map yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Generate branches in the LinkedIn Search Builder first — they will appear here
            as an interactive graph and tree.
          </p>
          <Button asChild className="mt-4">
            <Link to="/recruiting/linkedin">
              <Sparkles /> Go to search builder
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="space-y-3">
            {session.plan?.summary && (
              <p className="text-sm text-muted-foreground">
                {sanitizeBranchSummary(session.plan.summary)}
              </p>
            )}
            {staleHeuristic && (
              <div className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  DeepSeek is configured — this map used template branches from before AI was wired up.
                </p>
                <Button size="sm" disabled={generating} onClick={regenerate}>
                  <Sparkles className={cn(generating && "animate-pulse")} />
                  Regenerate with AI
                </Button>
              </div>
            )}
            {(session.config.achievements?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Achievements not in branch URLs.</strong>{" "}
                Your base search includes{" "}
                {session.config.achievements!.join(", ")} — these are too strict for
                LinkedIn&apos;s keyword box. Each branch opens with{" "}
                <em>title OR only</em>; add skills/colleges manually in LinkedIn filters.
              </div>
            )}
            {layout && (
              <>
                <SearchBranchGraphView
                  layout={layout}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  variant={view}
                />
                <BranchQuickList
                  branches={built}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" /> Core
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" /> Adjacent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-cyan-500" /> Specialist
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-purple-500" /> Senior
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500" /> Junior
              </span>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <SearchBranchNodeDetail
              node={selectedNode}
              onCopy={copyText}
              onNotify={notify}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
