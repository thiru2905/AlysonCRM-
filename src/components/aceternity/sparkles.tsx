"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type SparklesProps = {
  className?: string;
  particleColor?: string;
  particleDensity?: number;
};

type Particle = { id: number; x: number; y: number; size: number; duration: number; delay: number };

/** Lightweight Aceternity-inspired sparkle field */
export function SparklesCore({
  className,
  particleColor = "#60A5FA",
  particleDensity = 48,
}: SparklesProps) {
  const id = useId();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: particleDensity }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.2 + 0.6,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      })),
    );
  }, [particleDensity]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      <svg className="h-full w-full">
        <defs>
          <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={particleColor} stopOpacity="1" />
            <stop offset="100%" stopColor={particleColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill={`url(#${id}-g)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.2, 1, 0], y: [0, -12, 0] }}
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
