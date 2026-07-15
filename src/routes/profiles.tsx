import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchSavedProfiles } from "@/lib/agent/profiles-api";
import { getHermesEngineStatusFn } from "@/lib/agent/server";
import { profileStatusLabel } from "@/lib/profiles/format";
import { Rocket, Search, ShieldAlert, Users } from "lucide-react";

export const Route = createFileRoute("/profiles")({
  component: ProfilesPage,
});

function ProfilesPage() {
  const [query, setQuery] = useState("");
  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: () => fetchSavedProfiles(),
    refetchInterval: 5000,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const engineStatus = useQuery({
    queryKey: ["hermes-engine-status"],
    queryFn: () => getHermesEngineStatusFn(),
  });

  const outreachEnabled = engineStatus.data?.outreachEnabled ?? false;

  const filtered = useMemo(() => {
    const list = profiles.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.company ?? "").toLowerCase().includes(q) ||
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q) ||
        (p.missionName ?? "").toLowerCase().includes(q) ||
        (p.missionAudience ?? "").toLowerCase().includes(q)
    );
  }, [profiles.data, query]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of profiles.data ?? []) {
      counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [profiles.data]);

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        eyebrow="Primitives · Profiles"
        title="Saved profiles"
        description="Real people from Hermes missions — synced live from LinkedIn search and connection outreach."
        actions={
          <Link
            to="/hermes"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 transition"
          >
            Launch Hermes mission
          </Link>
        }
      />

      <div
        className={`mt-4 rounded-xl border px-4 py-3 flex gap-3 ${
          outreachEnabled
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-amber-500/30 bg-amber-500/10"
        }`}
      >
        {outreachEnabled ? (
          <Rocket className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {outreachEnabled ? (
            <>
              Profiles appear here as Hermes finds them from your keywords and branch searches.
              Approve each person in{" "}
              <Link to="/hermes" className="underline text-foreground">
                Hermes
              </Link>{" "}
              — track sent/accepted in{" "}
              <Link to="/browser-workers" className="underline text-foreground">
                Browser Workers
              </Link>
              .
            </>
          ) : (
            <>
              Enable live outreach in <code className="text-[10px]">.env</code> to send connection
              requests from Hermes. Profiles from missions still save here for review.
            </>
          )}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, mission…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {filtered.length} profile{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {statusCounts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {statusCounts.map(([status, count]) => (
            <Badge key={status} variant="secondary" className="capitalize">
              {profileStatusLabel(status)} · {count}
            </Badge>
          ))}
        </div>
      )}

      {profiles.isError && (
        <p className="mt-6 text-sm text-destructive text-center">
          Could not load profiles. Refresh the page or restart the CRM dev server.
        </p>
      )}

      {profiles.isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground text-center">Loading profiles…</p>
      ) : filtered.length ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center max-w-md mx-auto">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No Hermes profiles yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Launch a Hermes connect mission (start with 1–2 people), pick a branch keyword, approve
            each connection — real LinkedIn profiles will show up here and in Browser Workers.
          </p>
          <Link to="/hermes" className="inline-flex mt-4 text-sm text-primary hover:underline">
            Go to Hermes Engine
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
