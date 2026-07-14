import type { Entity, EntityKind } from "./types";
import { DEMO_ENTITY } from "./demo";

/**
 * Sample entities per kind — cloned from DEMO_ENTITY with a swapped identity
 * so every kind renders a realistic list and detail view without new data
 * plumbing. Everything else (timeline, scores, predictions, etc.) is shared
 * to demonstrate the universal shape.
 */

interface Seed {
  id: string;
  name: string;
  subtitle?: string;
  status?: Entity["status"];
}

const SEEDS: Record<EntityKind, Seed[]> = {
  person: [
    { id: "p_ada", name: "Ada Kessler", subtitle: "Head of Operations · Acme Robotics", status: { label: "Engaged", tone: "info" } },
    { id: "p_miles", name: "Miles Ortega", subtitle: "CEO · Acme Robotics", status: { label: "Champion", tone: "success" } },
    { id: "p_jules", name: "Jules Tan", subtitle: "VP Legal · Northwind Materials", status: { label: "Blocker", tone: "warning" } },
    { id: "p_devlin", name: "Marc Devlin", subtitle: "Candidate · Staff Engineer", status: { label: "Interviewing", tone: "info" } },
  ],
  company: [
    { id: "c_acme", name: "Acme Robotics", subtitle: "Mid-market · Manufacturing", status: { label: "Active pilot", tone: "info" } },
    { id: "c_northwind", name: "Northwind Materials", subtitle: "Enterprise · Chemicals", status: { label: "Negotiating", tone: "warning" } },
    { id: "c_sable", name: "Sable & Co.", subtitle: "SMB · Retail", status: { label: "Prospect", tone: "neutral" } },
  ],
  place: [
    { id: "pl_hq", name: "Acme HQ — Oakland", subtitle: "Primary facility · 240 employees" },
    { id: "pl_regionN", name: "Region North", subtitle: "12 sites · 3 states" },
    { id: "pl_pilot", name: "Halden Pilot Site", subtitle: "Cove & Fjord · Phase 1" },
  ],
  worker: [
    { id: "w_outreach", name: "Outreach", subtitle: "AI agent · Personalizes drafts", status: { label: "Running", tone: "info" } },
    { id: "w_enrichment", name: "Enrichment", subtitle: "AI agent · Fills profile gaps", status: { label: "Running", tone: "info" } },
    { id: "w_scout", name: "Scout", subtitle: "Browser worker · Web research", status: { label: "Idle", tone: "neutral" } },
    { id: "w_atlas", name: "Atlas", subtitle: "AI agent · Contract redlines", status: { label: "Awaiting approval", tone: "warning" } },
  ],
  audience: [
    { id: "a_ops", name: "Ops leaders · Mid-market", subtitle: "1,842 people · 312 companies" },
    { id: "a_legal", name: "Legal buyers · Enterprise", subtitle: "624 people · 141 companies" },
    { id: "a_re", name: "Real-estate investors · West", subtitle: "3,401 people" },
  ],
  knowledge_asset: [
    { id: "k_msa", name: "MSA template · v3", subtitle: "Doc · Updated 2d ago" },
    { id: "k_playbook", name: "Legal-first outreach playbook", subtitle: "Doc · Shared team-wide" },
    { id: "k_transcript", name: "Discovery transcript · Feb 12", subtitle: "Call · 32 min" },
  ],
  project: [
    { id: "pr_rollout", name: "Acme rollout — Phase 1", subtitle: "12 tasks · 2 blocked", status: { label: "On track", tone: "success" } },
    { id: "pr_templates", name: "Legal-ready templates", subtitle: "Shared playbook · 6 tasks" },
    { id: "pr_pilot", name: "Halden pilot brief", subtitle: "3 phases · 18 tasks" },
  ],
  task: [
    { id: "tk_msa", name: "Send MSA one-pager", subtitle: "Due Thu · Owned by Outreach", status: { label: "In progress", tone: "info" } },
    { id: "tk_sync", name: "Schedule legal sync", subtitle: "Awaiting reply", status: { label: "Blocked", tone: "warning" } },
    { id: "tk_prop", name: "Draft expansion proposal", subtitle: "Assigned to Outreach" },
  ],
  experiment: [
    { id: "ex_v2", name: "Legal-first outreach v2", subtitle: "Winning · +18% reply rate", status: { label: "Winning", tone: "success" } },
    { id: "ex_subj", name: "Subject-line personalization", subtitle: "Inconclusive · 4d in" },
  ],
  prediction: [
    { id: "pd_expand", name: "Likelihood to expand in 60d", subtitle: "72% · High confidence" },
    { id: "pd_churn", name: "Churn risk · next quarter", subtitle: "22% · Trending down" },
    { id: "pd_next", name: "Best next action", subtitle: "Send legal-ready one-pager" },
  ],
};

function build(kind: EntityKind, seed: Seed): Entity {
  return {
    ...DEMO_ENTITY,
    id: seed.id,
    kind,
    name: seed.name,
    subtitle: seed.subtitle,
    status: seed.status ?? DEMO_ENTITY.status,
  };
}

export function getSampleEntities(kind: EntityKind): Entity[] {
  return (SEEDS[kind] ?? []).map((s) => build(kind, s));
}

export function getSampleEntity(kind: EntityKind, id: string): Entity | undefined {
  const seed = SEEDS[kind]?.find((s) => s.id === id);
  return seed ? build(kind, seed) : undefined;
}
