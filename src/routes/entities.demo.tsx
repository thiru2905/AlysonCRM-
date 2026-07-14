import { createFileRoute } from "@tanstack/react-router";
import { EntityView } from "@/components/entity/EntityView";
import { DEMO_ENTITY } from "@/lib/entities/demo";

export const Route = createFileRoute("/entities/demo")({
  component: () => <EntityView entity={DEMO_ENTITY} />,
});
