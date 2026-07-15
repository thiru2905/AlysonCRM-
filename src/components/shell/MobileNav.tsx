import { Link, useRouterState } from "@tanstack/react-router";
import { NAV } from "@/lib/nav";
import { useShell } from "@/lib/shell";
import { cn } from "@/lib/utils";
import { Bot, Search } from "lucide-react";

const MOBILE = NAV.filter((n) =>
  ["/overview", "/work", "/workers", "/knowledge"].includes(n.to),
);

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setCommandOpen, toggleAI } = useShell();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="grid grid-cols-6 h-14">
        {MOBILE.slice(0, 2).map((item) => (
          <MobileLink key={item.to} item={item} active={pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to))} />
        ))}
        <button
          onClick={toggleAI}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground"
        >
          <div className="h-9 w-9 -mt-3 rounded-full ai-gradient-bg text-ai-foreground grid place-items-center shadow-pop">
            <Bot className="h-4 w-4" />
          </div>
          <span className="mt-0.5">Alyson</span>
        </button>
        {MOBILE.slice(2).map((item) => (
          <MobileLink key={item.to} item={item} active={pathname.startsWith(item.to)} />
        ))}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </div>
    </nav>
  );
}

function MobileLink({ item, active }: { item: (typeof MOBILE)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[10px]",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "text-ai")} />
      <span>{item.label}</span>
    </Link>
  );
}
