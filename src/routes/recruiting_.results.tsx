import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CandidateCard } from "@/components/recruiting/candidate-card";
import { CandidateTable } from "@/components/recruiting/candidate-table";
import { CompareBar } from "@/components/recruiting/compare-bar";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/recruiting/states";
import { searchCandidates } from "@/lib/recruiting/api-client";
import { searchToFilters, filtersToSearch, countActiveFilters } from "@/lib/recruiting/filters";
import { useAsyncData } from "@/lib/recruiting/use-async-data";
import { useRecruiterStore } from "@/lib/recruiting/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recruiting_/results")({
  validateSearch: (search: Record<string, unknown>) => search as Record<string, string>,
  component: ResultsPage,
});

function ResultsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const addHistory = useRecruiterStore((s) => s.addHistory);

  const filtersKey = React.useMemo(
    () => new URLSearchParams(search as Record<string, string>).toString(),
    [search]
  );

  const filters = React.useMemo(() => searchToFilters(search), [search]);

  const [view, setView] = React.useState<"grid" | "table">("grid");

  const { data, loading, error, reload } = useAsyncData(
    () => searchCandidates(filters),
    [filtersKey],
    (res) =>
      addHistory({ filters, resultCount: res.total, provider: res.provider })
  );

  const goToPage = (page: number) => {
    navigate({ search: filtersToSearch({ ...filters, page }) });
  };

  const activeCount = countActiveFilters(filters);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Search Results"
        description={
          data
            ? `${data.total} candidate${data.total === 1 ? "" : "s"} matched via ${data.provider} in ${data.tookMs}ms`
            : "Running search..."
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border p-0.5">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setView("table")}
                aria-label="Table view"
              >
                <TableIcon className="size-4" />
              </Button>
            </div>
            <Link to="/recruiting/search" className={cn(buttonVariants({ variant: "outline" }))}>
              <SlidersHorizontal className="size-4" /> Refine
            </Link>
          </div>
        }
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {activeCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {filters.keywords?.map((k) => (
            <Badge key={k} variant="secondary">&ldquo;{k}&rdquo;</Badge>
          ))}
          {filters.jobTitles?.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
          {filters.requiredSkills?.map((t) => (
            <Badge key={t} variant="success">{t}</Badge>
          ))}
          {filters.optionalSkills?.map((t) => (
            <Badge key={t} variant="muted">{t}</Badge>
          ))}
          {filters.country && <Badge variant="secondary">{filters.country}</Badge>}
          {filters.city && <Badge variant="secondary">{filters.city}</Badge>}
          {filters.remotePreference && filters.remotePreference !== "any" && (
            <Badge variant="secondary">{filters.remotePreference}</Badge>
          )}
          {filters.seniority?.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      )}

      {!loading && !error && data?.notice && (
        <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          {data.notice}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Try broadening your filters - remove some required skills or widen the experience range."
          action={
            <Link to="/recruiting/search" className={cn(buttonVariants())}>
              Adjust search
            </Link>
          }
        />
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.results.map((scored) => (
                <CandidateCard key={scored.candidate.id} scored={scored} />
              ))}
            </div>
          ) : (
            <CandidateTable data={data.results} />
          )}

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => goToPage(data.page - 1)}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => goToPage(data.page + 1)}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <CompareBar />
    </PageContainer>
  );
}
