import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AIPanel } from "./AIPanel";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { PageFade } from "@/components/motion/primitives";
import { transitionSoft } from "@/lib/motion";

const SHELL_LESS = new Set(["/", "/landing", "/terms", "/privacy"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (SHELL_LESS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className="box-border flex h-svh w-full overflow-hidden bg-muted p-0 text-foreground md:bg-zinc-950 md:p-3 dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transitionSoft}
    >
      {/* Aceternity-style app frame — sidebar is flush full-height inside */}
      <div className="flex min-h-0 w-full flex-1 overflow-hidden border-0 border-white/[0.08] bg-background md:rounded-2xl md:border">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0">
            <PageFade routeKey={pathname}>{children}</PageFade>
          </main>
        </div>
        <AIPanel />
      </div>
      <CommandPalette />
      <MobileNav />
    </motion.div>
  );
}
