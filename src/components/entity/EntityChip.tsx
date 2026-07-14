import { cn } from "@/lib/utils";
import { entityMeta } from "@/lib/entities/registry";
import type { EntityRef } from "@/lib/entities/types";

export function EntityChip({
  entity,
  className,
  onClick,
}: {
  entity: EntityRef;
  className?: string;
  onClick?: () => void;
}) {
  const meta = entityMeta(entity.kind);
  const Icon = meta.icon;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-6 pl-1.5 pr-2 rounded-md",
        "border border-border bg-card text-xs",
        onClick && "hover:bg-accent hover:border-border-strong transition cursor-pointer",
        className,
      )}
      title={meta.label}
    >
      <Icon
        className={cn(
          "h-3 w-3 shrink-0",
          meta.accent === "ai" ? "text-ai" : "text-muted-foreground",
        )}
      />
      <span className="truncate max-w-[180px]">{entity.label}</span>
      {entity.sublabel && (
        <span className="text-muted-foreground text-[10px] truncate">· {entity.sublabel}</span>
      )}
    </Tag>
  );
}
