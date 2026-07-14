import { z } from "zod";
import { PIPELINE_STAGES } from "./types";

const remotePref = z.enum(["any", "remote", "hybrid", "onsite"]);
const seniority = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "manager",
  "director",
  "executive",
]);

/** Accepts either a string[] or a comma-separated string and normalizes to string[]. */
const stringList = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const arr = Array.isArray(v) ? v : v.split(",");
    const cleaned = arr.map((s) => s.trim()).filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  });

export const candidateSearchFiltersSchema = z.object({
  keywords: stringList,
  jobTitles: stringList,
  requiredSkills: stringList,
  optionalSkills: stringList,
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  remotePreference: remotePref.optional(),
  currentCompany: z.string().trim().optional(),
  previousCompanies: stringList,
  minYearsOfExperience: z.coerce.number().min(0).max(60).optional(),
  maxYearsOfExperience: z.coerce.number().min(0).max(60).optional(),
  seniority: z
    .union([z.array(seniority), seniority])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  education: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  resultsPerPage: z.coerce.number().int().min(5).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ValidatedSearchFilters = z.infer<typeof candidateSearchFiltersSchema>;

export const getCandidateSchema = z.object({
  externalId: z.string().min(1),
});

export const pipelineUpdateSchema = z.object({
  candidateId: z.string().min(1),
  toStage: z.enum(PIPELINE_STAGES),
  fromStage: z.enum(PIPELINE_STAGES).optional(),
  jobId: z.string().optional(),
});

export const jobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  remotePreference: remotePref.optional(),
  seniority: seniority.optional(),
  requiredSkills: z.array(z.string()).default([]),
  optionalSkills: z.array(z.string()).default([]),
  minYearsOfExperience: z.number().min(0).max(60).optional(),
  description: z.string().optional(),
  status: z.enum(["open", "on_hold", "closed"]).default("open"),
});
