"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, easeOut, transitionMedium } from "@/lib/motion";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  title?: string;
  description?: string;
  category?: string;
  items: FaqItem[];
  className?: string;
  /** Open the first item by default (matches Aceternity preview) */
  defaultOpen?: number | null;
};

/**
 * Aceternity-style FAQ — dashed frame on the open row, + / × toggle, soft expand.
 */
export function FaqAccordion({
  title = "Frequently Asked Questions",
  description = "Everything you need to know about deploying AI agents and automating your workflows.",
  category = "Runtime",
  items,
  className,
  defaultOpen = 0,
}: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={transitionMedium}
      className={cn("mx-auto w-full max-w-3xl", className)}
    >
      <div className="text-center">
        <h2 className="font-[family-name:var(--landing-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          {description}
        </p>
      </div>

      <div className="relative mt-14">
        {/* blueprint rails */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px border-l border-dashed border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px border-l border-dashed border-white/10"
        />

        <p className="mb-4 px-1 font-[family-name:var(--landing-mono)] text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          {category}
        </p>

        <ul className="space-y-3">
          {items.map((item, index) => {
            const isOpen = open === index;
            return (
              <li key={item.question}>
                <div
                  className={cn(
                    "rounded-xl transition-[border-color,background-color] duration-500",
                    isOpen
                      ? "border border-dashed border-white/25 bg-white/[0.02]"
                      : "border border-transparent",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
                  >
                    <span className="font-[family-name:var(--landing-display)] text-[15px] font-semibold leading-snug text-white sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition duration-300",
                        isOpen
                          ? "border-white/20 bg-white/[0.06] text-white"
                          : "border-transparent text-zinc-400",
                      )}
                    >
                      {isOpen ? <X className="h-4 w-4" strokeWidth={1.75} /> : <Plus className="h-4 w-4" strokeWidth={1.75} />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: duration.soft, ease: easeOut }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-dashed border-white/10 px-4 pb-5 pt-1 text-sm leading-relaxed text-zinc-400 sm:px-5 sm:pb-6">
                          {item.answer}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
