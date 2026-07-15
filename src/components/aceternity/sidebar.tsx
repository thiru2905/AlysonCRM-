"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, easeOut } from "@/lib/motion";

type SidebarContextProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  animate: boolean;
};

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function useAceternitySidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useAceternitySidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  animate?: boolean;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
}

/** Wrapper matching Aceternity's `<Sidebar>` */
export function AceternitySidebar({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  animate?: boolean;
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
}

export function SidebarBody({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof motion.div>, "children">) {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
}

export function DesktopSidebar({
  className,
  children,
  locked = false,
  onMouseEnter,
  onMouseLeave,
  ...props
}: {
  className?: string;
  children: ReactNode;
  /** When true, stays expanded (TopBar pin). Hover still expands when unlocked. */
  locked?: boolean;
} & Omit<React.ComponentProps<typeof motion.div>, "children">) {
  const { open, setOpen, animate } = useAceternitySidebar();

  return (
    <motion.div
      className={cn(
        "hidden h-full min-h-0 shrink-0 flex-col self-stretch overflow-hidden",
        "border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex",
        className,
      )}
      animate={{
        width: animate ? (open || locked ? 280 : 68) : 280,
      }}
      transition={{ duration: duration.soft, ease: easeOut }}
      onMouseEnter={(e) => {
        setOpen(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!locked) setOpen(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MobileSidebar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { open, setOpen } = useAceternitySidebar();

  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: duration.soft, ease: easeOut }}
            className={cn(
              "fixed inset-0 z-50 flex h-full w-full flex-col bg-sidebar p-6",
              className,
            )}
          >
            <button
              type="button"
              className="absolute right-5 top-5 z-50 inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mt-10 flex flex-1 flex-col gap-2 overflow-y-auto">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type SidebarLinkProps = {
  to: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
};

export function SidebarLink({ to, label, icon, active, className, onClick }: SidebarLinkProps) {
  const { open, animate } = useAceternitySidebar();

  return (
    <Link
      to={to as "/"}
      onClick={onClick}
      title={!open ? label : undefined}
      className={cn(
        "group/sidebar flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
        className,
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: duration.instant, ease: easeOut }}
        className="!m-0 inline-block whitespace-pre text-[13px] font-medium"
      >
        {label}
      </motion.span>
    </Link>
  );
}

export function SidebarLabel({ children }: { children: ReactNode }) {
  const { open, animate } = useAceternitySidebar();
  if (animate && !open) return null;
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/65"
    >
      {children}
    </motion.p>
  );
}
