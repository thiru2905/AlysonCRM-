import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { EntityAvatar } from "@/components/entity/EntityAvatar";
import { entityMeta, ENTITY_KINDS } from "@/lib/entities/registry";
import { getSampleEntities } from "@/lib/entities/samples";
import type { EntityKind } from "@/lib/entities/types";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entities/$kind")({
  loader: ({ params }) => {
    if (!(params.kind in ENTITY_KINDS)) throw notFound();
    return { kind: params.kind as EntityKind };
  },
  component: KindListPage,
  notFoundComponent: () => (
    <PageContainer>
      <PageHeader eyebrow="Data Sources" title="Unknown source kind" />
    </PageContainer>
  ),
});

const TONE: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  info: "text-primary",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
};

function KindListPage() {
  const { kind } = Route.useLoaderData();
  const meta = entityMeta(kind);
  const Icon = meta.icon;
  const items = getSampleEntities(kind);

  return (
    <PageContainer className="max-w-5xl">
      <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
        <Link to="/entities" className="hover:text-foreground transition">
          Data Sources
        </Link>
        <span className="mx-1.5 text-muted-foreground/60">/</span>
        <span>{meta.plural}</span>
      </div>
      <PageHeader title={meta.plural} description={meta.description} />

      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Icon className={cn("h-3.5 w-3.5", meta.accent === "ai" ? "text-ai" : "text-foreground/70")} />
          <span>{items.length} {meta.plural.toLowerCase()}</span>
        </div>
        {items.length === 0 && (
          <div className="p-8 text-sm text-muted-foreground">No samples yet.</div>
        )}
        {items.map((e) => (
          <Link
            key={e.id}
            to="/entities/$kind/$id"
            params={{ kind, id: e.id }}
            className="group flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-accent/40 transition"
          >
            <EntityAvatar name={e.name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{e.name}</div>
              {e.subtitle && (
                <div className="text-xs text-muted-foreground truncate">{e.subtitle}</div>
              )}
            </div>
            {e.status && (
              <span className={cn("text-mono text-[10px] uppercase tracking-wider", TONE[e.status.tone] ?? "text-muted-foreground")}>
                {e.status.label}
              </span>
            )}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
