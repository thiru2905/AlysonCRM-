import { Link } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Building2,
  Briefcase,
  Linkedin,
  GitCompare,
  GitBranch,
} from "lucide-react";
import { ScoredCandidate } from "@/lib/recruiting/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/recruiting/Avatar";
import { ScoreRing } from "@/components/recruiting/score";
import { useRecruiterStore, MAX_COMPARE_CANDIDATES } from "@/lib/recruiting/store";
import { toast } from "@/components/recruiting/toast";
import { cn } from "@/lib/utils";

const PROVIDER_LABEL: Record<string, string> = {
  mock: "Mock",
  coresignal: "Coresignal",
  pdl: "PDL",
};

export function CandidateCard({ scored }: { scored: ScoredCandidate }) {
  const { candidate, score, matchedRequiredSkills } = scored;

  const isShortlisted = useRecruiterStore((s) => Boolean(s.shortlist[candidate.id]));
  const isComparing = useRecruiterStore((s) => s.compare.some((c) => c.id === candidate.id));
  const compareFull = useRecruiterStore(
    (s) => s.compare.length >= MAX_COMPARE_CANDIDATES
  );
  const toggleShortlist = useRecruiterStore((s) => s.toggleShortlist);
  const toggleCompare = useRecruiterStore((s) => s.toggleCompare);
  const addToPipeline = useRecruiterStore((s) => s.addToPipeline);

  const topSkills = candidate.skills.slice(0, 6);

  // Prefer the candidate's real LinkedIn URL; otherwise fall back to a LinkedIn
  // people search by name + company (useful when the provider redacts the URL).
  const hasDirectLinkedIn = Boolean(candidate.profileUrl);
  const linkedInHref = hasDirectLinkedIn
    ? candidate.profileUrl!
    : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        [candidate.fullName, candidate.currentCompany].filter(Boolean).join(" ")
      )}`;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <Avatar name={candidate.fullName} src={candidate.profileImageUrl} />
          <div className="min-w-0 flex-1">
            <Link
              to="/recruiting/candidates/$id"
              params={{ id: candidate.externalId }}
              className="block truncate font-semibold hover:underline"
            >
              {candidate.fullName}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {candidate.headline ?? candidate.currentJobTitle}
            </p>
          </div>
          <ScoreRing score={score} />
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
          {candidate.currentCompany && (
            <div className="flex items-center gap-2">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{candidate.currentCompany}</span>
            </div>
          )}
          {candidate.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{candidate.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Briefcase className="size-3.5 shrink-0" />
            <span>
              {candidate.yearsOfExperience ?? "?"} yrs experience
              {candidate.seniority ? ` \u00b7 ${candidate.seniority}` : ""}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {topSkills.map((skill) => (
            <Badge
              key={skill}
              variant={
                matchedRequiredSkills.some(
                  (m) => m.toLowerCase() === skill.toLowerCase()
                )
                  ? "success"
                  : "secondary"
              }
            >
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > topSkills.length && (
            <Badge variant="muted">+{candidate.skills.length - topSkills.length}</Badge>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Badge variant="outline" className="gap-1">
            {PROVIDER_LABEL[candidate.provider]}
          </Badge>

          <div className="flex items-center gap-1">
            <Button
              variant={isShortlisted ? "default" : "outline"}
              size="icon"
              aria-label="Shortlist"
              onClick={() => {
                toggleShortlist(candidate, score);
                toast(
                  isShortlisted ? "Removed from shortlist" : "Added to shortlist",
                  { tone: isShortlisted ? "default" : "success" }
                );
              }}
            >
              <Star className={cn("size-4", isShortlisted && "fill-current")} />
            </Button>

            <Button
              variant={isComparing ? "default" : "outline"}
              size="icon"
              aria-label="Compare"
              disabled={!isComparing && compareFull}
              onClick={() => {
                if (!isComparing && compareFull) return;
                toggleCompare(candidate);
              }}
            >
              <GitCompare className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Add to pipeline"
              onClick={() => {
                addToPipeline(candidate, "sourced", score);
                toast("Added to pipeline", { description: "Stage: Sourced", tone: "success" });
              }}
            >
              <GitBranch className="size-4" />
            </Button>

            <a
              href={linkedInHref}
              target="_blank"
              rel="noreferrer"
              aria-label={
                hasDirectLinkedIn ? "View LinkedIn profile" : "Find on LinkedIn"
              }
              title={
                hasDirectLinkedIn ? "View LinkedIn profile" : "Find on LinkedIn"
              }
            >
              <Button
                variant="outline"
                size="icon"
                className="border-[#0A66C2]/30 text-[#0A66C2] hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
              >
                <Linkedin className="size-4" />
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
