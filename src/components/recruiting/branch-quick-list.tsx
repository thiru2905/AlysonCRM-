import type { BuiltSearchBranch } from "@/lib/recruiting/linkedin/branch-types";
import { CATEGORY_STYLES } from "@/lib/recruiting/linkedin/branch-graph-layout";
import { cn } from "@/lib/utils";

type Props = {
  branches: BuiltSearchBranch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function BranchQuickList({ branches, selectedId, onSelect }: Props) {
  if (!branches.length) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-card/80 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        All branches ({branches.length})
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
        {branches.map((branch) => {
          const style = CATEGORY_STYLES[branch.category];
          const selected = selectedId === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onSelect(branch.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                selected
                  ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm ring-2 ring-violet-300/50 dark:bg-violet-950/40 dark:text-violet-100"
                  : "border-border bg-white hover:border-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: style.stroke }}
              />
              {branch.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
