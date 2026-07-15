"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type LabBackgroundProps = {
  className?: string;
  glow?: number;
  sides?: boolean;
};

type Glitter = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
};

/** Dark-only lab backdrop for the landing page */
export function LabBackground({ className, glow = 0.55, sides = false }: LabBackgroundProps) {
  const g = glow;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor: "var(--landing-bg, #000)" }}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ backgroundColor: "var(--landing-bg, #000)" }} />

      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 55% 50% at 50% 42%, black 0%, transparent 72%)",
        }}
      />

      <div
        className="absolute left-1/2 top-[30%] h-[40vmax] w-[40vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{
          background: `radial-gradient(circle, rgba(59,130,246,${0.12 * g}) 0%, transparent 68%)`,
        }}
      />
      <div
        className="absolute bottom-[-8%] left-1/2 h-[28vmax] w-[55vmax] -translate-x-1/2 rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(circle, rgba(37,99,235,${0.09 * g}) 0%, transparent 70%)`,
        }}
      />

      {sides ? (
        <>
          <motion.div
            className="absolute -left-[12%] top-[8%] h-[70%] w-[42%] rounded-full blur-[90px]"
            style={{
              background: `radial-gradient(ellipse at 30% 40%, rgba(59,130,246,${0.28 * g}), rgba(56,189,248,${0.06 * g}) 45%, transparent 70%)`,
            }}
            animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.04, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-[12%] top-[12%] h-[70%] w-[42%] rounded-full blur-[90px]"
            style={{
              background: `radial-gradient(ellipse at 70% 45%, rgba(37,99,235,${0.26 * g}), rgba(96,165,250,${0.07 * g}) 45%, transparent 70%)`,
            }}
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.02, 1, 1.02] }}
            transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
          <SideGlitterField side="left" density={42} />
          <SideGlitterField side="right" density={42} />
        </>
      ) : null}

      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background: "linear-gradient(to bottom, var(--landing-bg), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background: "linear-gradient(to top, var(--landing-bg), transparent)",
        }}
      />
    </div>
  );
}

function SideGlitterField({
  side,
  density,
}: {
  side: "left" | "right";
  density: number;
}) {
  const reduce = useReducedMotion();
  const [particles, setParticles] = useState<Glitter[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: density }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.4 + 0.5,
        duration: 4 + Math.random() * 5,
        delay: Math.random() * 4,
        driftX: (Math.random() - 0.5) * 28,
        driftY: -18 - Math.random() * 36,
      })),
    );
  }, [density]);

  const position = useMemo(() => (side === "left" ? "left-0" : "right-0"), [side]);
  const gradId = `lab-glitter-${side}`;

  return (
    <div
      className={cn(
        "absolute top-0 h-full w-[min(28vw,340px)] overflow-hidden",
        position,
        "[mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]",
      )}
    >
      <svg className="h-full w-full" aria-hidden>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="1" />
            <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={
              reduce
                ? { opacity: 0.3 }
                : {
                    opacity: [0, 0.8, 0.3, 0.75, 0],
                    x: [0, p.driftX * 0.4, p.driftX, p.driftX * 0.5, 0],
                    y: [0, p.driftY * 0.35, p.driftY, p.driftY * 0.6, 0],
                  }
            }
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
