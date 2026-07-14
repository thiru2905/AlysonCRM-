import { Link, useRouterState } from "@tanstack/react-router";
import { NAV } from "@/lib/nav";
import { useShell } from "@/lib/shell";
import { cn } from "@/lib/utils";
import { ChevronsLeft, Command } from "lucide-react";
import { AlysonLogo } from "@/components/shell/AlysonLogo";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setCommandOpen } = useShell();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      data-open={sidebarOpen}
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-sidebar",
        "transition-[width] duration-200 ease-out",
        sidebarOpen ? "w-60" : "w-[60px]",
      )}
    >
      {/* Brand */}
      <div className="h-12 flex items-center px-3 gap-2 border-b border-border/60">
        {sidebarOpen ? (
          <>
            <AlysonLogo size={28} wordmarkClassName="text-sm" />
            <button
              onClick={toggleSidebar}
              className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <AlysonLogo size={28} showWordmark={false} className="mx-auto" />
        )}
      </div>

      {/* Search / command */}
      <div className="px-2 pt-2">
        <button
          onClick={() => setCommandOpen(true)}
          className={cn(
            "w-full flex items-center gap-2 h-8 px-2 rounded-md",
            "text-xs text-muted-foreground",
            "surface-hairline hover:bg-accent transition",
          )}
        >
          <Command className="h-3.5 w-3.5 shrink-0" />
          {sidebarOpen && (
            <>
              <span className="flex-1 text-left">Jump to…</span>
              <kbd>⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
        <NavGroup label="Overview" items={NAV.filter((n) => n.section === "overview")} pathname={pathname} collapsed={!sidebarOpen} />
        <NavGroup label="Primitives" items={NAV.filter((n) => n.section === "primitives")} pathname={pathname} collapsed={!sidebarOpen} />
        <NavGroup label="Flavors" items={NAV.filter((n) => n.section === "flavors")} pathname={pathname} collapsed={!sidebarOpen} />
      </nav>

      {/* Footer status */}
      <div className="border-t border-border/60 p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          {sidebarOpen && <span>3 workers active</span>}
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string;
  items: typeof NAV;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <div className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
          {label}
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          const isAi = item.accent === "ai";
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "group flex items-center gap-2.5 h-8 px-2 rounded-md text-sm",
                  "text-sidebar-foreground/85 hover:text-foreground hover:bg-sidebar-accent transition",
                  active && "bg-sidebar-accent text-foreground",
                  isAi && "text-ai hover:text-ai",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isAi
                      ? "text-ai"
                      : active
                        ? "text-ai"
                        : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-mono text-[10px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition">
                        {item.shortcut}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
