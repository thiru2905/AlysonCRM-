import * as React from "react";
import { Loader2, Sparkles, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  mergeCollegeLists,
  parseCollegesHeuristic,
  type ParseCollegesResult,
} from "@/lib/recruiting/linkedin/parse-colleges";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: string[];
  onAdd: (colleges: string[]) => void;
};

export function CollegeBulkImportDialog({
  open,
  onOpenChange,
  existing,
  onAdd,
}: Props) {
  const [raw, setRaw] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [parsed, setParsed] = React.useState<ParseCollegesResult | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) {
      setRaw("");
      setError(null);
      setParsed(null);
      setSelected(new Set());
      setLoading(false);
    }
  }, [open]);

  const existingKeys = React.useMemo(
    () => new Set(existing.map((c) => c.trim().toLowerCase())),
    [existing]
  );

  async function runParse(mode: "ai" | "heuristic") {
    const text = raw.trim();
    if (!text) {
      setError("Paste a list of colleges first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let result: ParseCollegesResult;
      if (mode === "heuristic") {
        result = { colleges: parseCollegesHeuristic(text), source: "heuristic" };
      } else {
        const { parseCollegesFn } = await import("@/lib/recruiting/server");
        result = await parseCollegesFn({ data: { text } });
      }
      setParsed(result);
      setSelected(new Set(result.colleges));
      if (result.colleges.length === 0) {
        setError("No colleges found. Try a different format or edit the text.");
      }
    } catch (err) {
      setParsed(null);
      setSelected(new Set());
      setError(err instanceof Error ? err.message : "Could not parse colleges.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCollege(name: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  function selectAll(checked: boolean) {
    if (!parsed) return;
    setSelected(checked ? new Set(parsed.colleges) : new Set());
  }

  function handleAdd() {
    const toAdd = parsed?.colleges.filter((c) => selected.has(c)) ?? [];
    if (toAdd.length === 0) return;
    onAdd(toAdd);
    onOpenChange(false);
  }

  const selectedCount = parsed
    ? parsed.colleges.filter((c) => selected.has(c)).length
    : 0;
  const allSelected =
    parsed != null && parsed.colleges.length > 0 && selectedCount === parsed.colleges.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="size-4" />
            Add colleges in bulk
          </DialogTitle>
          <DialogDescription>
            Paste up to ~50 schools (one per line, comma-separated, or copied from a
            spreadsheet). DeepSeek splits them into individual college tags you can
            review before adding.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Stanford University\nMIT\nIIT Bombay\nGeorgia Institute of Technology\n…`}
            className="min-h-[140px] font-mono text-xs"
            disabled={loading}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => runParse("ai")}
              disabled={loading || !raw.trim()}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {loading ? "Parsing…" : "Parse with AI"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runParse("heuristic")}
              disabled={loading || !raw.trim()}
            >
              Quick split (no AI)
            </Button>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {parsed && parsed.colleges.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Found {parsed.colleges.length} college
                  {parsed.colleges.length === 1 ? "" : "s"}
                  {parsed.source === "ai" ? " (AI)" : " (quick split)"} — check the
                  ones to add
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => selectAll(v === true)}
                  />
                  Select all
                </label>
              </div>
              <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
                {parsed.colleges.map((college) => {
                  const isChecked = selected.has(college);
                  const already = existingKeys.has(college.trim().toLowerCase());
                  return (
                    <label
                      key={college}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                        isChecked && "border-primary bg-primary/10 text-primary",
                        !isChecked && "border-border bg-background text-muted-foreground",
                        already && "opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(v) => toggleCollege(college, v === true)}
                        className="size-3.5"
                      />
                      <span>{college}</span>
                      {already && (
                        <span className="text-[10px] uppercase text-muted-foreground">
                          added
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedCount === 0}>
            Add {selectedCount} college{selectedCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
