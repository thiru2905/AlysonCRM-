import { createFileRoute, Link } from "@tanstack/react-router";
import { GitBranch, X, ChevronRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/recruiting/Avatar";
import { EmptyState } from "@/components/recruiting/states";
import { useRecruiterStore } from "@/lib/recruiting/store";
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_META,
  PipelineStage,
} from "@/lib/recruiting/types";
import { toast } from "@/components/recruiting/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recruiting_/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const pipeline = useRecruiterStore((s) => s.pipeline);
  const moveStage = useRecruiterStore((s) => s.moveStage);
  const removeFromPipeline = useRecruiterStore((s) => s.removeFromPipeline);

  const items = Object.values(pipeline);

  const byStage = (stage: PipelineStage) =>
    items
      .filter((i) => i.stage === stage)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const nextStage = (stage: PipelineStage): PipelineStage | null => {
    const idx = PIPELINE_STAGES.indexOf(stage);
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 2) return null; // stop before hired/rejected auto-advance
    return PIPELINE_STAGES[idx + 1];
  };

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Hiring Pipeline"
        description={`${items.length} candidate${items.length === 1 ? "" : "s"} across ${PIPELINE_STAGES.length} stages.`}
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Pipeline is empty"
          description="Add candidates to the pipeline from search results, shortlists, or a candidate profile."
          action={
            <Link to="/recruiting/search" className={cn(buttonVariants())}>
              Source candidates
            </Link>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageItems = byStage(stage);
            const meta = PIPELINE_STAGE_META[stage];
            return (
              <div key={stage} className="flex w-72 shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>
                  <Badge variant="muted">{stageItems.length}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 rounded-lg bg-muted/40 p-2">
                  {stageItems.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      No candidates
                    </p>
                  ) : (
                    stageItems.map(({ candidate: c, score }) => {
                      const next = nextStage(stage);
                      return (
                        <Card key={c.id}>
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start gap-2">
                              <Avatar
                                name={c.fullName}
                                src={c.profileImageUrl}
                                className="size-8 text-xs"
                              />
                              <div className="min-w-0 flex-1">
                                <Link
                                  to="/recruiting/candidates/$id"
                                  params={{ id: c.externalId }}
                                  className="block truncate text-sm font-medium hover:underline"
                                >
                                  {c.fullName}
                                </Link>
                                <p className="truncate text-xs text-muted-foreground">
                                  {c.currentJobTitle}
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromPipeline(c.id)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Remove"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              {score !== undefined ? (
                                <Badge
                                  variant={
                                    score >= 75 ? "success" : score >= 50 ? "warning" : "muted"
                                  }
                                  className="text-[10px]"
                                >
                                  {Math.round(score)}
                                </Badge>
                              ) : (
                                <span />
                              )}
                              <div className="flex gap-1">
                                {stage !== "rejected" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-destructive"
                                    onClick={() => moveStage(c.id, "rejected")}
                                  >
                                    Reject
                                  </Button>
                                )}
                                {next && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      moveStage(c.id, next);
                                      toast(`Moved to ${PIPELINE_STAGE_META[next].label}`, {
                                        tone: "success",
                                      });
                                    }}
                                  >
                                    {PIPELINE_STAGE_META[next].label}
                                    <ChevronRight className="size-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
