import { Link } from "@tanstack/react-router";
import { Building2, ExternalLink, MapPin, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/recruiting/Avatar";
import { profileStatusLabel, profileStatusTone } from "@/lib/profiles/format";
import type { ProfileWithMission } from "@/lib/agent/services/mission-profiles";
import { inviteStatusLabel, inviteStatusTone } from "@/lib/agent/connection-status";
import { cn } from "@/lib/utils";

export function ProfileCard({ profile }: { profile: ProfileWithMission }) {
  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md hover:border-border">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <Avatar name={profile.name} />
          <div className="min-w-0 flex-1">
            <Link
              to="/profiles/$id"
              params={{ id: profile.id }}
              className="block truncate font-semibold hover:underline"
            >
              {profile.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {profile.title ?? "Title unknown"}
            </p>
          </div>
          <Badge variant="outline" className={cn("shrink-0 capitalize text-[10px]", profileStatusTone(profile.status))}>
            {profileStatusLabel(profile.status)}
          </Badge>
        </div>

        {profile.missionName && (
          <p className="text-[11px] text-muted-foreground -mt-2">
            Mission: <span className="text-foreground">{profile.missionName}</span>
            {profile.missionAudience ? ` · ${profile.missionAudience}` : null}
          </p>
        )}

        <Badge
          variant="outline"
          className={cn("w-fit text-[10px] capitalize", inviteStatusTone(profile.inviteStatus))}
        >
          {inviteStatusLabel(profile.inviteStatus)}
        </Badge>

        <div className="grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
          {profile.company && (
            <div className="flex items-center gap-2">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{profile.company}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
          {profile.title && (
            <div className="flex items-center gap-2">
              <Briefcase className="size-3.5 shrink-0" />
              <span className="truncate">{profile.title}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <Link
            to="/profiles/$id"
            params={{ id: profile.id }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View profile
          </Link>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            LinkedIn
            <ExternalLink className="size-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
