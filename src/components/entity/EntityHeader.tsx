import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { entityMeta } from "@/lib/entities/registry";
import type { Entity } from "@/lib/entities/types";
import { EntityAvatar } from "./EntityAvatar";
import { MoreHorizontal, Star, Share2, Copy, Archive, Pencil } from "lucide-react";
import { copyLink, isFavorite, notifySoon, toggleFavorite } from "@/lib/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TONE: Record<NonNullable<Entity["status"]>["tone"], string> = {
  neutral: "text-muted-foreground bg-muted",
  success: "text-success bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)]",
  warning: "text-warning bg-[color-mix(in_oklab,var(--color-warning)_18%,transparent)]",
  info: "text-ai bg-ai-soft",
  danger: "text-destructive bg-[color-mix(in_oklab,var(--color-destructive)_18%,transparent)]",
};

export function EntityHeader({
  entity,
  actions,
}: {
  entity: Entity;
  actions?: ReactNode;
}) {
  const meta = entityMeta(entity.kind);
  const Icon = meta.icon;
  const favKey = `${entity.kind}:${entity.id}`;
  const [starred, setStarred] = useState(false);
  useEffect(() => setStarred(isFavorite(favKey)), [favKey]);

  return (
    <header className="flex items-start gap-4 pb-6 border-b border-border/60">
      <EntityAvatar name={entity.name} src={entity.avatarUrl} size={56} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Icon className={cn("h-3 w-3", meta.accent === "ai" ? "text-ai" : "")} />
          <span>{meta.label}</span>
          {entity.status && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span
                className={cn(
                  "inline-flex items-center h-4 px-1.5 rounded-full text-[10px] font-medium normal-case tracking-normal",
                  TONE[entity.status.tone],
                )}
              >
                {entity.status.label}
              </span>
            </>
          )}
        </div>
        <h1 className="text-display text-2xl md:text-[28px] leading-tight mt-1.5 truncate">
          {entity.name}
        </h1>
        {entity.subtitle && (
          <p className="text-sm text-muted-foreground mt-1 truncate">{entity.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <IconBtn
          label={starred ? "Remove from favorites" : "Add to favorites"}
          onClick={() => setStarred(toggleFavorite(favKey, entity.name))}
          active={starred}
        >
          <Star className={cn("h-4 w-4", starred && "fill-current text-primary")} />
        </IconBtn>
        <IconBtn label="Share" onClick={() => copyLink()}>
          <Share2 className="h-4 w-4" />
        </IconBtn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => notifySoon("Rename")}>
              <Pencil className="h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => notifySoon("Duplicate", `Duplicate ${entity.name}`)}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => notifySoon("Archive", `Archive ${entity.name}`)}
              className="text-destructive focus:text-destructive"
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 w-8 inline-flex items-center justify-center rounded-md transition",
        active
          ? "text-primary hover:bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
