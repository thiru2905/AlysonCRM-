import { useMemo, useState } from "react";
import { Search, Sparkles, CornerDownLeft } from "lucide-react";
import { KnowledgeCard } from "./KnowledgeCard";
import { K_FACTS, kEntity } from "@/lib/knowledge/data";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What's blocking the Northwind renewal?",
  "Show everything Maya touched this week",
  "Who's evaluating competitors?",
  "Signals from Q4 pilot",
];

export function SemanticSearch() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const results = useMemo(() => {
    const query = (submitted ?? q).toLowerCase().trim();
    if (!query) return [];
    // naive semantic-ish ranking: token overlap + entity label hits + boost by confidence
    const tokens = query.split(/\s+/).filter(Boolean);
    return K_FACTS
      .map((f) => {
        const hay = (
          f.title +
          " " +
          f.excerpt +
          " " +
          f.entities.map((id) => kEntity(id).label).join(" ") +
          " " +
          f.source
        ).toLowerCase();
        let score = 0;
        for (const t of tokens) if (hay.includes(t)) score += 1;
        score = score / tokens.length + f.confidence * 0.15;
        return { f, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [q, submitted]);

  const answer = useMemo(() => {
    if (results.length === 0) return null;
    const top = results.slice(0, 3).map((r) => r.f);
    const sources = [...new Set(top.map((t) => t.source))];
    return {
      body:
        "Synthesized from " +
        top.length +
        " signals across " +
        sources.length +
        " sources. Highest-confidence facts are surfaced below with citations you can click through to the source.",
      confidence: Math.round(
        (top.reduce((s, t) => s + t.confidence, 0) / top.length) * 100,
      ),
    };
  }, [results]);

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3",
          "focus-within:border-border-strong focus-within:ring-2 focus-within:ring-ring/20 transition",
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSubmitted(q);
          }}
          placeholder="Ask anything — “what changed on Northwind this week?”"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        <button
          onClick={() => setSubmitted(q)}
          className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition"
        >
          <Sparkles className="h-3 w-3" />
          Ask
          <CornerDownLeft className="h-3 w-3 opacity-70" />
        </button>
      </div>

      {!submitted && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQ(s);
                setSubmitted(s);
              }}
              className="text-xs px-2.5 h-7 rounded-md border border-border bg-card hover:bg-accent transition text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {submitted && answer && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-ai" />
            Alyson · answer
            <div className="flex-1" />
            <span className="text-ai">{answer.confidence}% confidence</span>
          </div>
          <p className="text-sm mt-2 leading-relaxed">{answer.body}</p>
        </div>
      )}

      {submitted && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing indexed matches that yet. Try another phrasing or connect
          more sources.
        </div>
      )}

      <div className="space-y-2.5">
        {results.map(({ f }) => (
          <KnowledgeCard key={f.id} fact={f} />
        ))}
      </div>
    </div>
  );
}
