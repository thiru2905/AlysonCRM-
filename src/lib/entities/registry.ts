import {
  Bot,
  Boxes,
  Building2,
  CheckSquare,
  FlaskConical,
  FolderKanban,
  MapPin,
  Sparkles,
  User,
  Users,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { EntityKind } from "./types";

export interface EntityKindMeta {
  kind: EntityKind;
  label: string;
  plural: string;
  icon: LucideIcon;
  /** Accent hint used sparingly; UI defaults to `--ai`. */
  accent?: "neutral" | "ai";
  description: string;
}

export const ENTITY_KINDS: Record<EntityKind, EntityKindMeta> = {
  person: {
    kind: "person",
    label: "Person",
    plural: "People",
    icon: User,
    description: "A human — customer, candidate, contact, tenant, patient.",
  },
  company: {
    kind: "company",
    label: "Company",
    plural: "Companies",
    icon: Building2,
    description: "An organization the OS interacts with.",
  },
  place: {
    kind: "place",
    label: "Place",
    plural: "Places",
    icon: MapPin,
    description: "A physical location — property, office, region.",
  },
  worker: {
    kind: "worker",
    label: "Worker",
    plural: "Workers",
    icon: Bot,
    accent: "ai",
    description: "An AI agent operating under human supervision.",
  },
  audience: {
    kind: "audience",
    label: "Audience",
    plural: "Audiences",
    icon: Users,
    description: "A cohort of people or companies grouped by shared traits.",
  },
  knowledge_asset: {
    kind: "knowledge_asset",
    label: "Knowledge Asset",
    plural: "Knowledge",
    icon: BookOpen,
    description: "A document, transcript, or dataset the OS reads from.",
  },
  project: {
    kind: "project",
    label: "Project",
    plural: "Projects",
    icon: FolderKanban,
    description: "A shared outcome humans and workers pursue.",
  },
  task: {
    kind: "task",
    label: "Task",
    plural: "Tasks",
    icon: CheckSquare,
    description: "A discrete unit of work — human, AI, or hybrid.",
  },
  experiment: {
    kind: "experiment",
    label: "Experiment",
    plural: "Experiments",
    icon: FlaskConical,
    description: "A comparison of prompts, models, or workflows.",
  },
  prediction: {
    kind: "prediction",
    label: "Prediction",
    plural: "Predictions",
    icon: Sparkles,
    accent: "ai",
    description: "A forecast with confidence and provenance.",
  },
};

export const ENTITY_KIND_LIST = Object.values(ENTITY_KINDS);

export function entityMeta(kind: EntityKind): EntityKindMeta {
  return ENTITY_KINDS[kind] ?? {
    kind,
    label: kind,
    plural: kind,
    icon: Boxes,
    description: "",
  };
}
