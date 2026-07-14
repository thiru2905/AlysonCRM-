import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  GitCompare,
  GitBranch,
  ExternalLink,
  MapPin,
  Building2,
  Briefcase,
  GraduationCap,
  Trash2,
  Send,
} from "lucide-react";
import { PageContainer } from "@/components/shell/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/recruiting/Avatar";
import { Select } from "@/components/recruiting/Select";
import { ErrorState } from "@/components/recruiting/states";
import { CompareBar } from "@/components/recruiting/compare-bar";
import { fetchCandidate } from "@/lib/recruiting/api-client";
import { useAsyncData } from "@/lib/recruiting/use-async-data";
import { PIPELINE_STAGES, PIPELINE_STAGE_META, PipelineStage } from "@/lib/recruiting/types";
import { useRecruiterStore, MAX_COMPARE_CANDIDATES } from "@/lib/recruiting/store";
import { toast } from "@/components/recruiting/toast";
import { formatDateTime } from "@/lib/recruiting/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recruiting_/candidates/$id")({
  component: CandidateDetailPage,
});

function CandidateDetailPage() {
  const { id } = Route.useParams();

  const { data: candidate, loading, error, reload } = useAsyncData(
    () => fetchCandidate(id),
    [id]
  );
  const [draftNote, setDraftNote] = React.useState("");

  const shortlist = useRecruiterStore((s) => s.shortlist);
  const compare = useRecruiterStore((s) => s.compare);
  const pipeline = useRecruiterStore((s) => s.pipeline);
  const notes = useRecruiterStore((s) => s.notes);
  const toggleShortlist = useRecruiterStore((s) => s.toggleShortlist);
  const toggleCompare = useRecruiterStore((s) => s.toggleCompare);
  const addToPipeline = useRecruiterStore((s) => s.addToPipeline);
  const moveStage = useRecruiterStore((s) => s.moveStage);
  const addNote = useRecruiterStore((s) => s.addNote);
  const deleteNote = useRecruiterStore((s) => s.deleteNote);

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Card>
            <CardContent className="flex gap-4 p-6">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (error || !candidate) {
    return (
      <PageContainer>
        <Link to="/recruiting/results" className={cn(buttonVariants({ variant: "ghost" }), "mb-4")}>
          <ArrowLeft className="size-4" /> Back
        </Link>
        <ErrorState message={error ?? "Candidate not found"} onRetry={reload} />
      </PageContainer>
    );
  }

  const c = candidate;
  const isShort = Boolean(shortlist[c.id]);
  const isComp = compare.some((x) => x.id === c.id);
  const compFull = compare.length >= MAX_COMPARE_CANDIDATES;
  const inPipeline = pipeline[c.id];
  const candidateNotes = notes[c.id] ?? [];

  return (
    <PageContainer>
      <Link to="/recruiting/results" className={cn(buttonVariants({ variant: "ghost" }), "mb-4")}>
        <ArrowLeft className="size-4" /> Back to results
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={c.fullName} src={c.profileImageUrl} className="size-16 text-lg" />
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold">{c.fullName}</h1>
                  <p className="text-muted-foreground">{c.headline}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    {c.currentCompany && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="size-4" /> {c.currentCompany}
                      </span>
                    )}
                    {c.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4" /> {c.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-4" /> {c.yearsOfExperience ?? "?"} yrs
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{c.provider}</Badge>
                    {c.seniority && <Badge variant="secondary">{c.seniority}</Badge>}
                    {c.remotePreference && (
                      <Badge variant="secondary">{c.remotePreference}</Badge>
                    )}
                    {c.industry && <Badge variant="muted">{c.industry}</Badge>}
                  </div>
                </div>
              </div>

              {c.summary && (
                <>
                  <Separator className="my-5" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-4" /> Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {c.experiences.map((exp, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <span className="size-2 rounded-full bg-primary" />
                    {i < c.experiences.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.startDate ?? "?"} — {exp.isCurrent ? "Present" : exp.endDate ?? "?"}
                    </p>
                    {exp.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4" /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {c.education.length === 0 ? (
                <p className="text-sm text-muted-foreground">No education records.</p>
              ) : (
                c.education.map((ed, i) => (
                  <div key={i}>
                    <p className="font-medium">{ed.school}</p>
                    <p className="text-sm text-muted-foreground">
                      {[ed.degree, ed.fieldOfStudy].filter(Boolean).join(", ")}
                      {ed.endYear ? ` \u00b7 ${ed.endYear}` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant={isShort ? "default" : "outline"}
                onClick={() => {
                  toggleShortlist(c);
                  toast(isShort ? "Removed from shortlist" : "Added to shortlist", {
                    tone: isShort ? "default" : "success",
                  });
                }}
              >
                <Star className={cn("size-4", isShort && "fill-current")} />
                {isShort ? "Shortlisted" : "Add to shortlist"}
              </Button>
              <Button
                className="w-full justify-start"
                variant={isComp ? "default" : "outline"}
                disabled={!isComp && compFull}
                onClick={() => toggleCompare(c)}
              >
                <GitCompare className="size-4" />
                {isComp ? "In comparison" : "Add to compare"}
              </Button>

              {c.profileUrl && (
                <a href={c.profileUrl} target="_blank" rel="noreferrer" className="block">
                  <Button className="w-full justify-start" variant="ghost">
                    <ExternalLink className="size-4" /> View source profile
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="size-4" /> Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inPipeline ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current stage</p>
                  <Select
                    value={inPipeline.stage}
                    onChange={(e) => {
                      moveStage(c.id, e.target.value as PipelineStage);
                      toast("Stage updated", { tone: "success" });
                    }}
                    options={PIPELINE_STAGES.map((s) => ({
                      value: s,
                      label: PIPELINE_STAGE_META[s].label,
                    }))}
                  />
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    addToPipeline(c, "sourced");
                    toast("Added to pipeline", { tone: "success" });
                  }}
                >
                  <GitBranch className="size-4" /> Add to pipeline
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Add a private note..."
                  className="min-h-[60px]"
                />
              </div>
              <Button
                size="sm"
                disabled={!draftNote.trim()}
                onClick={() => {
                  addNote(c.id, draftNote.trim());
                  setDraftNote("");
                  toast("Note added", { tone: "success" });
                }}
              >
                <Send className="size-4" /> Add note
              </Button>

              <div className="space-y-2 pt-2">
                {candidateNotes.map((n) => (
                  <div key={n.id} className="rounded-md border border-border p-2.5 text-sm">
                    <p>{n.body}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(n.createdAt)}
                      </span>
                      <button
                        onClick={() => deleteNote(c.id, n.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete note"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Last refreshed {formatDateTime(c.lastRefreshedAt)}
          </p>
        </div>
      </div>

      <CompareBar />
    </PageContainer>
  );
}
