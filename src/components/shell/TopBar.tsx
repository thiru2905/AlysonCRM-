import { useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { NAV } from "@/lib/nav";
import { useShell } from "@/lib/shell";
import { cn } from "@/lib/utils";
import { transitionSoft } from "@/lib/motion";
import { RuntimeStatusPill } from "@/components/runtime/RuntimeStatusPill";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bot, PanelLeft, Search } from "lucide-react";

export function TopBar() {
  const { toggleSidebar, toggleAI, aiOpen, setCommandOpen } = useShell();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) =>
    n.to === "/overview" ? pathname === "/overview" : pathname.startsWith(n.to),
  );

  return (
    <motion.header
      className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border/70 bg-background/70 backdrop-blur-xl sticky top-0 z-30"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionSoft}
    >
      <button
        onClick={toggleSidebar}
        className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
        aria-label="Pin or unpin sidebar"
        title="Pin / unpin sidebar (⌘\\)"
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Alyson CRM+
        </span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium truncate">
          {current?.label ?? "Untitled"}
        </span>
      </div>

      <div className="flex-1" />

      {/* Search trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className={cn(
          "hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-md",
          "text-xs text-muted-foreground surface-hairline hover:bg-accent transition min-w-[260px]",
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or run a command…</span>
        <kbd>⌘K</kbd>
      </button>

      <RuntimeStatusPill />

      <ThemeToggle className="rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" size="sm" />

      <button
        onClick={toggleAI}
        className={cn(
          "h-8 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs transition",
          aiOpen
            ? "bg-ai text-ai-foreground"
            : "text-foreground surface-hairline hover:bg-accent",
        )}
        aria-label="Toggle AI panel"
      >
        <Bot className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Ask Alyson</span>
        <kbd className={cn(aiOpen && "bg-ai-foreground/10 text-ai-foreground border-transparent")}>⌘.</kbd>
      </button>
    </motion.header>
  );
}
