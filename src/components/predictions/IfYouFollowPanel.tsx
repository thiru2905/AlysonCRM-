import { Link } from "@tanstack/react-router";
import { PORTFOLIO_FORECAST } from "@/lib/predictions/data";
import { ArrowUpRight, CircleAlert, Clock, DollarSign, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The "If you follow Alyson's recommendations today" panel.
 * Meant for the homepage: predictive, forward-looking, not analytical.
 */
export function IfYouFollowPanel() {
  const f = PORTFOLIO_FORECAST;
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="p-5 border-b border-border/60 flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-ai-soft border border-ai/40 grid place-items-center shrink-0">
          <Sparkles className="h-4 w-4 text-ai" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-ai">
            Alyson · daily forecast
          </div>
          <h2 className="text-display text-xl md:text-2xl leading-tight mt-1">
            If you follow Alyson's recommendations today —
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Rolled up across {f.contributingCount} live predictions · confidence{" "}
            {Math.round(f.confidence * 100)}%
          </p>
        </div>
        <Link
          to="/predictions"
          className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          Prediction center <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        <Headline
          icon={DollarSign}
          label="Predicted revenue"
          value={`$${(f.predictedRevenueUsd / 1000).toFixed(0)}k`}
          hint="close-weighted, 14d horizon"
          tone="up"
        />
        <Headline
          icon={TrendingUp}
          label="Predicted profit"
          value={`$${(f.predictedProfitUsd / 1000).toFixed(0)}k`}
          hint="after worker + tool cost"
          tone="up"
        />
        <Headline
          icon={Clock}
          label="Time saved"
          value={`${f.predictedTimeSavedHours}h`}
          hint="this week vs baseline"
          tone="ai"
        />
        <Headline
          icon={CircleAlert}
          label="Risk exposure"
          value={`$${(f.predictedRiskUsd / 1000).toFixed(0)}k`}
          hint="if churn signals are ignored"
          tone="down"
        />
      </div>

      <div className="grid md:grid-cols-[minmax(0,320px)_1fr] gap-px bg-border">
        {/* Schedule */}
        <div className="bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Recommended schedule
            </div>
            <div className="text-mono text-[10px] text-muted-foreground">
              today
            </div>
          </div>
          <ol className="space-y-2.5">
            {f.recommendedSchedule.map((b) => (
              <li key={b.id} className="flex items-start gap-3">
                <div className="w-12 shrink-0 text-mono text-[10px] uppercase tracking-wider text-muted-foreground pt-0.5">
                  {b.time}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {b.title}
                    </span>
                    {b.needsApproval && (
                      <span className="text-mono text-[9px] uppercase tracking-wider text-warning">
                        approve
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {b.detail}
                  </div>
                  <div className="mt-0.5 text-mono text-[10px] text-muted-foreground">
                    {b.worker} · {b.duration}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Expected outcomes */}
        <div className="bg-card p-5">
          <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
            Expected outcomes
          </div>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {f.expectedOutcomes.map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-border/60 bg-background p-3"
              >
                <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {o.label}
                </div>
                <div className="text-display text-lg leading-none mt-1">
                  {o.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {o.hint}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Every number is derived from live signals in{" "}
            <Link to="/knowledge" className="text-ai hover:underline">
              Knowledge
            </Link>
            , active{" "}
            <Link to="/experiments" className="text-ai hover:underline">
              Experiments
            </Link>
            , and the current{" "}
            <Link to="/workers" className="text-ai hover:underline">
              Worker
            </Link>{" "}
            queue. Ask "why" on any prediction to see the evidence.
          </p>
        </div>
      </div>
    </section>
  );
}

function Headline({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  hint: string;
  tone?: "up" | "down" | "ai";
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div
        className={cn(
          "text-display text-2xl md:text-3xl leading-none mt-2",
          tone === "up" && "text-emerald-500",
          tone === "down" && "text-destructive",
          tone === "ai" && "ai-gradient-text",
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
