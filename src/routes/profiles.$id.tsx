import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/shell/Page";
import { Avatar } from "@/components/recruiting/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileFn } from "@/lib/agent/server";
import {
  formatProfileDate,
  profileStatusLabel,
  profileStatusTone,
} from "@/lib/profiles/format";
import {
  ArrowLeft,
  Building2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profiles/$id")({
  component: ProfileDetailPage,
});

function ProfileDetailPage() {
  const { id } = Route.useParams();
  const profile = useQuery({
    queryKey: ["profile", id],
    queryFn: () => getProfileFn({ data: { id } }),
  });

  if (profile.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </PageContainer>
    );
  }

  if (profile.isError || !profile.data) {
    throw notFound();
  }

  const p = profile.data;

  return (
    <PageContainer className="max-w-4xl">
      <Link
        to="/profiles"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to profiles
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-start gap-4 pb-6 border-b border-border/60">
        <Avatar name={p.name} className="h-16 w-16 text-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("capitalize", profileStatusTone(p.status))}>
              {profileStatusLabel(p.status)}
            </Badge>
          </div>
          <h1 className="text-display text-2xl md:text-[28px] leading-tight">{p.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{p.title ?? "Title unknown"}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {p.company && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {p.company}
              </span>
            )}
            {p.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {p.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button asChild variant="default" size="sm">
            <a href={p.profileUrl} target="_blank" rel="noreferrer">
              Open on LinkedIn
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Company" value={p.company} />
            <Row label="Title" value={p.title} />
            <Row label="Location" value={p.location} />
            <Row label="Added" value={formatProfileDate(p.createdAt)} />
            <Row label="Last activity" value={formatProfileDate(p.lastActionAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Outreach draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            {p.draftMessage ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/50 p-3">
                {p.draftMessage}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No draft yet. Run an automation task to generate a personalized message, then copy
                it and send manually on LinkedIn.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {p.actions.length ? (
            <ul className="space-y-3">
              {p.actions.map((action) => (
                <li
                  key={action.id}
                  className="flex items-center justify-between gap-3 text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0"
                >
                  <span className="capitalize">{action.actionType.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="capitalize">
                      {action.status}
                    </Badge>
                    <span>{formatProfileDate(action.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No actions recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium truncate">{value ?? "—"}</span>
    </div>
  );
}
