"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import {
  fadeUp,
  springGentle,
  staggerContainer,
  staggerItem,
  transitionMedium,
  transitionSlow,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "animate" | "transition">;

/** Soft fade-up for page sections and cards */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 14,
  once = true,
  ...rest
}: FadeInProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-8% 0px" }}
      transition={{ ...transitionMedium, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
};

/** Parent for staggered children (use with StaggerItem) */
export function Stagger({ children, className }: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-6% 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/** Route-level soft entrance */
export function PageFade({
  children,
  className,
  routeKey,
}: {
  children: ReactNode;
  className?: string;
  routeKey: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn("min-h-full", className)}>{children}</div>;
  }

  return (
    <motion.div
      key={routeKey}
      className={cn("min-h-full", className)}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={transitionSlow}
    >
      {children}
    </motion.div>
  );
}

/** Subtle hover lift for interactive cards / rows */
export function SoftHover({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{ y: -2 }}
      transition={springGentle}
    >
      {children}
    </motion.div>
  );
}
