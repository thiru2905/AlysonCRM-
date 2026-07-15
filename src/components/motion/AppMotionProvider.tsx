"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { easeOut, transitionMedium } from "@/lib/motion";

/** Global Framer Motion defaults — slow, smooth, respects prefers-reduced-motion */
export function AppMotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        ...transitionMedium,
        ease: easeOut as unknown as number[],
      }}
    >
      {children}
    </MotionConfig>
  );
}
