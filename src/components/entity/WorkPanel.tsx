import { WorkTree } from "@/components/projects/WorkTree";
import { EntityPanel } from "./EntityPanel";
import { EntityChip } from "./EntityChip";
import type { Entity } from "@/lib/entities/types";
import { DEMO_PROJECT } from "@/lib/projects/data";
import { Layers } from "lucide-react";

/**
 * WorkPanel — unified view of Projects › Phases › Tasks › Subtasks scoped
 * to a single entity.
 *
 * We surface the full canonical tree (one project per section) and
 * highlight the rows this entity owns or is assigned to. Workers —
 * human, AI, browser, API, tool — are the executors on each task/subtask.
 * Extra referenced work that isn't in the demo project falls back to the
 * flat entity refs so nothing goes missing.
 */
export function WorkPanel({ entity }: { entity: Entity }) {
  // Which demo tasks are this entity's?
  const focusAssignees = [entity.name];
  const involvedInDemo = DEMO_PROJECT.tasks.some((t) =>
    focusAssignees.includes(t.assignee.name),
  );

  const extraProjects = entity.projects.filter(
    (p) => p.id !== DEMO_PROJECT.id,
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Layers className="h-3.5 w-3.5 text-ai" />
        <span>
          <span className="text-foreground font-medium">Project</span>
          <span className="mx-1.5 text-muted-foreground/60">›</span>
          Phase
          <span className="mx-1.5 text-muted-foreground/60">›</span>
          Task
          <span className="mx-1.5 text-muted-foreground/60">›</span>
          Subtask
          <span className="mx-2 text-muted-foreground/40">·</span>
          executed by workers (human · AI · browser · API · tool)
        </span>
      </div>

      {involvedInDemo && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-sm font-medium">{DEMO_PROJECT.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                Rows this entity owns are highlighted.
              </p>
            </div>
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {DEMO_PROJECT.code}
            </span>
          </div>
          <WorkTree
            project={DEMO_PROJECT}
            focusAssignees={focusAssignees}
            defaultOpen="active"
          />
        </div>
      )}

      {extraProjects.length > 0 && (
        <EntityPanel
          title="Other projects"
          hint="Additional work this entity is part of."
          padded={false}
        >
          <ul>
            {extraProjects.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0"
              >
                <EntityChip entity={p} />
              </li>
            ))}
          </ul>
        </EntityPanel>
      )}

      {!involvedInDemo && entity.projects.length === 0 && entity.tasks.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          No work associated with this entity yet.
        </p>
      )}
    </div>
  );
}
