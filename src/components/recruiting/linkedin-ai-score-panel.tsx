import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  applyAIScoreRecommendations,
  POOL_LABELS,
  scoreTone,
  type LinkedInAIScoreResult,
} from "@/lib/recruiting/linkedin/ai-score";
import type { LinkedInSearchConfig, SearchMode } from "@/lib/recruiting/linkedin/types";
import { MODE_OPTIONS } from "@/lib/recruiting/linkedin/optimizer";

type Props = {
  config: LinkedInSearchConfig;
  mode: SearchMode;
  query: string;
  includeLowSignal: boolean;
  hasBlocking: boolean;
  result: LinkedInAIScoreResult | null;
  onResultChange: (result: LinkedInAIScoreResult | null) => void;
  onApply: (next: {
    config: LinkedInSearchConfig;
    mode?: SearchMode;
    clearQueryOverride: boolean;
  }) => void;
};

export function LinkedInAIScorePanel({
  config,
  mode,
  query,
  includeLowSignal,
  hasBlocking,
  result,
  onResultChange,
  onApply,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const { scoreLinkedInSearchFn } = await import("@/lib/recruiting/server");
      const data = await scoreLinkedInSearchFn({
        data: { config, mode, query, includeLowSignal },
      });
      onResultChange(data);
    } catch (err) {
      onResultChange(null);
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function applyAll() {
    if (!result) return;
    onApply({
      config: applyAIScoreRecommendations(config, result),
      mode:
        result.recommendedMode !== mode ? result.recommendedMode : undefined,
      clearQueryOverride: true,
    });
  }

  const tone = result ? scoreTone(result.score) : null;
  const removeCount = result?.termActions.filter((t) => t.action === "remove").length ?? 0;
  const replaceCount = result?.termActions.filter((t) => t.action === "replace").length ?? 0;
  const addCount = result?.suggestedAdditions.reduce((n, a) => n + a.terms.length, 0) ?? 0;

  return (
    <Card className="border-ai/30 bg-gradient-to-br from-ai/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-ai" />
          AI relevance score
        </CardTitle>
        <CardDescription>
          DeepSeek reviews your filters and OR/AND structure, then suggests what to
          keep, drop, or add so you surface the right candidates — not just more
          candidates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={analyze}
            disabled={loading || hasBlocking}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {loading ? "Analyzing…" : "Analyze with AI"}
          </Button>
          {result && (removeCount > 0 || replaceCount > 0 || addCount > 0 || result.logicTips.length > 0) && (
            <Button size="sm" variant="outline" onClick={applyAll} className="gap-1.5">
              <Wand2 className="size-3.5" />
              Apply recommendations
            </Button>
          )}
        </div>

        {hasBlocking && (
          <p className="text-xs text-muted-foreground">
            Fix validation errors above before running AI analysis.
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-full border-2 text-lg font-semibold",
                  tone === "success" && "border-success text-success",
                  tone === "warning" && "border-warning text-warning",
                  tone === "destructive" && "border-destructive text-destructive"
                )}
              >
                {Math.round(result.score)}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{result.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{POOL_LABELS[result.poolEstimate]}</Badge>
                  {result.recommendedMode !== mode && (
                    <Badge variant="secondary">
                      Try {MODE_OPTIONS.find((m) => m.value === result.recommendedMode)?.label} mode
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {result.strengths.length > 0 && (
              <Section title="What's working" icon={CheckCircle2} tone="success">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.strengths.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </Section>
            )}

            {result.issues.length > 0 && (
              <Section title="Issues to fix" icon={XCircle} tone="destructive">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.issues.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </Section>
            )}

            {result.termActions.some((t) => t.action !== "keep") && (
              <Section title="Term actions" icon={Wand2}>
                <ul className="space-y-2 text-sm">
                  {result.termActions
                    .filter((t) => t.action !== "keep")
                    .map((t) => (
                      <li
                        key={`${t.group}-${t.term}`}
                        className={cn(
                          "rounded-md border px-2.5 py-2",
                          (t.action === "remove" || t.action === "replace") &&
                            "border-destructive/30 bg-destructive/10",
                          t.action === "keep" && "border-success/30 bg-success/10"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {t.action}
                          </Badge>
                          <span className="font-medium">{t.term}</span>
                          {t.replacement && (
                            <span className="text-muted-foreground">→ {t.replacement}</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t.reason}</p>
                      </li>
                    ))}
                </ul>
              </Section>
            )}

            {result.suggestedAdditions.length > 0 && (
              <Section title="Suggested additions" icon={Sparkles}>
                <ul className="space-y-2 text-sm">
                  {result.suggestedAdditions.map((add) => (
                    <li key={`${add.group}-${add.terms.join(",")}`}>
                      <span className="font-medium">{add.terms.join(", ")}</span>
                      <p className="text-xs text-muted-foreground">{add.reason}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {result.logicTips.length > 0 && (
              <Section title="OR / AND tips" icon={Sparkles}>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {result.logicTips.map((tip) => (
                    <li key={tip.field}>
                      • Switch <strong>{tip.field}</strong> to{" "}
                      {tip.recommended === "any" ? "OR" : "AND"} — {tip.reason}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "success" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5",
            tone === "success" && "text-success",
            tone === "destructive" && "text-destructive"
          )}
        />
        {title}
      </div>
      {children}
    </div>
  );
}
