import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { ENTITY_KIND_LIST } from "@/lib/entities/registry";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/entities/")({
  component: EntitiesIndex,
});

const UNIVERSAL_SECTIONS = [
  "AI Summary",
  "Timeline",
  "Relationships",
  "Knowledge",
  "Scores",
  "Predictions",
  "Files",
  "Activity",
  "History",
  "Projects",
  "Tasks",
  "Experiments",
];

function EntitiesIndex() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Data Sources · Core framework"
        title="Every data source, one surface."
        description="Data Sources are the shapes Alyson reasons about — people, companies, audiences, knowledge, and more. In our CDP these are 'sources'; on screen we call them data sources so the meaning is obvious."
        actions={
          <Link
            to="/entities/demo"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Preview entity surface
          </Link>
        }
      />

      {/* Entity kinds */}
      <section className="mt-8">
        <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Kinds
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ENTITY_KIND_LIST.map((meta) => {
            const Icon = meta.icon;
            return (
              <Link
                key={meta.kind}
                to="/entities/$kind"
                params={{ kind: meta.kind }}
                className="group rounded-xl border border-border bg-card p-4 hover:border-border-strong hover:bg-accent/30 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-accent grid place-items-center">
                    <Icon className={meta.accent === "ai" ? "h-4 w-4 text-ai" : "h-4 w-4 text-foreground/80"} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {meta.plural}
                    </div>
                  </div>
                  <div className="flex-1" />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {meta.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Universal sections */}
      <section className="mt-10">
        <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Every entity supports
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-1.5">
            {UNIVERSAL_SECTIONS.map((s) => (
              <span
                key={s}
                className="inline-flex items-center h-7 px-2.5 rounded-md border border-border bg-surface text-xs"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed max-w-2xl">
            These twelve sections are guaranteed on every entity. Applications inherit
            them for free and add kind-specific fields alongside — never in place of them.
          </p>
        </div>
      </section>

      {/* Preview link */}
      <section className="mt-10">
        <Link
          to="/entities/demo"
          className="group flex items-center gap-4 rounded-xl border border-dashed border-border bg-surface p-5 hover:border-border-strong hover:bg-card transition"
        >
          <div className="h-10 w-10 rounded-lg ai-gradient-bg grid place-items-center shrink-0">
            <Sparkles className="h-4 w-4 text-ai-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">See the entity surface in action</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              A live example of the shared framework — header, tabs, and all twelve sections.
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
        </Link>
      </section>
    </PageContainer>
  );
}
