import { Link } from "@tanstack/react-router";
import { GitCompare, X } from "lucide-react";
import { useRecruiterStore, MAX_COMPARE_CANDIDATES } from "@/lib/recruiting/store";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/recruiting/Avatar";
import { cn } from "@/lib/utils";

export function CompareBar() {
  const compare = useRecruiterStore((s) => s.compare);
  const toggleCompare = useRecruiterStore((s) => s.toggleCompare);
  const clearCompare = useRecruiterStore((s) => s.clearCompare);

  if (compare.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GitCompare className="size-4 text-primary" />
          <span className="hidden sm:inline">Comparing</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {compare.length}/{MAX_COMPARE_CANDIDATES}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {compare.map((c) => (
            <div
              key={c.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pl-0.5 pr-2"
            >
              <Avatar name={c.fullName} src={c.profileImageUrl} className="size-6 text-[10px]" />
              <span className="max-w-[90px] truncate text-xs">{c.fullName}</span>
              <button
                onClick={() => toggleCompare(c)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${c.fullName}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            Clear
          </Button>
          <Link
            to="/recruiting/compare"
            className={cn(
              buttonVariants({ size: "sm" }),
              compare.length < 2 && "pointer-events-none opacity-50"
            )}
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
