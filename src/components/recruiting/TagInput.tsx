import * as React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Detects whether a chunk of text is a Boolean/list expression (rather than a
// single multi-word value like "Agentic Workflow Development") so we know when
// to split it into many chips vs. keep it as one tag.
function looksLikeList(raw: string): boolean {
  return (
    /["'“”‘’]/.test(raw) ||
    raw.includes(",") ||
    raw.includes("\n") ||
    /(^|\s)(?:AND|OR|NOT)(?=\s|$)/i.test(raw)
  );
}

// Break a pasted Boolean query into individual terms. Strips quotes, parens and
// the AND/OR/NOT operators, and keeps quoted phrases (e.g. "First Class",
// "AI Agent", "0 to 1") intact as single values.
export function parsePastedTerms(text: string): string[] {
  let s = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/[()[\]]/g, " ");
  // Standalone boolean operators -> commas.
  s = s.replace(/(^|\s)(?:AND|OR|NOT)(?=\s|$)/gi, ",");
  // Adjacent quoted phrases with no operator ("RAG" "0 to 1") -> comma.
  s = s.replace(/"\s*"/g, '","');
  return s
    .split(",")
    .map((t) => t.replace(/["']/g, "").trim())
    .filter((t) => t.length > 0 && !/^(?:AND|OR|NOT)$/i.test(t));
}

export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
  id,
  highlights,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  id?: string;
  /** When set (after AI analysis), tags render green (keep) or red (drop). */
  highlights?: Record<string, "keep" | "drop">;
}) {
  const [draft, setDraft] = React.useState("");

  // Add a single, already-clean value.
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...value, v]);
    setDraft("");
  };

  // Add many values at once (deduped, case-insensitive, in one update).
  const addMany = (terms: string[]) => {
    const next = [...value];
    const seen = new Set(next.map((x) => x.toLowerCase()));
    for (const t of terms) {
      const key = t.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      next.push(t);
    }
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  // Commit raw input: split it if it looks like a Boolean/list, else add as one.
  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (looksLikeList(v)) addMany(parsePastedTerms(v));
    else add(v);
  };

  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const trimmedDraft = draft.trim();
  const filteredSuggestions = suggestions
    .filter(
      (s) =>
        trimmedDraft &&
        s.toLowerCase().includes(trimmedDraft.toLowerCase()) &&
        !value.some((x) => x.toLowerCase() === s.toLowerCase())
    )
    .slice(0, 6);

  // Offer an explicit "add your own" option whenever the typed value isn't an
  // exact match of an existing tag or suggestion (so custom / soft skills work).
  const showAddCustom =
    trimmedDraft.length > 0 &&
    !value.some((x) => x.toLowerCase() === trimmedDraft.toLowerCase()) &&
    !suggestions.some((s) => s.toLowerCase() === trimmedDraft.toLowerCase());

  const showDropdown = filteredSuggestions.length > 0 || showAddCustom;

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring"
        )}
      >
        {value.map((tag) => {
          const tone = highlights?.[tag];
          return (
          <span
            key={tag}
            title={
              tone === "drop"
                ? "AI suggests removing this filter — click × to delete"
                : tone === "keep"
                  ? "AI recommends keeping this filter"
                  : undefined
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
              tone === "drop" &&
                "border-destructive/50 bg-destructive/15 text-destructive ring-1 ring-destructive/20",
              tone === "keep" &&
                "border-success/50 bg-success/15 text-success ring-1 ring-success/20",
              !tone && "border-transparent bg-secondary text-secondary-foreground"
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className={cn(
                "rounded-sm p-0.5 transition-colors",
                tone === "drop"
                  ? "text-destructive hover:bg-destructive/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
          );
        })}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (looksLikeList(text)) {
              e.preventDefault();
              commit(text);
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[80px] flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground"
        />
      </div>
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              {s}
            </button>
          ))}
          {showAddCustom && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commit(trimmedDraft);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-left text-sm text-primary hover:bg-accent"
            >
              <Plus className="size-3.5" />
              {looksLikeList(trimmedDraft)
                ? "Split into separate tags"
                : `Add “${trimmedDraft}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
