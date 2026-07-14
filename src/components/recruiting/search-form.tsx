import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Save, RotateCcw } from "lucide-react";
import {
  CandidateSearchFilters,
  RemotePreference,
  Seniority,
  SENIORITY_OPTIONS,
} from "@/lib/recruiting/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/recruiting/Select";
import { TagInput } from "@/components/recruiting/TagInput";
import { filtersToSearch } from "@/lib/recruiting/filters";
import { useRecruiterStore } from "@/lib/recruiting/store";
import { toast } from "@/components/recruiting/toast";
import {
  SKILL_SUGGESTIONS,
  TITLE_SUGGESTIONS,
  COMPANY_SUGGESTIONS,
  COUNTRY_SUGGESTIONS,
  INDUSTRY_SUGGESTIONS,
  REMOTE_OPTIONS,
  RESULTS_PER_PAGE_OPTIONS,
} from "@/lib/recruiting/constants";

const EMPTY: CandidateSearchFilters = {
  keywords: [],
  jobTitles: [],
  requiredSkills: [],
  optionalSkills: [],
  country: "",
  city: "",
  remotePreference: "any",
  currentCompany: "",
  previousCompanies: [],
  seniority: [],
  education: "",
  industry: "",
  resultsPerPage: 20,
  page: 1,
};

// Sensible demo defaults so a first-time search returns real candidates
// immediately (used only when no filters were passed in).
const DEMO_DEFAULT: CandidateSearchFilters = {
  ...EMPTY,
  jobTitles: ["Software Engineer"],
  requiredSkills: ["Python"],
  country: "United States",
};

export function SearchForm({ initial }: { initial?: CandidateSearchFilters }) {
  const navigate = useNavigate();
  const saveSearch = useRecruiterStore((s) => s.saveSearch);

  const [filters, setFilters] = React.useState<CandidateSearchFilters>({
    ...EMPTY,
    ...(initial ?? DEMO_DEFAULT),
  });

  const set = <K extends keyof CandidateSearchFilters>(
    key: K,
    value: CandidateSearchFilters[K]
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    navigate({
      to: "/recruiting/results",
      search: filtersToSearch({ ...filters, page: 1 }),
    });
  };

  const toggleSeniority = (value: Seniority) => {
    const current = filters.seniority ?? [];
    set(
      "seniority",
      current.includes(value)
        ? current.filter((s) => s !== value)
        : [...current, value]
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keywords &amp; Titles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="keywords">Keywords</Label>
            <TagInput
              id="keywords"
              value={filters.keywords ?? []}
              onChange={(v) => set("keywords", v)}
              placeholder="Type a keyword and press Enter"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Job titles</Label>
            <TagInput
              value={filters.jobTitles ?? []}
              onChange={(v) => set("jobTitles", v)}
              suggestions={TITLE_SUGGESTIONS}
              placeholder="Add a job title and press Enter"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Required skills</Label>
            <TagInput
              value={filters.requiredSkills ?? []}
              onChange={(v) => set("requiredSkills", v)}
              suggestions={SKILL_SUGGESTIONS}
              placeholder="Type any skill, press Enter to add"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Optional skills</Label>
            <TagInput
              value={filters.optionalSkills ?? []}
              onChange={(v) => set("optionalSkills", v)}
              suggestions={SKILL_SUGGESTIONS}
              placeholder="Type any skill, press Enter to add"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location &amp; Companies</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              list="country-list"
              placeholder="e.g. United States"
              value={filters.country ?? ""}
              onChange={(e) => set("country", e.target.value)}
            />
            <datalist id="country-list">
              {COUNTRY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. San Francisco"
              value={filters.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="remote">Remote preference</Label>
            <Select
              id="remote"
              value={filters.remotePreference ?? "any"}
              onChange={(e) => set("remotePreference", e.target.value as RemotePreference)}
              options={REMOTE_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              list="industry-list"
              placeholder="e.g. Fintech"
              value={filters.industry ?? ""}
              onChange={(e) => set("industry", e.target.value)}
            />
            <datalist id="industry-list">
              {INDUSTRY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Current company</Label>
            <Input
              placeholder="e.g. Stripe"
              value={filters.currentCompany ?? ""}
              onChange={(e) => set("currentCompany", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Previous companies</Label>
            <TagInput
              value={filters.previousCompanies ?? []}
              onChange={(v) => set("previousCompanies", v)}
              suggestions={COMPANY_SUGGESTIONS}
              placeholder="Past employers"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Experience &amp; Seniority</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="minY">Min years of experience</Label>
              <Input
                id="minY"
                type="number"
                min={0}
                max={60}
                value={filters.minYearsOfExperience ?? ""}
                onChange={(e) =>
                  set(
                    "minYearsOfExperience",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxY">Max years of experience</Label>
              <Input
                id="maxY"
                type="number"
                min={0}
                max={60}
                value={filters.maxYearsOfExperience ?? ""}
                onChange={(e) =>
                  set(
                    "maxYearsOfExperience",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                placeholder="e.g. Computer Science"
                value={filters.education ?? ""}
                onChange={(e) => set("education", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Seniority</Label>
            <div className="flex flex-wrap gap-3">
              {SENIORITY_OPTIONS.filter(
                (o, i, arr) => arr.findIndex((x) => x.value === o.value) === i
              ).map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={(filters.seniority ?? []).includes(o.value)}
                    onCheckedChange={() => toggleSeniority(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-48">
          <Select
            value={String(filters.resultsPerPage ?? 20)}
            onChange={(e) => set("resultsPerPage", Number(e.target.value))}
            options={RESULTS_PER_PAGE_OPTIONS}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setFilters(EMPTY)}>
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const name =
                filters.keywords?.join(", ") ||
                filters.jobTitles?.[0] ||
                filters.requiredSkills?.[0] ||
                "Untitled search";
              saveSearch(name, filters);
              toast("Search saved", { tone: "success" });
            }}
          >
            <Save className="size-4" /> Save search
          </Button>
          <Button type="submit">
            <Search className="size-4" /> Search candidates
          </Button>
        </div>
      </div>
    </form>
  );
}
