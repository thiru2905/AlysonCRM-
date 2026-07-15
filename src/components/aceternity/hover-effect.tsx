"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { springGentle, transitionMedium } from "@/lib/motion";

export type HoverItem = {
  title: string;
  description: string;
  to: string;
  icon?: ReactNode;
  badge?: string;
};

type HoverEffectProps = {
  items: HoverItem[];
  className?: string;
};

/** Aceternity HoverEffect — interactive module cards */
export function HoverEffect({ items, className }: HoverEffectProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {items.map((item, idx) => (
        <Link
          key={item.to + item.title}
          to={item.to}
          className="group relative block h-full rounded-2xl p-2"
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
        >
          <AnimatePresence>
            {hovered === idx ? (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-2xl bg-white/[0.04]"
                layoutId="landing-hover-bg"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: springGentle,
                }}
                exit={{
                  opacity: 0,
                  transition: transitionMedium,
                }}
              />
            ) : null}
          </AnimatePresence>
          <div className="relative z-10 flex h-full flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#050505] p-5 transition group-hover:border-white/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black text-zinc-300">
                {item.icon}
              </div>
              {item.badge ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="font-[family-name:var(--landing-display)] text-base font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
