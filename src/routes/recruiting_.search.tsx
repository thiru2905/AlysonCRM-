import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Clock, Trash2, Play } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { SearchForm } from "@/components/recruiting/search-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecruiterStore } from "@/lib/recruiting/store";
import { filtersToSearch, countActiveFilters } from "@/lib/recruiting/filters";
import { formatDateTime } from "@/lib/recruiting/format";

export const Route = createFileRoute("/recruiting_/search")({
  component: SearchPage,
});

function SearchPage() {
  const saved = useRecruiterStore((s) => s.savedSearches);
  const deleteSavedSearch = useRecruiterStore((s) => s.deleteSavedSearch);
  const history = useRecruiterStore((s) => s.history);
  const clearHistory = useRecruiterStore((s) => s.clearHistory);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Candidate Search"
        description="Search across the configured professional-data provider using structured filters."
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <SearchForm />

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bookmark className="size-4" /> Saved searches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {saved.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No saved searches yet.
                </p>
              ) : (
                saved.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {countActiveFilters(s.filters)} filters
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to="/recruiting/results" search={filtersToSearch(s.filters)}>
                        <Button variant="ghost" size="icon" aria-label="Run search">
                          <Play className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => deleteSavedSearch(s.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" /> Search history
              </CardTitle>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {history.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Your recent searches will appear here.
                </p>
              ) : (
                history.slice(0, 8).map((h) => {
                  const label =
                    [h.filters.keywords].flat().filter(Boolean).join(", ") ||
                    h.filters.jobTitles?.join(", ") ||
                    h.filters.requiredSkills?.join(", ") ||
                    "All candidates";
                  return (
                    <Link
                      key={h.id}
                      to="/recruiting/results"
                      search={filtersToSearch(h.filters)}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(h.ranAt)}
                        </p>
                      </div>
                      <Badge variant="muted">{h.resultCount}</Badge>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
