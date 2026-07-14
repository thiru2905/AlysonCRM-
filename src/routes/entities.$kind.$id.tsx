import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { EntityView } from "@/components/entity/EntityView";
import { ENTITY_KINDS, entityMeta } from "@/lib/entities/registry";
import { getSampleEntity } from "@/lib/entities/samples";
import type { EntityKind } from "@/lib/entities/types";

export const Route = createFileRoute("/entities/$kind/$id")({
  loader: ({ params }) => {
    if (!(params.kind in ENTITY_KINDS)) throw notFound();
    const kind = params.kind as EntityKind;
    const entity = getSampleEntity(kind, params.id);
    if (!entity) throw notFound();
    return { entity, kind };
  },
  component: KindDetailPage,
  notFoundComponent: () => (
    <PageContainer>
      <PageHeader eyebrow="Data Sources" title="Not found" description="This record doesn't exist." />
    </PageContainer>
  ),
});

function KindDetailPage() {
  const { entity, kind } = Route.useLoaderData();
  const meta = entityMeta(kind);
  return (
    <div>
      <div className="px-5 md:px-8 pt-6 max-w-6xl mx-auto">
        <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link to="/entities" className="hover:text-foreground transition">Data Sources</Link>
          <span className="mx-1.5 text-muted-foreground/60">/</span>
          <Link to="/entities/$kind" params={{ kind }} className="hover:text-foreground transition">
            {meta.plural}
          </Link>
          <span className="mx-1.5 text-muted-foreground/60">/</span>
          <span>{entity.name}</span>
        </div>
      </div>
      <EntityView entity={entity} />
    </div>
  );
}
