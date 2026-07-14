import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Boxes,
  Bot,
  FlaskConical,
  Network,
  Sparkles,
  Wand2,
  Waypoints,
} from "lucide-react";

export const Route = createFileRoute("/flavors")({
  head: () => ({
    meta: [
      { title: "Flavors — Alyson OS" },
      { name: "description", content: "CRM-shaped apps, tuned per team. One shared core of contacts, pipeline, playbooks, and workers — many surfaces." },
      { property: "og:title", content: "Flavors — Alyson OS" },
      { property: "og:description", content: "CRM-shaped apps, tuned per team. One core, many surfaces." },
    ],
  }),
  component: FlavorsIndex,
});

const CORE = [
  { icon: Waypoints, label: "Pipeline", hint: "Stages, deals, conversion" },
  { icon: Boxes, label: "Contacts", hint: "People + companies as Entities" },
  { icon: Sparkles, label: "Playbooks", hint: "Sequences the workers run" },
  { icon: Bot, label: "Worker team", hint: "Human, AI, browser, API" },
  { icon: FlaskConical, label: "Experiments", hint: "Compared in the open" },
  { icon: Network, label: "Reports", hint: "Forecasts + provenance" },
];

function FlavorsIndex() {
  const flavors = NAV.filter(
    (n) => n.section === "flavors" && n.to !== "/flavors" && n.to !== "/flavors/new",
  );

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        eyebrow="APPLICATIONS · FLAVORS"
        title="One CRM core. Many flavors."
        description="Every app on Alyson OS is a flavor of the same shape — contacts, pipeline, playbooks, workers. Pick a flavor tuned for your team, or describe a new one and let Alyson scaffold it."
        actions={
          <Link
            to="/flavors/new"
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ai-gradient-bg text-ai-foreground hover:brightness-110 transition"
          >
            <Wand2 className="h-3.5 w-3.5" /> New flavor with Alyson
          </Link>
        }
      />

      {/* Shared core */}
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <Sparkles className="h-3.5 w-3.5 text-ai" />
          <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Shared core · every flavor gets this
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-border">
          {CORE.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="p-4">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm mt-2">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.hint}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flavor grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {flavors.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.to}
              to={f.to}
              className={cn(
                "group rounded-xl border border-border/60 bg-card p-4",
                "hover:border-border-strong hover:shadow-pop transition",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg border border-border/60 grid place-items-center text-muted-foreground group-hover:text-ai transition">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{f.label}</div>
                  <div className="text-mono text-[10px] text-muted-foreground truncate">
                    {f.to}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </Link>
          );
        })}

        {/* New flavor tile */}
        <Link
          to="/flavors/new"
          className="group rounded-xl border border-dashed border-border/70 p-4 hover:border-ai/60 transition bg-ai-soft/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg ai-gradient-bg grid place-items-center text-ai-foreground shadow-pop">
              <Wand2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm">Describe your team</div>
              <div className="text-mono text-[10px] text-muted-foreground">
                /flavors/new
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-ai opacity-0 group-hover:opacity-100 transition" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Tell Alyson what your team does. She'll pick stages, playbooks, and
            workers — and scaffold a flavor on the shared core.
          </p>
        </Link>
      </div>
    </PageContainer>
  );
}
