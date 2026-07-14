import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2, Briefcase, Search, MapPin, Pencil } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/shell/Page";
import { RecruitingSubnav } from "@/components/recruiting/subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select } from "@/components/recruiting/Select";
import { TagInput } from "@/components/recruiting/TagInput";
import { EmptyState } from "@/components/recruiting/states";
import { toast } from "@/components/recruiting/toast";
import { useRecruiterStore } from "@/lib/recruiting/store";
import {
  Job,
  RemotePreference,
  Seniority,
  SENIORITY_OPTIONS,
  CandidateSearchFilters,
} from "@/lib/recruiting/types";
import { filtersToSearch } from "@/lib/recruiting/filters";
import { formatDate } from "@/lib/recruiting/format";
import { cn } from "@/lib/utils";
import {
  SKILL_SUGGESTIONS,
  REMOTE_OPTIONS,
  COUNTRY_SUGGESTIONS,
} from "@/lib/recruiting/constants";

export const Route = createFileRoute("/recruiting_/jobs")({
  component: JobsPage,
});

const STATUS_META: Record<
  Job["status"],
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  open: { label: "Open", variant: "success" },
  on_hold: { label: "On hold", variant: "warning" },
  closed: { label: "Closed", variant: "muted" },
};

type JobForm = {
  title: string;
  company: string;
  location: string;
  country: string;
  city: string;
  remotePreference: RemotePreference;
  seniority: Seniority;
  requiredSkills: string[];
  optionalSkills: string[];
  minYearsOfExperience: string;
  description: string;
  status: Job["status"];
};

const EMPTY_FORM: JobForm = {
  title: "",
  company: "Alyson",
  location: "",
  country: "",
  city: "",
  remotePreference: "any",
  seniority: "mid",
  requiredSkills: [],
  optionalSkills: [],
  minYearsOfExperience: "",
  description: "",
  status: "open",
};

function jobToFilters(job: Job): CandidateSearchFilters {
  return {
    jobTitles: [job.title],
    requiredSkills: job.requiredSkills,
    optionalSkills: job.optionalSkills,
    seniority: job.seniority ? [job.seniority] : undefined,
    remotePreference: job.remotePreference,
    minYearsOfExperience: job.minYearsOfExperience,
    country: job.country,
    city: job.city,
  };
}

function JobsPage() {
  const jobs = useRecruiterStore((s) => s.jobs);
  const addJob = useRecruiterStore((s) => s.addJob);
  const updateJob = useRecruiterStore((s) => s.updateJob);
  const deleteJob = useRecruiterStore((s) => s.deleteJob);

  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<JobForm>(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditingId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location ?? "",
      country: job.country ?? "",
      city: job.city ?? "",
      remotePreference: job.remotePreference ?? "any",
      seniority: job.seniority ?? "mid",
      requiredSkills: job.requiredSkills,
      optionalSkills: job.optionalSkills,
      minYearsOfExperience:
        job.minYearsOfExperience !== undefined
          ? String(job.minYearsOfExperience)
          : "",
      description: job.description ?? "",
      status: job.status,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast("Title is required", { tone: "error" });
      return;
    }
    const fields = {
      title: form.title.trim(),
      company: form.company.trim() || "Alyson",
      location: form.location.trim() || undefined,
      country: form.country.trim() || undefined,
      city: form.city.trim() || undefined,
      remotePreference: form.remotePreference,
      seniority: form.seniority,
      requiredSkills: form.requiredSkills,
      optionalSkills: form.optionalSkills,
      minYearsOfExperience: form.minYearsOfExperience
        ? Number(form.minYearsOfExperience)
        : undefined,
      description: form.description.trim() || undefined,
      status: form.status,
    };

    if (editingId) {
      updateJob(editingId, fields);
      toast("Job updated", { tone: "success" });
    } else {
      addJob({
        ...fields,
        id: Math.random().toString(36).slice(2),
        createdAt: new Date().toISOString(),
      });
      toast("Job posted", { tone: "success" });
    }

    setOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const seniorityOptions = SENIORITY_OPTIONS.filter(
    (o, i, arr) => arr.findIndex((x) => x.value === o.value) === i
  ).map((o) => ({ value: o.value, label: o.label }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="APPLICATION · RECRUITING"
        title="Job Postings"
        description="Post the roles you're hiring for, then source matching candidates in one click."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Post a job
          </Button>
        }
      />
      <div className="mt-6">
        <RecruitingSubnav />
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Post a job to source and match candidates against it."
          action={<Button onClick={openCreate}>Post a job</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const loc =
              [job.city, job.country].filter(Boolean).join(", ") || job.location;
            return (
              <Card key={job.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.company}
                      </p>
                    </div>
                    <Badge variant={STATUS_META[job.status].variant}>
                      {STATUS_META[job.status].label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {loc && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {loc}
                      </span>
                    )}
                    {job.seniority && <span>{job.seniority}</span>}
                    {job.minYearsOfExperience !== undefined && (
                      <span>{job.minYearsOfExperience}+ yrs</span>
                    )}
                  </div>

                  {job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.map((s) => (
                        <Badge key={s} variant="success" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {job.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {job.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <Link
                      to="/recruiting/results"
                      search={filtersToSearch(jobToFilters(job))}
                      className={cn(buttonVariants({ size: "sm" }), "flex-1")}
                    >
                      <Search className="size-4" /> Source candidates
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Edit job"
                      onClick={() => openEdit(job)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete job"
                      onClick={() => {
                        deleteJob(job.id);
                        toast("Job deleted", { tone: "info" });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit job" : "Post a job"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this role's details."
                : "Define a role to source candidates for."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location label</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Remote (US)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hiring country</Label>
              <Input
                list="job-country-list"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="e.g. United States"
              />
              <datalist id="job-country-list">
                {COUNTRY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-[11px] text-muted-foreground">
                Used to source candidates from this country only.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Hiring city</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. San Francisco"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remote preference</Label>
              <Select
                value={form.remotePreference}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remotePreference: e.target.value as RemotePreference,
                  })
                }
                options={REMOTE_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Seniority</Label>
              <Select
                value={form.seniority}
                onChange={(e) =>
                  setForm({ ...form, seniority: e.target.value as Seniority })
                }
                options={seniorityOptions}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Required skills</Label>
              <TagInput
                value={form.requiredSkills}
                onChange={(v) => setForm({ ...form, requiredSkills: v })}
                suggestions={SKILL_SUGGESTIONS}
                placeholder="Must-have skills"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Optional skills</Label>
              <TagInput
                value={form.optionalSkills}
                onChange={(v) => setForm({ ...form, optionalSkills: v })}
                suggestions={SKILL_SUGGESTIONS}
                placeholder="Nice-to-have skills"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min years of experience</Label>
              <Input
                type="number"
                value={form.minYearsOfExperience}
                onChange={(e) =>
                  setForm({ ...form, minYearsOfExperience: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Job["status"] })
                }
                options={[
                  { value: "open", label: "Open" },
                  { value: "on_hold", label: "On hold" },
                  { value: "closed", label: "Closed" },
                ]}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Role summary..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              {editingId ? "Save changes" : "Post job"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="mt-4 text-xs text-muted-foreground">
        Job data is stored locally in your browser. Last updated{" "}
        {formatDate(new Date())}.
      </p>
    </PageContainer>
  );
}
