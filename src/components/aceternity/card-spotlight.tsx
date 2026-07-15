"use client";

import { useMotionValue, motion, useMotionTemplate } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardSpotlightProps = {
  children: ReactNode;
  radius?: number;
  /** Spotlight fill color (reveals underlying texture) */
  color?: string;
  className?: string;
};

/**
 * Aceternity Card Spotlight — cursor-follow radial glow that reveals a sparkle grid.
 */
export function CardSpotlight({
  children,
  radius = 350,
  color = "rgba(59, 130, 246, 0.22)",
  className,
}: CardSpotlightProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const maskImage = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black, transparent)`;
  const glowBackground = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 65%)`;
  const shimmerBackground = useMotionTemplate`radial-gradient(${radius * 0.55}px circle at ${mouseX}px ${mouseY}px, rgba(96,165,250,0.35), transparent 55%)`;

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group/spotlight relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505]",
        className,
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition duration-500 group-hover/spotlight:opacity-100"
        style={{
          backgroundImage: "radial-gradient(rgba(147,197,253,0.55) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition duration-500 group-hover/spotlight:opacity-100"
        style={{ background: glowBackground }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 transition duration-500 group-hover/spotlight:opacity-100"
        style={{ background: shimmerBackground, mixBlendMode: "screen" }}
      />

      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}

type SpotlightFeatureCardProps = {
  title: string;
  description: string;
  steps: string[];
  footer?: string;
  className?: string;
};

/** Checklist card matching the Aceternity Card Spotlight preview */
export function SpotlightFeatureCard({
  title,
  description,
  steps,
  footer,
  className,
}: SpotlightFeatureCardProps) {
  return (
    <CardSpotlight
      className={cn("flex h-full flex-col p-6 sm:p-8", className)}
      radius={380}
      color="rgba(59,130,246,0.28)"
    >
      <h3 className="font-[family-name:var(--landing-display)] text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-3 text-sm text-zinc-200">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(59,130,246,0.55)]">
              ✓
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-6 text-xs leading-relaxed text-zinc-500">{footer}</p> : null}
    </CardSpotlight>
  );
}
