"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type MovingBorderProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
};

/** Aceternity-inspired moving border around CTAs / chips */
export function MovingBorder({
  children,
  className,
  containerClassName,
  duration = 4,
}: MovingBorderProps) {
  return (
    <div className={cn("relative inline-flex overflow-hidden rounded-full p-[1px]", containerClassName)}>
      <motion.div
        className="absolute inset-[-100%]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, #3B82F6 60deg, #93C5FD 90deg, transparent 140deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
      <div className={cn("relative z-10 rounded-full bg-black", className)}>{children}</div>
    </div>
  );
}
