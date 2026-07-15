"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type TextGenerateEffectProps = {
  words: string;
  className?: string;
  highlight?: string | string[];
  highlightClassName?: string;
};

/** Soft staggered word reveal — balanced headline scale */
export function TextGenerateEffect({
  words,
  className,
  highlight,
  highlightClassName,
}: TextGenerateEffectProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const parts = words.split(" ");
  const highlights = new Set(
    (Array.isArray(highlight) ? highlight : highlight ? [highlight] : []).map((h) =>
      h.replace(/[.,!?]/g, ""),
    ),
  );

  return (
    <h1
      ref={ref}
      className={cn(
        "font-[family-name:var(--landing-display)] text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-white sm:text-[2.35rem] md:text-[2.85rem] lg:text-[3.15rem]",
        className,
      )}
    >
      {parts.map((word, i) => {
        const isHighlight = highlights.has(word.replace(/[.,!?]/g, ""));
        return (
          <motion.span
            key={`${word}-${i}`}
            className={cn("mr-[0.3em] inline-block last:mr-0", isHighlight && highlightClassName)}
            initial={{ opacity: 0, y: 8, filter: "blur(5px)" }}
            animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={{
              duration: 0.6,
              delay: 0.15 + i * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}
