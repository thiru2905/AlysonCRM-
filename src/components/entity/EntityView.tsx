import { useState } from "react";
import { PageContainer } from "@/components/shell/Page";
import { EntityHeader } from "./EntityHeader";
import { EntityTabs } from "./EntityTabs";
import {
  ActivityPanel,
  FilesPanel,
  HistoryPanel,
  KnowledgePanel,
  PredictionsPanel,
  RelatedListPanel,
  RelationshipsPanel,
  ScoresPanel,
  SummaryPanel,
  TimelinePanel,
} from "./panels";
import { WorkPanel } from "./WorkPanel";
import type { Entity, EntitySection } from "@/lib/entities/types";

/**
 * EntityView — the canonical entity page.
 */
export function EntityView({
  entity,
  defaultSection = "summary",
  extraActions,
}: {
  entity: Entity;
  defaultSection?: EntitySection;
  extraActions?: React.ReactNode;
}) {
  const [section, setSection] = useState<EntitySection>(defaultSection);

  return (
    <PageContainer className="max-w-6xl">
      <EntityHeader entity={entity} actions={extraActions} />
      <div className="mt-6">
        <EntityTabs entity={entity} active={section} onChange={setSection} />
      </div>
      <div className="mt-6">
        {section === "summary" && <SummaryPanel entity={entity} />}
        {section === "timeline" && <TimelinePanel entity={entity} />}
        {section === "relationships" && <RelationshipsPanel entity={entity} />}
        {section === "knowledge" && <KnowledgePanel entity={entity} />}
        {section === "scores" && <ScoresPanel entity={entity} />}
        {section === "predictions" && <PredictionsPanel entity={entity} />}
        {section === "files" && <FilesPanel entity={entity} />}
        {section === "activity" && <ActivityPanel entity={entity} />}
        {section === "history" && <HistoryPanel entity={entity} />}
        {section === "work" && <WorkPanel entity={entity} />}
        {section === "experiments" && (
          <RelatedListPanel label="Experiments" items={entity.experiments} />
        )}
      </div>
    </PageContainer>
  );
}

