"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BentoItem = {
  title: string;
  description: string;
  to?: string;
  icon?: ReactNode;
  badge?: string;
  header?: ReactNode;
  className?: string;
};

type BentoGridProps = {
  className?: string;
  children: ReactNode;
};

/** Aceternity-style bento grid shell */
export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-6xl grid-cols-1 gap-3 md:auto-rows-[12rem] md:grid-cols-3 lg:gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

type BentoGridItemProps = BentoItem & {
  index?: number;
};

export function BentoGridItem({
  title,
  description,
  to,
  icon,
  badge,
  header,
  className,
  index = 0,
}: BentoGridItemProps) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.85, delay: Math.min(index * 0.07, 0.45), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex h-full min-h-[10.5rem] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505] p-5 transition duration-300",
        "hover:border-blue-500/35 hover:shadow-[0_0_48px_-16px_rgba(59,130,246,0.5)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_circle_at_50%_0%,rgba(59,130,246,0.1),transparent_45%)] opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {header ? <div className="relative z-10 mb-3 flex-1">{header}</div> : null}

      <div className="relative z-10 mt-auto space-y-3">
        <div className="flex items-start justify-between gap-3">
          {icon ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black text-blue-300 transition group-hover:border-blue-500/40 group-hover:text-sky-300">
              {icon}
            </div>
          ) : (
            <span />
          )}
          {badge ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2 py-0.5 font-[family-name:var(--landing-mono)] text-[9px] uppercase tracking-[0.14em] text-emerald-300/90">
              {badge}
            </span>
          ) : null}
        </div>
        <div>
          <h3 className="font-[family-name:var(--landing-display)] text-sm font-semibold text-white sm:text-[15px]">
            {title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:text-[13px]">{description}</p>
        </div>
      </div>
    </motion.div>
  );

  if (!to) {
    return <div className={cn("h-full", className)}>{card}</div>;
  }

  return (
    <Link to={to as "/"} className={cn("block h-full", className)}>
      {card}
    </Link>
  );
}
