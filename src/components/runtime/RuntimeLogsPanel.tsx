import { useQuery } from "@tanstack/react-query";
import { listAutomationRunsFn } from "@/lib/agent/server";

export function RuntimeLogsPanel() {
  const runs = useQuery({
    queryKey: ["automation-runs"],
    queryFn: () => listAutomationRunsFn(),
    refetchInterval: 10_000,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-medium mb-3">Automation activity</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {(runs.data ?? []).map((run) => (
          <div key={run.id} className="rounded-lg border border-border/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium truncate">{run.userPrompt}</span>
              <span className="text-[10px] uppercase text-muted-foreground">{run.status}</span>
            </div>
            {run.resultSummary && (
              <p className="text-xs text-muted-foreground mt-1">{run.resultSummary}</p>
            )}
          </div>
        ))}
        {!runs.data?.length && (
          <p className="text-xs text-muted-foreground">No automation runs yet.</p>
        )}
      </div>
    </div>
  );
}
