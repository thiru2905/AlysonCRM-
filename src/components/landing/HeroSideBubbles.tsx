"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Bubble = {
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
};

function buildField(seed: number, count: number): Bubble[] {
  const out: Bubble[] = [];
  let s = seed;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      top: `${8 + next() * 78}%`,
      left: `${8 + next() * 72}%`,
      size: 1.6 + next() * 3.4,
      duration: 2.5 + next() * 3,
      delay: next() * 2.4,
      driftX: (next() - 0.5) * 32,
      driftY: -12 - next() * 24,
    });
  }
  return out;
}

/** Soft juggling bubbles for the hero left / right gutters */
export function HeroSideBubbles({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const left = useMemo(() => buildField(11, 18), []);
  const right = useMemo(() => buildField(29, 18), []);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[3] overflow-hidden", className)}
      aria-hidden
    >
      <SideField side="left" bubbles={left} reduce={!!reduce} />
      <SideField side="right" bubbles={right} reduce={!!reduce} />
    </div>
  );
}

function SideField({
  side,
  bubbles,
  reduce,
}: {
  side: "left" | "right";
  bubbles: Bubble[];
  reduce: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute top-[6%] h-[88%] w-[min(28vw,300px)]",
        side === "left" ? "left-0" : "right-0",
      )}
      style={{
        maskImage:
          side === "left"
            ? "linear-gradient(to right, black 0%, black 45%, transparent 100%), linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)"
            : "linear-gradient(to left, black 0%, black 45%, transparent 100%), linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage:
          side === "left"
            ? "linear-gradient(to right, black 0%, black 45%, transparent 100%), linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)"
            : "linear-gradient(to left, black 0%, black 45%, transparent 100%), linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      {bubbles.map((b, i) => (
        <motion.span
          key={`${side}-${i}`}
          className="absolute rounded-full bg-sky-300"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            boxShadow:
              "0 0 10px 2px rgba(96,165,250,0.7), 0 0 22px 5px rgba(59,130,246,0.32)",
          }}
          animate={
            reduce
              ? { opacity: 0.45 }
              : {
                  opacity: [0.12, 0.95, 0.35, 1, 0.12],
                  x: [0, b.driftX * 0.55, -b.driftX * 0.4, b.driftX * 0.25, 0],
                  y: [0, b.driftY, b.driftY * 0.35, b.driftY * 0.8, 0],
                  scale: [0.7, 1.4, 0.85, 1.25, 0.7],
                }
          }
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
