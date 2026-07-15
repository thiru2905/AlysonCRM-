import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  ExternalLink,
  GitBranch,
  Loader2,
  Network,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildBranchSearches, sanitizeBranchSummary } from "@/lib/recruiting/linkedin/branch-builder";
import { useBranchPlanStore } from "@/lib/recruiting/branch-plan-store";
import type {
  BuiltSearchBranch,
  GenerateBranchesRequest,
  SearchBranchPlan,
} from "@/lib/recruiting/linkedin/branch-types";
import type { LinkedInSearchConfig, LinkedInTarget, SearchMode } from "@/lib/recruiting/linkedin/types";

const CATEGORY_LABEL: Record<string, string> = {
  core: "Core",
  adjacent: "Adjacent",
  senior: "Senior",
  junior: "Junior",
  specialist: "Specialist",
};

type Props = {
  config: LinkedInSearchConfig;
  mode: SearchMode;
  target: LinkedInTarget;
  includeLowSignal: boolean;
  hasBlocking: boolean;
  plan: SearchBranchPlan | null;
  onPlanChange: (plan: SearchBranchPlan | null) => void;
  onLoadBranch: (config: LinkedInSearchConfig) => void;
  onNotify: (message: string, tone?: "success" | "error" | "info") => void;
};

export function SearchBranchesPanel({
  config,
  mode,
  target,
  includeLowSignal,
  hasBlocking,
  plan,
  onPlanChange,
  onLoadBranch,
  onNotify,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [count, setCount] = React.useState(15);
  const [roleBrief, setRoleBrief] = React.useState("");

  const setSession = useBranchPlanStore((s) => s.setSession);
  const navigate = useNavigate();

  const built = React.useMemo<BuiltSearchBranch[]>(() => {
    if (!plan) return [];
    return buildBranchSearches({ config, mode, target, includeLowSignal }, plan);
  }, [plan, config, mode, target, includeLowSignal]);

  const enabledCount = built.length;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const { generateSearchBranchesFn } = await import("@/lib/recruiting/server");
      const payload: GenerateBranchesRequest = {
        config,
        mode,
        target,
        includeLowSignal,
        count,
        roleBrief: roleBrief.trim() || undefined,
      };
      const data = await generateSearchBranchesFn({ data: payload });
      onPlanChange(data);
      setSession({ plan: data, config, mode, target, includeLowSignal });
      onNotify(`Generated ${data.branches.length} branches — opening map…`, "success");
      navigate({ to: "/recruiting/linkedin/branches" });
    } catch (err) {
      onPlanChange(null);
      const message = err instanceof Error ? err.message : "Branch generation failed";
      setError(message);
      onNotify(message, "error");
    } finally {
      setLoading(false);
    }
  }

  function toggleBranch(id: string) {
    if (!plan) return;
    const next = {
      ...plan,
      branches: plan.branches.map((b) =>
        b.id === id ? { ...b, enabled: !b.enabled } : b
      ),
    };
    onPlanChange(next);
    setSession({ plan: next, config, mode, target, includeLowSignal });
  }

  async function copyAllLinks() {
    if (!built.length) return;
    const text = built
      .map(
        (b) =>
          `${b.label}\nPeople: ${b.urls?.people ?? b.built.url}\nSales Nav: ${b.urls?.sales ?? b.built.url}`
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`Copied ${built.length} branch links`, "success");
    } catch {
      onNotify("Could not copy links", "error");
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-4 text-primary" />
          Search branches
        </CardTitle>
        <CardDescription>
          Generate 10–20 LinkedIn search links — one role title per branch (OR variants).
          URLs use title-only Boolean OR logic so LinkedIn returns results; apply skills
          and colleges manually in filters to narrow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="branch-count">Number of branches</Label>
            <select
              id="branch-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {[10, 12, 15, 18, 20].map((n) => (
                <option key={n} value={n}>
                  {n} branches
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="role-brief">Role brief (optional)</Label>
            <Input
              id="role-brief"
              value={roleBrief}
              onChange={(e) => setRoleBrief(e.target.value)}
              placeholder="e.g. AI/ML hires in Mumbai, COEP alumni"
            />
          </div>
        </div>

        <Button
          className="w-full sm:w-auto"
          disabled={loading || hasBlocking}
          onClick={generate}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Generating branches…
            </>
          ) : (
            <>
              <Sparkles /> Generate branches with AI
            </>
          )}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {plan && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {sanitizeBranchSummary(plan.summary)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {enabledCount} active / {plan.branches.length} total
              </Badge>
              <Badge variant="outline">Base: {plan.baseRole}</Badge>
              {enabledCount > 0 && (
                <Button size="sm" variant="outline" onClick={copyAllLinks}>
                  <Copy /> Copy all links
                </Button>
              )}
              <Button size="sm" variant="default" asChild>
                <Link to="/recruiting/linkedin/branches">
                  <Network /> Open branch map
                </Link>
              </Button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {built.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-lg border border-border/70 bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{branch.label}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {CATEGORY_LABEL[branch.category] ?? branch.category}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {branch.rationale}
                      </p>
                      {branch.relatedTitles.length > 0 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          OR: {branch.relatedTitles.join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBranch(branch.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      title={branch.enabled ? "Disable branch" : "Enable branch"}
                    >
                      {branch.enabled ? (
                        <ToggleRight className="size-5 text-primary" />
                      ) : (
                        <ToggleLeft className="size-5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onLoadBranch(branch.config)}
                    >
                      Load in builder
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        const url = branch.urls?.people ?? branch.built.url;
                        void navigator.clipboard.writeText(url);
                        onNotify(`Copied People link for ${branch.label}`, "success");
                      }}
                    >
                      <Copy className="size-3" /> People
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() =>
                        window.open(
                          branch.urls?.people ?? branch.built.url,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <ExternalLink className="size-3" /> People
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() =>
                        window.open(
                          branch.urls?.sales ?? branch.built.url,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <ExternalLink className="size-3" /> Sales Nav
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {built.length === 0 && (
              <p className="text-xs text-muted-foreground">
                All branches are disabled. Toggle a branch on to see its link.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
