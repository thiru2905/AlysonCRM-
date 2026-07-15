"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Command } from "lucide-react";
import { NAV } from "@/lib/nav";
import { useShell } from "@/lib/shell";
import { cn } from "@/lib/utils";
import { AlysonLogo } from "@/components/shell/AlysonLogo";
import {
  AceternitySidebar,
  DesktopSidebar,
  SidebarLabel,
  SidebarLink,
  useAceternitySidebar,
} from "@/components/aceternity/sidebar";
import { duration, easeOut } from "@/lib/motion";

export function Sidebar() {
  const { sidebarOpen: locked, setSidebarOpen, setCommandOpen } = useShell();
  const [open, setOpen] = useState(locked);
  const hovering = useRef(false);

  useEffect(() => {
    if (locked) setOpen(true);
    else if (!hovering.current) setOpen(false);
  }, [locked]);

  return (
    <AceternitySidebar open={open} setOpen={setOpen} animate>
      <DesktopSidebar
        locked={locked}
        className="z-40"
        onMouseEnter={() => {
          hovering.current = true;
        }}
        onMouseLeave={() => {
          hovering.current = false;
        }}
      >
        <div className="flex h-full min-h-0 flex-col justify-between gap-4">
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <SidebarBrand locked={locked} onTogglePin={() => setSidebarOpen(!locked)} />

            <SidebarCommandButton onOpen={() => setCommandOpen(true)} />

            <nav className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pr-0.5">
              <SidebarLabel>Overview</SidebarLabel>
              {NAV.filter((n) => n.section === "overview").map((item) => (
                <NavSidebarLink key={item.to} item={item} />
              ))}

              <SidebarLabel>Primitives</SidebarLabel>
              {NAV.filter((n) => n.section === "primitives").map((item) => (
                <NavSidebarLink key={item.to} item={item} />
              ))}

              <SidebarLabel>Flavors</SidebarLabel>
              {NAV.filter((n) => n.section === "flavors").map((item) => (
                <NavSidebarLink key={item.to} item={item} />
              ))}
            </nav>
          </div>

          <SidebarUserFooter />
        </div>
      </DesktopSidebar>
    </AceternitySidebar>
  );
}

function SidebarBrand({
  locked,
  onTogglePin,
}: {
  locked: boolean;
  onTogglePin: () => void;
}) {
  const { open, animate } = useAceternitySidebar();
  const showWordmark = !animate || open || locked;

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <Link to="/overview" className="min-w-0">
        <AlysonLogo size={28} showWordmark={showWordmark} wordmarkClassName="text-sm" />
      </Link>
      {showWordmark ? (
        <button
          type="button"
          onClick={onTogglePin}
          className={cn(
            "shrink-0 rounded-md px-1.5 py-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider transition",
            locked
              ? "bg-white/[0.08] text-zinc-200"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
          )}
          title={locked ? "Unpin sidebar" : "Pin sidebar open"}
          aria-label={locked ? "Unpin sidebar" : "Pin sidebar open"}
        >
          {locked ? "Pinned" : "Pin"}
        </button>
      ) : null}
    </div>
  );
}

function SidebarCommandButton({ onOpen }: { onOpen: () => void }) {
  const { open, animate } = useAceternitySidebar();
  const showLabel = !animate || open;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-xs text-muted-foreground",
        "border border-sidebar-border/80 bg-black/20 hover:bg-sidebar-accent hover:text-foreground transition",
      )}
      title="Jump to…"
    >
      <Command className="h-4 w-4 shrink-0" />
      <motion.span
        animate={{
          display: showLabel ? "inline-block" : "none",
          opacity: showLabel ? 1 : 0,
        }}
        transition={{ duration: duration.instant, ease: easeOut }}
        className="flex flex-1 items-center justify-between whitespace-pre"
      >
        <span>Jump to…</span>
        <kbd className="text-[10px]">⌘K</kbd>
      </motion.span>
    </button>
  );
}

function NavSidebarLink({ item }: { item: (typeof NAV)[number] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active =
    item.to === "/overview"
      ? pathname === "/overview"
      : pathname === item.to || pathname.startsWith(item.to + "/");
  const Icon = item.icon;
  const isAi = item.accent === "ai";

  return (
    <SidebarLink
      to={item.to}
      label={item.label}
      active={active}
      className={cn(isAi && !active && "text-ai/90 hover:text-ai")}
      icon={
        <Icon
          className={cn(
            active || isAi ? "text-ai" : "text-muted-foreground group-hover/sidebar:text-foreground",
          )}
        />
      }
    />
  );
}

function SidebarUserFooter() {
  const { open, animate } = useAceternitySidebar();
  const showMeta = !animate || open;

  return (
    <div className="border-t border-sidebar-border/70 pt-3">
      <div className="flex items-center gap-2.5 rounded-md px-1 py-1.5">
        <div className="relative shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
            OP
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.7, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-sidebar bg-emerald-400" />
          </span>
        </div>
        <motion.div
          animate={{
            display: showMeta ? "block" : "none",
            opacity: showMeta ? 1 : 0,
          }}
          transition={{ duration: duration.instant, ease: easeOut }}
          className="min-w-0"
        >
          <p className="truncate text-sm font-medium text-sidebar-foreground">Operator</p>
          <p className="truncate text-[11px] text-muted-foreground">3 workers active</p>
        </motion.div>
      </div>
    </div>
  );
}
