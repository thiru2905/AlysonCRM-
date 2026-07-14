import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Activity, Coins, Database, AlertTriangle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/recruiting/states";
import { fetchUsage } from "@/lib/recruiting/api-client";
import { useAsyncData } from "@/lib/recruiting/use-async-data";
import { formatDateTime, formatNumber } from "@/lib/recruiting/format";

export const Route = createFileRoute("/recruiting_/usage")({
  component: UsagePage,
});

function UsagePage() {
  const { data, loading, error, reload } = useAsyncData(() => fetchUsage(150), []);
  const load = reload;

  const summary = data?.summary;

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="API Usage"
        description="Provider request log, credits consumed, and error tracking."
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {loading && !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Activity}
              label="Total requests"
              value={formatNumber(summary?.totalRequests ?? 0)}
            />
            <StatCard
              icon={Database}
              label="Records returned"
              value={formatNumber(summary?.totalRecords ?? 0)}
            />
            <StatCard
              icon={Coins}
              label="Credits used"
              value={formatNumber(summary?.totalCredits ?? 0)}
            />
            <StatCard
              icon={AlertTriangle}
              label="Errors"
              value={formatNumber(summary?.errorCount ?? 0)}
              tone={summary && summary.errorCount > 0 ? "destructive" : undefined}
            />
          </div>

          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Request log</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Active provider:
                <Badge variant="outline">{data?.activeProvider}</Badge>
                <span>· avg {summary?.avgResponseTimeMs ?? 0}ms</span>
              </div>
            </CardHeader>
            <CardContent>
              {!data || data.rows.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No API requests yet"
                  description="Run a candidate search to generate provider request logs."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Badge variant="outline">{r.provider}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.endpoint}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDateTime(r.requestDate)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.returnedRecords}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={r.httpStatus >= 400 ? "destructive" : "success"}>
                            {r.httpStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.responseTimeMs}ms
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.estimatedCredits}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                          {r.errorMessage ?? ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "destructive";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div
          className={
            tone === "destructive"
              ? "flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
              : "flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          }
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
