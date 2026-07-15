import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { transitionMedium, transitionSoft } from "@/lib/motion";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      className="grid grid-cols-1 gap-4 pb-6 border-b border-border/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionMedium}
    >
      <div className="min-w-0">
        {eyebrow && (
          <motion.div
            className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transitionSoft, delay: 0.08 }}
          >
            {eyebrow}
          </motion.div>
        )}
        <h1 className="text-display text-2xl md:text-[28px] leading-tight break-words">{title}</h1>
        {description && (
          <motion.p
            className="text-sm text-muted-foreground mt-2 max-w-2xl"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionMedium, delay: 0.12 }}
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div
          className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...transitionSoft, delay: 0.18 }}
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn("max-w-6xl mx-auto px-5 md:px-8 py-8", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionMedium}
    >
      {children}
    </motion.div>
  );
}
