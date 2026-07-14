import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Files,
  FolderOpen,
  AlertTriangle,
  Info,
  Pencil,
  Wand2,
  Lightbulb,
  ListPlus,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/shell/Page";
import { TagInput } from "@/components/recruiting/TagInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LinkedInAIScorePanel } from "@/components/recruiting/linkedin-ai-score-panel";
import { CollegeBulkImportDialog } from "@/components/recruiting/college-bulk-import-dialog";
import { useLinkedInStore } from "@/lib/recruiting/linkedin-store";
import {
  buildTermHighlightsForGroup,
  hasRemainingDropTerms,
  pruneAiResultAfterConfigChange,
  removeDropTermsFromConfig,
  type LinkedInAIScoreResult,
} from "@/lib/recruiting/linkedin/ai-score";
import {
  EMPTY_CONFIG,
  type LinkedInSearchConfig,
  type LinkedInTarget,
  type MatchLogic,
  type SearchMode,
} from "@/lib/recruiting/linkedin/types";
import {
  buildSearch,
  buildUrlFromQuery,
  TARGET_OPTIONS,
} from "@/lib/recruiting/linkedin/link-builder";
import { dedupe } from "@/lib/recruiting/linkedin/query-builder";
import { mergeCollegeLists } from "@/lib/recruiting/linkedin/parse-colleges";
import {
  MODE_OPTIONS,
  buildOptimizedQuery,
  optimizeConfig,
  getLowSignalTerms,
  type TermClassification,
} from "@/lib/recruiting/linkedin/optimizer";
import {
  SKILL_SUGGESTIONS,
  TITLE_SUGGESTIONS,
  COMPANY_SUGGESTIONS,
  COUNTRY_SUGGESTIONS,
  INDUSTRY_SUGGESTIONS,
  FUNCTION_SUGGESTIONS,
  EMPLOYMENT_TYPE_SUGGESTIONS,
  LANGUAGE_SUGGESTIONS,
  EDUCATION_SUGGESTIONS,
  COLLEGE_FILTER_SUGGESTIONS,
  SENIORITY_SUGGESTIONS,
} from "@/lib/recruiting/constants";

export const Route = createFileRoute("/recruiting_/linkedin")({
  component: LinkedInBuilderPage,
});

type Tone = "success" | "error" | "info";

function notify(message: string, tone?: Tone, description?: string) {
  const opts = description ? { description } : undefined;
  if (tone === "success") toast.success(message, opts);
  else if (tone === "error") toast.error(message, opts);
  else toast(message, opts);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify(`${label} copied to clipboard`, "success");
  } catch {
    notify("Couldn't copy — please copy manually", "error");
  }
}

function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = el.querySelector("input, textarea") as HTMLElement | null;
  window.setTimeout(() => input?.focus(), 300);
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function LogicToggle({
  value,
  onChange,
}: {
  value: MatchLogic;
  onChange: (v: MatchLogic) => void;
}) {
  const opts: { v: MatchLogic; label: string }[] = [
    { v: "any", label: "Match any (OR)" },
    { v: "all", label: "Match all (AND)" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded px-2 py-1 font-medium transition-colors",
            value === o.v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function LinkedInBuilderPage() {
  const [config, setConfig] = React.useState<LinkedInSearchConfig>(EMPTY_CONFIG);
  const [target, setTarget] = React.useState<LinkedInTarget>("people");
  const [mode, setMode] = React.useState<SearchMode>("precision");
  const [includeLowSignal, setIncludeLowSignal] = React.useState(false);
  const [queryOverride, setQueryOverride] = React.useState<string | null>(null);
  const [saveName, setSaveName] = React.useState("");
  const [collegeBulkOpen, setCollegeBulkOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [aiResult, setAiResult] = React.useState<LinkedInAIScoreResult | null>(null);

  const aiHighlights = React.useMemo(() => {
    if (!aiResult) return null;
    return {
      currentJobTitles: buildTermHighlightsForGroup(
        aiResult,
        "currentJobTitles",
        config.currentJobTitles
      ),
      previousJobTitles: buildTermHighlightsForGroup(
        aiResult,
        "previousJobTitles",
        config.previousJobTitles
      ),
      skills: buildTermHighlightsForGroup(aiResult, "skills", config.skills),
      keywords: buildTermHighlightsForGroup(aiResult, "keywords", config.keywords),
      universities: buildTermHighlightsForGroup(
        aiResult,
        "universities",
        config.universities
      ),
    };
  }, [aiResult, config]);

  function clearAiResult() {
    setAiResult(null);
  }

  const linkedinSearches = useLinkedInStore((s) => s.linkedinSearches);
  const saveLinkedinSearch = useLinkedInStore((s) => s.saveLinkedinSearch);
  const updateLinkedinSearch = useLinkedInStore((s) => s.updateLinkedinSearch);
  const deleteLinkedinSearch = useLinkedInStore((s) => s.deleteLinkedinSearch);
  const duplicateLinkedinSearch = useLinkedInStore(
    (s) => s.duplicateLinkedinSearch
  );

  const built = React.useMemo(
    () => buildSearch(config, target, { mode, includeLowSignal }),
    [config, target, mode, includeLowSignal]
  );
  const query = queryOverride ?? built.query;
  const url = React.useMemo(
    () => buildUrlFromQuery(target, query, config),
    [target, query, config]
  );

  const lowSignal = React.useMemo(() => getLowSignalTerms(config), [config]);
  const optimizedQuery = React.useMemo(
    () => buildOptimizedQuery(config),
    [config]
  );
  const canOptimize =
    optimizedQuery.length > 0 && optimizedQuery !== built.query;

  const { errors, warnings, conflicts, suggestions } = built.validation;
  const hasBlocking = errors.length > 0 || conflicts.length > 0;

  function syncAiHighlights(nextConfig: LinkedInSearchConfig) {
    setAiResult((prev) => {
      if (!prev) return null;
      const pruned = pruneAiResultAfterConfigChange(prev, nextConfig);
      // Keep green highlights until the user resets or re-runs analysis.
      return pruned;
    });
  }

  function patch(next: Partial<LinkedInSearchConfig>) {
    const updated = { ...config, ...next };
    setConfig(updated);
    setQueryOverride(null);
    syncAiHighlights(updated);
  }
  function setLogic(key: keyof LinkedInSearchConfig["logic"], v: MatchLogic) {
    const updated = {
      ...config,
      logic: { ...config.logic, [key]: v },
    };
    setConfig(updated);
    setQueryOverride(null);
    syncAiHighlights(updated);
  }

  function toggleCollege(college: string) {
    const exists = config.universities.some(
      (x) => x.toLowerCase() === college.toLowerCase()
    );
    const updated = {
      ...config,
      universities: exists
        ? config.universities.filter((x) => x.toLowerCase() !== college.toLowerCase())
        : [...config.universities, college],
    };
    setConfig(updated);
    setQueryOverride(null);
    syncAiHighlights(updated);
  }

  function addAllColleges() {
    patch({ universities: [...COLLEGE_FILTER_SUGGESTIONS] });
    notify("Added all target colleges", "info");
  }

  function addBulkColleges(colleges: string[]) {
    const merged = mergeCollegeLists(config.universities, colleges);
    patch({ universities: merged });
    notify(
      `Added ${merged.length - config.universities.length} college${merged.length - config.universities.length === 1 ? "" : "s"}`,
      "success"
    );
  }

  function resetAll() {
    setConfig(EMPTY_CONFIG);
    setQueryOverride(null);
    setEditingId(null);
    setSaveName("");
    clearAiResult();
    notify("Search reset", "info");
  }

  function applyOptimize() {
    setConfig((c) => optimizeConfig(c));
    setQueryOverride(null);
    notify(
      "Applied optimized keywords",
      "success",
      "Vague terms expanded, generic noise removed."
    );
  }

  function applyAIRecommendations({
    config: nextConfig,
    mode: nextMode,
    clearQueryOverride,
  }: {
    config: LinkedInSearchConfig;
    mode?: SearchMode;
    clearQueryOverride: boolean;
  }) {
    setConfig(nextConfig);
    if (nextMode) setMode(nextMode);
    if (clearQueryOverride) setQueryOverride(null);
    syncAiHighlights(nextConfig);
    notify("Applied AI recommendations", "success", "Filters updated from AI analysis.");
  }

  function removeRedTags() {
    if (!aiResult) return;
    const next = removeDropTermsFromConfig(config, aiResult);
    const pruned = pruneAiResultAfterConfigChange(aiResult, next);
    setConfig(next);
    setQueryOverride(null);
    setAiResult(pruned);
    notify(
      "Removed red tags",
      "success",
      hasRemainingDropTerms(pruned, next)
        ? "Green tags stay highlighted. Remove remaining red tags when ready."
        : "Green tags stay highlighted so you can see what to keep."
    );
  }

  // Remove a low-signal term everywhere and, if it has expansions, add them.
  function expandTerm(t: TermClassification) {
    setConfig((c) => {
      const strip = (arr: string[]) =>
        arr.filter((x) => x.toLowerCase() !== t.term.toLowerCase());
      return {
        ...c,
        currentJobTitles: strip(c.currentJobTitles),
        previousJobTitles: strip(c.previousJobTitles),
        keywords: strip(c.keywords),
        skills: dedupe([...strip(c.skills), ...t.suggestions]),
      };
    });
    setQueryOverride(null);
    notify(
      t.suggestions.length
        ? `Expanded “${t.term}” into specific terms`
        : `Removed low-signal term “${t.term}”`,
      "info"
    );
  }

  function handleSave() {
    if (built.validation.errors.length) {
      notify("Add at least one filter before saving", "error");
      return;
    }
    const name = saveName.trim() || "Untitled LinkedIn search";
    if (editingId) {
      updateLinkedinSearch(editingId, { name, config, query, url, target });
      notify("Saved search updated", "success");
    } else {
      const newId = saveLinkedinSearch({
        name,
        config,
        query,
        url,
        target,
        createdBy: "You",
      });
      setEditingId(newId);
      notify("Search saved", "success");
    }
  }

  function openSaved(id: string) {
    const s = linkedinSearches.find((x) => x.id === id);
    if (!s) return;
    setConfig({
      ...s.config,
      logic: { ...EMPTY_CONFIG.logic, ...s.config.logic },
    });
    setTarget(s.target);
    setQueryOverride(s.query);
    setSaveName(s.name);
    setEditingId(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    notify(`Opened “${s.name}”`, "info");
  }

  // Build the summary rows from the current config.
  const summary: { id: string; label: string; value: string }[] = [];
  const addSummary = (id: string, label: string, values: string[]) => {
    const v = values.map((x) => x.trim()).filter(Boolean);
    if (v.length) summary.push({ id, label, value: v.join(", ") });
  };
  addSummary("f-current-title", "Current job titles", config.currentJobTitles);
  addSummary("f-previous-title", "Previous job titles", config.previousJobTitles);
  addSummary("f-skills", "Skills", config.skills);
  addSummary("f-keywords", "Keywords", config.keywords);
  addSummary("f-current-company", "Current companies", config.currentCompanies);
  addSummary("f-previous-company", "Previous companies", config.previousCompanies);
  addSummary("f-locations", "Locations", config.locations);
  addSummary("f-industries", "Industry", config.industries);
  addSummary("f-functions", "Function / department", config.functions);
  addSummary("f-seniority", "Seniority", config.seniority);
  addSummary("f-employment", "Employment type", config.employmentTypes);
  addSummary("f-education", "Education", config.education);
  addSummary("f-universities", "Colleges", config.universities);
  addSummary("f-languages", "Languages", config.languages);
  if (config.minYears != null || config.maxYears != null) {
    summary.push({
      id: "f-experience",
      label: "Experience",
      value: `${config.minYears ?? 0}–${config.maxYears ?? "+"} years`,
    });
  }
  if (config.openToWork) {
    summary.push({ id: "f-opentowork", label: "Open to work", value: "Yes" });
  }
  addSummary("f-ex-keywords", "Excluded keywords", config.excludedKeywords);
  addSummary("f-ex-title", "Excluded titles", config.excludedJobTitles);
  addSummary("f-ex-company", "Excluded companies", config.excludedCompanies);
  addSummary("f-ex-location", "Excluded locations", config.excludedLocations);

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="LinkedIn Search Builder"
        description="Compose a complete Boolean search and generate a LinkedIn or Sales Navigator link. No scraping — use the link inside your own authorized account."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/recruiting">
                <ArrowLeft /> Recruiting
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw /> Reset search
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        {/* ------------------------------------------------------------- */}
        {/* LEFT: filters                                                 */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Roles &amp; skills</CardTitle>
              <CardDescription>
                Type any value and press Enter to add it — you are not limited to
                the suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiResult && (
                <div className="flex flex-wrap gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium text-success">
                    <span className="size-2.5 rounded-full bg-success" />
                    Green = keep
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
                    <span className="size-2.5 rounded-full bg-destructive" />
                    Red = remove (click × or use “Remove red tags”)
                  </span>
                </div>
              )}
              <Field
                id="f-current-title"
                label="Current job title"
                hint="OR / AND / add custom"
              >
                <div className="mb-2">
                  <LogicToggle
                    value={config.logic.jobTitles}
                    onChange={(v) => setLogic("jobTitles", v)}
                  />
                </div>
                <TagInput
                  value={config.currentJobTitles}
                  onChange={(v) => patch({ currentJobTitles: v })}
                  suggestions={TITLE_SUGGESTIONS}
                  placeholder="e.g. Software Engineer"
                  highlights={aiHighlights?.currentJobTitles}
                />
              </Field>

              <Field id="f-previous-title" label="Previous job title" hint="OR / AND / add custom">
                <div className="mb-2">
                  <LogicToggle
                    value={config.logic.previousJobTitles ?? "any"}
                    onChange={(v) => setLogic("previousJobTitles", v)}
                  />
                </div>
                <TagInput
                  value={config.previousJobTitles}
                  onChange={(v) => patch({ previousJobTitles: v })}
                  suggestions={TITLE_SUGGESTIONS}
                  placeholder="e.g. Full Stack Developer"
                  highlights={aiHighlights?.previousJobTitles}
                />
              </Field>

              <Field id="f-skills" label="Skills" hint="OR / AND / add custom">
                <div className="mb-2">
                  <LogicToggle
                    value={config.logic.skills}
                    onChange={(v) => setLogic("skills", v)}
                  />
                </div>
                <TagInput
                  value={config.skills}
                  onChange={(v) => patch({ skills: v })}
                  suggestions={SKILL_SUGGESTIONS}
                  placeholder="Type any skill, press Enter to add"
                  highlights={aiHighlights?.skills}
                />
              </Field>

              <Field id="f-keywords" label="Keywords" hint="OR / AND / add custom">
                <div className="mb-2">
                  <LogicToggle
                    value={config.logic.keywords}
                    onChange={(v) => setLogic("keywords", v)}
                  />
                </div>
                <TagInput
                  value={config.keywords}
                  onChange={(v) => patch({ keywords: v })}
                  placeholder="Type any keyword, press Enter to add"
                  highlights={aiHighlights?.keywords}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target colleges</CardTitle>
              <CardDescription>
                Colleges use LinkedIn&apos;s <code className="text-xs">school:</code>{" "}
                filter in the search query and link. Pick schools (OR) or add your
                own.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="f-universities" label="Colleges" hint="OR / AND">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <LogicToggle
                    value={config.logic.universities ?? "any"}
                    onChange={(v) => setLogic("universities", v)}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addAllColleges}>
                    Add all 10 colleges
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCollegeBulkOpen(true)}
                    className="gap-1.5"
                  >
                    <ListPlus className="size-3.5" />
                    Paste list…
                  </Button>
                </div>
                <CollegeBulkImportDialog
                  open={collegeBulkOpen}
                  onOpenChange={setCollegeBulkOpen}
                  existing={config.universities}
                  onAdd={addBulkColleges}
                />
                <TagInput
                  value={config.universities}
                  onChange={(v) => patch({ universities: v })}
                  suggestions={COLLEGE_FILTER_SUGGESTIONS}
                  placeholder="Select or type a college, press Enter"
                  highlights={aiHighlights?.universities}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COLLEGE_FILTER_SUGGESTIONS.map((college) => {
                    const selected = config.universities.some(
                      (x) => x.toLowerCase() === college.toLowerCase()
                    );
                    const highlight = aiHighlights?.universities[college];
                    return (
                      <button
                        key={college}
                        type="button"
                        onClick={() => toggleCollege(college)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs transition-colors",
                          highlight === "drop" &&
                            "border-destructive/50 bg-destructive/15 text-destructive ring-1 ring-destructive/20",
                          highlight === "keep" &&
                            "border-success/50 bg-success/15 text-success ring-1 ring-success/20",
                          !highlight &&
                            selected &&
                            "border-primary bg-primary/10 text-primary",
                          !highlight &&
                            !selected &&
                            "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {college}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Companies &amp; location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="f-current-company" label="Current company">
                <TagInput
                  value={config.currentCompanies}
                  onChange={(v) => patch({ currentCompanies: v })}
                  suggestions={COMPANY_SUGGESTIONS}
                  placeholder="e.g. Stripe"
                />
              </Field>
              <Field id="f-previous-company" label="Previous company">
                <TagInput
                  value={config.previousCompanies}
                  onChange={(v) => patch({ previousCompanies: v })}
                  suggestions={COMPANY_SUGGESTIONS}
                  placeholder="e.g. Google"
                />
              </Field>
              <Field id="f-locations" label="Location" hint="country or city">
                <TagInput
                  value={config.locations}
                  onChange={(v) => patch({ locations: v })}
                  suggestions={COUNTRY_SUGGESTIONS}
                  placeholder="e.g. United States"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Experience &amp; level</CardTitle>
              <CardDescription>
                Years of experience are encoded in the generated search link.
                Other fields here still need LinkedIn&apos;s filter panel (listed
                on the right).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="f-experience" label="Years of experience">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={config.minYears ?? ""}
                    onChange={(e) =>
                      patch({
                        minYears:
                          e.target.value === ""
                            ? undefined
                            : Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={config.maxYears ?? ""}
                    onChange={(e) =>
                      patch({
                        maxYears:
                          e.target.value === ""
                            ? undefined
                            : Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                </div>
              </Field>
              <Field id="f-seniority" label="Seniority level">
                <TagInput
                  value={config.seniority}
                  onChange={(v) => patch({ seniority: v })}
                  suggestions={SENIORITY_SUGGESTIONS}
                  placeholder="e.g. Senior"
                />
              </Field>
              <Field id="f-employment" label="Employment type">
                <TagInput
                  value={config.employmentTypes}
                  onChange={(v) => patch({ employmentTypes: v })}
                  suggestions={EMPLOYMENT_TYPE_SUGGESTIONS}
                  placeholder="e.g. Full-time"
                />
              </Field>
              <Field id="f-functions" label="Function / department">
                <TagInput
                  value={config.functions}
                  onChange={(v) => patch({ functions: v })}
                  suggestions={FUNCTION_SUGGESTIONS}
                  placeholder="e.g. Engineering"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={config.openToWork}
                  onChange={(e) => patch({ openToWork: e.target.checked })}
                />
                Open to work only
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="f-industries" label="Industry">
                <TagInput
                  value={config.industries}
                  onChange={(v) => patch({ industries: v })}
                  suggestions={INDUSTRY_SUGGESTIONS}
                  placeholder="e.g. Fintech"
                />
              </Field>
              <Field id="f-education" label="Education level">
                <TagInput
                  value={config.education}
                  onChange={(v) => patch({ education: v })}
                  suggestions={EDUCATION_SUGGESTIONS}
                  placeholder="e.g. Master's Degree"
                />
              </Field>
              <Field id="f-languages" label="Language">
                <TagInput
                  value={config.languages}
                  onChange={(v) => patch({ languages: v })}
                  suggestions={LANGUAGE_SUGGESTIONS}
                  placeholder="e.g. English"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exclude (NOT)</CardTitle>
              <CardDescription>
                Candidates matching these will be filtered out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="f-ex-keywords" label="Excluded keywords">
                <TagInput
                  value={config.excludedKeywords}
                  onChange={(v) => patch({ excludedKeywords: v })}
                  placeholder="e.g. Recruiter"
                />
              </Field>
              <Field id="f-ex-title" label="Excluded job titles">
                <TagInput
                  value={config.excludedJobTitles}
                  onChange={(v) => patch({ excludedJobTitles: v })}
                  suggestions={TITLE_SUGGESTIONS}
                  placeholder="e.g. Intern"
                />
              </Field>
              <Field id="f-ex-company" label="Excluded companies">
                <TagInput
                  value={config.excludedCompanies}
                  onChange={(v) => patch({ excludedCompanies: v })}
                  suggestions={COMPANY_SUGGESTIONS}
                  placeholder="e.g. Acme"
                />
              </Field>
              <Field id="f-ex-location" label="Excluded locations">
                <TagInput
                  value={config.excludedLocations}
                  onChange={(v) => patch({ excludedLocations: v })}
                  suggestions={COUNTRY_SUGGESTIONS}
                  placeholder="e.g. India"
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT: strategy + validation + query + link + saved           */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Search strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search strategy</CardTitle>
              <CardDescription>
                {MODE_OPTIONS.find((m) => m.value === mode)?.hint}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="inline-flex w-full rounded-md border border-border bg-muted/40 p-0.5 text-xs">
                {MODE_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setMode(m.value);
                      setQueryOverride(null);
                    }}
                    className={cn(
                      "flex-1 rounded px-2 py-1.5 font-medium transition-colors",
                      mode === m.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={includeLowSignal}
                  onChange={(e) => {
                    setIncludeLowSignal(e.target.checked);
                    setQueryOverride(null);
                  }}
                />
                Include low-signal / generic keywords
              </label>
            </CardContent>
          </Card>

          <LinkedInAIScorePanel
            config={config}
            mode={mode}
            query={query}
            includeLowSignal={includeLowSignal}
            hasBlocking={hasBlocking}
            result={aiResult}
            onResultChange={setAiResult}
            onApply={applyAIRecommendations}
            onRemoveRedTags={removeRedTags}
          />

          {/* Validation */}
          {(errors.length > 0 ||
            conflicts.length > 0 ||
            warnings.length > 0 ||
            suggestions.length > 0) && (
            <div className="space-y-2">
              {[...errors, ...conflicts].map((m) => (
                <div
                  key={m}
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
              {warnings.map((m) => (
                <div
                  key={m}
                  className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
                >
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
              {suggestions.map((m) => (
                <div
                  key={m}
                  className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
                >
                  <Lightbulb className="mt-0.5 size-4 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search summary</CardTitle>
              <CardDescription>Click any row to edit that filter.</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No filters selected yet. Add criteria on the left to get started.
                </p>
              ) : (
                <dl className="space-y-2.5">
                  {summary.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => focusField(row.id)}
                      className="flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <dt className="text-xs font-medium text-muted-foreground">
                        {row.label}
                      </dt>
                      <dd className="text-sm">{row.value}</dd>
                    </button>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Keyword quality */}
          {lowSignal.length > 0 && (
            <Card className="border-warning/40">
              <CardHeader>
                <CardTitle className="text-base">Keyword quality</CardTitle>
                <CardDescription>
                  These terms are too broad on their own and are excluded by
                  default. Expand them into specific terms for better relevance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lowSignal.map((t) => (
                    <li
                      key={t.term}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{t.term}</span>
                        {t.suggestions.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            → {t.suggestions.join(", ")}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => expandTerm(t)}
                      >
                        {t.suggestions.length ? "Expand" : "Remove"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Optimized query suggestion */}
          {canOptimize && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="size-4 text-primary" /> Optimized query
                </CardTitle>
                <CardDescription>
                  A recommended, higher-relevance version — vague terms expanded,
                  generic noise removed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                  {optimizedQuery}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={applyOptimize}>
                    <Wand2 /> Apply optimization
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQueryOverride(optimizedQuery);
                      notify("Using optimized query", "info");
                    }}
                  >
                    Use as query only
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyText(optimizedQuery, "Optimized query")}
                  >
                    <Copy /> Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boolean query */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Boolean search query</CardTitle>
              <CardDescription>
                Editable — refine it before copying into LinkedIn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={query}
                onChange={(e) => setQueryOverride(e.target.value)}
                rows={5}
                spellCheck={false}
                placeholder="Your Boolean query will appear here…"
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setQueryOverride(null);
                    notify("Query regenerated from filters", "info");
                  }}
                >
                  <Search /> Generate LinkedIn search
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!query}
                  onClick={() => copyText(query, "Search query")}
                >
                  <Copy /> Copy query
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQueryOverride(null);
                    notify("Query regenerated", "info");
                  }}
                >
                  <RefreshCw /> Regenerate
                </Button>
              </div>
              {queryOverride !== null && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Pencil className="size-3" /> Using your edited query.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Split queries for Sales Navigator / Recruiter */}
          {(built.titleQuery || built.keywordQuery || built.schoolQuery) && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="size-4 text-primary" /> Sales Navigator &amp; Recruiter
                </CardTitle>
                <CardDescription>
                  These tools have separate boxes. Paste each part into its own
                  field (not everything into Keywords) for far better results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {built.titleQuery && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Paste into “Job title” filter</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyText(built.titleQuery, "Job title query")}
                      >
                        <Copy /> Copy
                      </Button>
                    </div>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                      {built.titleQuery}
                    </pre>
                  </div>
                )}
                {built.keywordQuery && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Paste into “Keywords” box (skills only)</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyText(built.keywordQuery, "Keywords query")}
                      >
                        <Copy /> Copy
                      </Button>
                    </div>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                      {built.keywordQuery}
                    </pre>
                  </div>
                )}
                {built.schoolQuery && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Paste into “School” filter</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyText(built.schoolQuery, "School query")}
                      >
                        <Copy /> Copy
                      </Button>
                    </div>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                      {built.schoolQuery}
                    </pre>
                  </div>
                )}
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="mt-0.5 size-3 shrink-0" />
                  Apply Seniority, Function, Location etc. from the panel below —
                  and add them one at a time so you can see the count before
                  over-narrowing.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search link</CardTitle>
              <CardDescription>
                Opens in your own authorized LinkedIn account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ln-destination">Destination</Label>
                <select
                  id="ln-destination"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as LinkedInTarget)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TARGET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Generated URL</Label>
                <Input readOnly value={url} className="font-mono text-xs" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hasBlocking}
                  onClick={() => copyText(url, "Search link")}
                >
                  <Copy /> Copy link
                </Button>
                <Button
                  size="sm"
                  disabled={hasBlocking}
                  onClick={() =>
                    window.open(
                      buildUrlFromQuery("people", query, config),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <ExternalLink /> Open in LinkedIn
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={hasBlocking}
                  onClick={() =>
                    window.open(
                      buildUrlFromQuery("sales", query, config),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <ExternalLink /> Open in Sales Navigator
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual filters */}
          {built.manualFilters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Filters to apply manually in LinkedIn
                </CardTitle>
                <CardDescription>
                  These can&apos;t be reliably encoded in a URL, so apply them
                  using LinkedIn&apos;s own filter panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {built.manualFilters.map((f) => (
                    <li key={f.label} className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {f.label}
                      </span>
                      <span className="text-sm">{f.value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Save */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Save this search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Senior Full Stack AI Engineers — USA"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save /> {editingId ? "Update saved search" : "Save search"}
                </Button>
                {editingId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setSaveName("");
                      notify("Now saving as a new search", "info");
                    }}
                  >
                    Save as new
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saved list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Saved searches
                {linkedinSearches.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {linkedinSearches.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linkedinSearches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No saved searches yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {linkedinSearches.map((s) => (
                    <li key={s.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {TARGET_OPTIONS.find((t) => t.value === s.target)
                              ?.label ?? s.target}{" "}
                            · Updated {formatDate(s.updatedAt)}
                          </p>
                        </div>
                        {editingId === s.id && (
                          <Badge variant="secondary">Editing</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSaved(s.id)}
                        >
                          <FolderOpen /> Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateLinkedinSearch(s.id)}
                        >
                          <Files /> Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyText(s.url, "Search link")}
                        >
                          <Copy /> Copy link
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            deleteLinkedinSearch(s.id);
                            if (editingId === s.id) {
                              setEditingId(null);
                              setSaveName("");
                            }
                            notify("Saved search deleted", "info");
                          }}
                        >
                          <Trash2 /> Delete
                        </Button>
                      </div>
                      <Separator className="mt-3" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
