import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Star,
  Trash2,
  GitBranch,
  GitCompare,
  MapPin,
  Building2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/recruiting/Avatar";
import { EmptyState } from "@/components/recruiting/states";
import { CompareBar } from "@/components/recruiting/compare-bar";
import { useRecruiterStore, MAX_COMPARE_CANDIDATES } from "@/lib/recruiting/store";
import { toast } from "@/components/recruiting/toast";
import { formatDate } from "@/lib/recruiting/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recruiting_/shortlists")({
  component: ShortlistsPage,
});

function ShortlistsPage() {
  const shortlist = useRecruiterStore((s) => s.shortlist);
  const removeShortlist = useRecruiterStore((s) => s.removeShortlist);
  const addToPipeline = useRecruiterStore((s) => s.addToPipeline);
  const toggleCompare = useRecruiterStore((s) => s.toggleCompare);
  const compare = useRecruiterStore((s) => s.compare);

  const items = Object.values(shortlist).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Shortlists"
        description={`${items.length} candidate${items.length === 1 ? "" : "s"} saved for review.`}
        actions={
          <Link to="/recruiting/search" className={cn(buttonVariants({ variant: "outline" }))}>
            Find more
          </Link>
        }
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No shortlisted candidates"
          description="Star candidates from search results to build your shortlist."
          action={
            <Link to="/recruiting/search" className={cn(buttonVariants())}>
              Search candidates
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map(({ candidate: c, score, addedAt }) => {
            const isComp = compare.some((x) => x.id === c.id);
            const compFull = compare.length >= MAX_COMPARE_CANDIDATES;
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <Avatar name={c.fullName} src={c.profileImageUrl} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/recruiting/candidates/$id"
                      params={{ id: c.externalId }}
                      className="font-medium hover:underline"
                    >
                      {c.fullName}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">{c.headline}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {c.currentCompany && (
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3" /> {c.currentCompany}
                        </span>
                      )}
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {c.location}
                        </span>
                      )}
                      <span>Added {formatDate(addedAt)}</span>
                    </div>
                  </div>

                  {score !== undefined && (
                    <Badge variant={score >= 75 ? "success" : score >= 50 ? "warning" : "muted"}>
                      Score {Math.round(score)}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      variant={isComp ? "default" : "outline"}
                      size="icon"
                      aria-label="Compare"
                      disabled={!isComp && compFull}
                      onClick={() => toggleCompare(c)}
                    >
                      <GitCompare className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Add to pipeline"
                      onClick={() => {
                        addToPipeline(c, "shortlisted", score);
                        toast("Added to pipeline", { tone: "success" });
                      }}
                    >
                      <GitBranch className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove"
                      onClick={() => removeShortlist(c.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CompareBar />
    </PageContainer>
  );
}
