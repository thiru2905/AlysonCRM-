import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Star,
  GitBranch,
  GitCompare,
  Activity,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/recruiting", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/recruiting/jobs", label: "Jobs", icon: Briefcase },
  { to: "/recruiting/search", label: "Search", icon: Search },
  { to: "/recruiting/shortlists", label: "Shortlists", icon: Star },
  { to: "/recruiting/pipeline", label: "Pipeline", icon: GitBranch },
  { to: "/recruiting/compare", label: "Compare", icon: GitCompare },
  { to: "/recruiting/usage", label: "Usage", icon: Activity },
  { to: "/recruiting/linkedin", label: "Search builder", icon: Linkedin },
] as const;

export function RecruitingSubnav() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border/60 pb-3">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: "exact" in item ? item.exact : false }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            )}
            activeProps={{
              className: "bg-accent text-foreground",
            }}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
