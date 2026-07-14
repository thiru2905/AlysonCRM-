import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AIPanel } from "./AIPanel";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <AIPanel />
      <CommandPalette />
      <MobileNav />
    </div>
  );
}
