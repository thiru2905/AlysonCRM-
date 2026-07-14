import {
  User,
  Building2,
  MapPin,
  FolderKanban,
  CalendarClock,
  Mail,
  Phone,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { IdentityKind } from "@/lib/identity/data";

export const KIND_ICON: Record<IdentityKind, LucideIcon> = {
  person: User,
  company: Building2,
  place: MapPin,
  project: FolderKanban,
  meeting: CalendarClock,
  email: Mail,
  phone: Phone,
  browser: Globe,
};

// Tailwind text color classes per kind (semantic tokens only)
export const KIND_TONE: Record<
  IdentityKind,
  { text: string; ring: string; bg: string; svg: string }
> = {
  person: {
    text: "text-ai",
    ring: "ring-ai/40",
    bg: "bg-ai/10",
    svg: "var(--ai)",
  },
  company: {
    text: "text-foreground",
    ring: "ring-foreground/30",
    bg: "bg-foreground/5",
    svg: "var(--foreground)",
  },
  place: {
    text: "text-success",
    ring: "ring-success/30",
    bg: "bg-success/10",
    svg: "var(--success)",
  },
  project: {
    text: "text-warning",
    ring: "ring-warning/30",
    bg: "bg-warning/10",
    svg: "var(--warning)",
  },
  meeting: {
    text: "text-ai",
    ring: "ring-ai/30",
    bg: "bg-ai/10",
    svg: "var(--ai)",
  },
  email: {
    text: "text-muted-foreground",
    ring: "ring-border-strong",
    bg: "bg-muted",
    svg: "var(--muted-foreground)",
  },
  phone: {
    text: "text-muted-foreground",
    ring: "ring-border-strong",
    bg: "bg-muted",
    svg: "var(--muted-foreground)",
  },
  browser: {
    text: "text-muted-foreground",
    ring: "ring-border-strong",
    bg: "bg-muted",
    svg: "var(--muted-foreground)",
  },
};
