import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCompare, X, Star } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/recruiting/Avatar";
import { EmptyState } from "@/components/recruiting/states";
import { useRecruiterStore, MAX_COMPARE_CANDIDATES } from "@/lib/recruiting/store";
import { CandidateProfile } from "@/lib/recruiting/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recruiting_/compare")({
  component: ComparePage,
});

type Row = {
  label: string;
  render: (c: CandidateProfile) => React.ReactNode;
};

const ROWS: Row[] = [
  { label: "Current title", render: (c) => c.currentJobTitle ?? "-" },
  { label: "Company", render: (c) => c.currentCompany ?? "-" },
  { label: "Location", render: (c) => c.location ?? "-" },
  { label: "Experience", render: (c) => `${c.yearsOfExperience ?? "?"} yrs` },
  { label: "Seniority", render: (c) => c.seniority ?? "-" },
  { label: "Remote", render: (c) => c.remotePreference ?? "-" },
  { label: "Industry", render: (c) => c.industry ?? "-" },
  {
    label: "Skills",
    render: (c) => (
      <div className="flex flex-wrap gap-1">
        {c.skills.slice(0, 10).map((s) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            {s}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    label: "Education",
    render: (c) =>
      c.education.length
        ? c.education
            .map((e) => [e.degree, e.fieldOfStudy].filter(Boolean).join(" "))
            .join(", ")
        : "-",
  },
];

function ComparePage() {
  const compare = useRecruiterStore((s) => s.compare);
  const toggleCompare = useRecruiterStore((s) => s.toggleCompare);
  const clearCompare = useRecruiterStore((s) => s.clearCompare);
  const toggleShortlist = useRecruiterStore((s) => s.toggleShortlist);
  const shortlist = useRecruiterStore((s) => s.shortlist);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Compare Candidates"
        description={`Compare up to ${MAX_COMPARE_CANDIDATES} candidates side by side.`}
        actions={
          compare.length > 0 ? (
            <Button variant="outline" onClick={clearCompare}>
              Clear all
            </Button>
          ) : undefined
        }
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {compare.length === 0 ? (
        <EmptyState
          icon={GitCompare}
          title="No candidates to compare"
          description="Select candidates using the compare action in search results or shortlists."
          action={
            <Link to="/recruiting/search" className={cn(buttonVariants())}>
              Search candidates
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-40 border-b border-border bg-card p-4 text-left align-bottom" />
                  {compare.map((c) => (
                    <th
                      key={c.id}
                      className="min-w-[200px] border-b border-l border-border p-4 text-left align-top"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col items-start gap-2">
                          <Avatar name={c.fullName} src={c.profileImageUrl} />
                          <div>
                            <Link
                              to="/recruiting/candidates/$id"
                              params={{ id: c.externalId }}
                              className="font-semibold hover:underline"
                            >
                              {c.fullName}
                            </Link>
                            <p className="text-xs font-normal text-muted-foreground">
                              {c.provider}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCompare(c)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${c.fullName}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="align-top">
                    <td className="sticky left-0 z-10 border-b border-border bg-card p-4 font-medium text-muted-foreground">
                      {row.label}
                    </td>
                    {compare.map((c) => (
                      <td key={c.id} className="border-b border-l border-border p-4">
                        {row.render(c)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky left-0 z-10 bg-card p-4" />
                  {compare.map((c) => {
                    const isShort = Boolean(shortlist[c.id]);
                    return (
                      <td key={c.id} className="border-l border-border p-4">
                        <Button
                          size="sm"
                          variant={isShort ? "default" : "outline"}
                          onClick={() => toggleShortlist(c)}
                        >
                          <Star className={cn("size-4", isShort && "fill-current")} />
                          {isShort ? "Shortlisted" : "Shortlist"}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
