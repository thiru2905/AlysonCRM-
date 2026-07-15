import { Copy, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BranchGraphNode } from "@/lib/recruiting/linkedin/branch-graph-layout";
import { categoryLabel } from "@/lib/recruiting/linkedin/branch-graph-layout";

type Props = {
  node: BranchGraphNode | null;
  onCopy: (text: string, label: string) => void;
  onNotify: (message: string, tone?: "success" | "error" | "info") => void;
};

function branchUrls(branch: NonNullable<BranchGraphNode["branch"]>) {
  return {
    people: branch.urls?.people ?? branch.built.url,
    sales: branch.urls?.sales ?? branch.built.url,
    recruiter: branch.urls?.recruiter ?? branch.built.url,
  };
}

function branchQueries(branch: NonNullable<BranchGraphNode["branch"]>) {
  return {
    people: branch.queries?.people ?? branch.built.query,
    sales: branch.queries?.sales ?? branch.built.query,
  };
}

export function SearchBranchNodeDetail({ node, onCopy, onNotify }: Props) {
  if (!node) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium">Select a node</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Click any branch in the graph or tree to copy or open its LinkedIn search link.
        </p>
      </div>
    );
  }

  if (node.kind === "root") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Badge variant="secondary">Root role</Badge>
        <h3 className="text-lg font-semibold">{node.label}</h3>
        <p className="text-sm text-muted-foreground">
          This is your base hiring role. Branches expand into similar titles that share
          your filters (location, skills, colleges, etc.).
        </p>
      </div>
    );
  }

  if (node.kind === "category") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Badge variant="outline">{node.category ? categoryLabel(node.category) : "Group"}</Badge>
        <h3 className="text-lg font-semibold">{node.label}</h3>
        <p className="text-sm text-muted-foreground">
          Category grouping for related job titles. Click a leaf branch to get its search link.
        </p>
      </div>
    );
  }

  const branch = node.branch;
  if (!branch) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Branch details unavailable.</p>
      </div>
    );
  }

  const urls = branchUrls(branch);
  const queries = branchQueries(branch);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {branch.category}
        </Badge>
        {branch.relatedTitles.length > 0 && (
          <Badge variant="secondary">{branch.relatedTitles.length + 1} titles OR</Badge>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">{branch.label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{branch.rationale}</p>
      </div>

      {branch.relatedTitles.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Also matches: {branch.relatedTitles.join(", ")}
        </p>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Link2 className="size-3.5" /> LinkedIn People Search
          </p>
          <div className="rounded-md border border-border bg-muted/30 p-2 font-mono text-[10px] break-all max-h-20 overflow-y-auto">
            {urls.people}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Link2 className="size-3.5" /> Sales Navigator
          </p>
          <div className="rounded-md border border-border bg-muted/30 p-2 font-mono text-[10px] break-all max-h-20 overflow-y-auto">
            {urls.sales}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Boolean query (People Search)
        </p>
        <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed max-h-24 overflow-y-auto text-foreground/90">
          {queries.people}
        </pre>
      </div>

      {branch.built.titleQuery && (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-1 text-xs">
          <p className="font-medium text-foreground">Sales Nav — paste into filters</p>
          <p className="text-muted-foreground">
            <span className="font-medium">Job title:</span>{" "}
            <span className="font-mono text-[10px]">{branch.built.titleQuery}</span>
          </p>
          {branch.built.keywordQuery && (
            <p className="text-muted-foreground">
              <span className="font-medium">Keywords:</span>{" "}
              <span className="font-mono text-[10px]">{branch.built.keywordQuery}</span>
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground rounded-md bg-muted/40 px-2 py-1.5">
        Branch links use title OR only (LinkedIn Boolean) so results appear — skills,
        colleges, and years from your base search are listed below; apply them manually
        in LinkedIn&apos;s filter panel to narrow down.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onCopy(urls.people, `${branch.label} (People)`)}>
          <Copy className="size-3.5" /> Copy People link
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            window.open(urls.people, "_blank", "noopener,noreferrer");
            onNotify(`Opened ${branch.label} in LinkedIn`, "info");
          }}
        >
          <ExternalLink className="size-3.5" /> Open People Search
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            window.open(urls.sales, "_blank", "noopener,noreferrer");
            onNotify(`Opened ${branch.label} in Sales Navigator`, "info");
          }}
        >
          <ExternalLink className="size-3.5" /> Open Sales Nav
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(queries.people, `${branch.label} Boolean`)}
        >
          <Copy className="size-3.5" /> Copy Boolean
        </Button>
      </div>
    </div>
  );
}
