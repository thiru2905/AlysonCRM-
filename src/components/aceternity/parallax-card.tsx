"use client";

import {
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import { duration, easeOut } from "@/lib/motion";

type ParallaxCardProps = {
  children: ReactNode;
  className?: string;
  tilt?: number;
  glow?: string;
  disableTilt?: boolean;
  hoverLift?: number;
};

/**
 * 3D parallax panel — tilts to cursor and lifts toward the viewer on hover.
 */
export function ParallaxCard({
  children,
  className,
  tilt = 8,
  glow = "rgba(255, 255, 255, 0.07)",
  disableTilt = false,
  hoverLift = 28,
}: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const lift = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [tilt, -tilt]), {
    stiffness: 150,
    damping: 22,
    mass: 0.4,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-tilt, tilt]), {
    stiffness: 150,
    damping: 22,
    mass: 0.4,
  });
  const z = useSpring(lift, { stiffness: 180, damping: 24, mass: 0.35 });
  const glowX = useSpring(px, { stiffness: 220, damping: 28 });
  const glowY = useSpring(py, { stiffness: 220, damping: 28 });
  const background = useMotionTemplate`radial-gradient(420px circle at ${glowX}px ${glowY}px, ${glow}, transparent 55%)`;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
    px.set(e.clientX - rect.left);
    py.set(e.clientY - rect.top);
  }

  function onEnter() {
    lift.set(hoverLift);
  }

  function onLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
    lift.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={
        disableTilt
          ? { z, transformStyle: "preserve-3d" as const }
          : {
              rotateX,
              rotateY,
              z,
              transformStyle: "preserve-3d" as const,
            }
      }
      transition={{ duration: duration.soft, ease: easeOut }}
      className={cn(
        "group/parallax relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#070707]",
        "transition-[box-shadow,border-color] duration-500 will-change-transform",
        "hover:border-white/20 hover:shadow-[0_28px_70px_-28px_rgba(0,0,0,0.95),0_0_40px_-20px_rgba(59,130,246,0.25)]",
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition duration-500 group-hover/parallax:opacity-100"
        style={{ background }}
      />
      <div className="relative z-10" style={{ transform: "translateZ(28px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

type ParallaxStageProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Mission Control stage — scrolls up toward the viewer, then tracks the cursor.
 */
export function ParallaxStage({ children, className }: ParallaxStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start 0.92", "start 0.28"],
  });

  const riseY = useSpring(useTransform(scrollYProgress, [0, 1], [110, 0]), {
    stiffness: 70,
    damping: 22,
    mass: 0.55,
  });
  const riseScale = useSpring(useTransform(scrollYProgress, [0, 1], [0.86, 1]), {
    stiffness: 70,
    damping: 22,
    mass: 0.55,
  });
  const riseRotateX = useSpring(useTransform(scrollYProgress, [0, 1], [14, 0]), {
    stiffness: 70,
    damping: 22,
    mass: 0.55,
  });
  const riseOpacity = useSpring(useTransform(scrollYProgress, [0, 0.35, 1], [0.35, 0.85, 1]), {
    stiffness: 80,
    damping: 24,
  });

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const hoverZ = useMotionValue(0);

  const tiltX = useSpring(useTransform(my, [0, 1], [5, -5]), {
    stiffness: 90,
    damping: 22,
  });
  const tiltY = useSpring(useTransform(mx, [0, 1], [-6.5, 6.5]), {
    stiffness: 90,
    damping: 22,
  });
  const boardZ = useSpring(hoverZ, { stiffness: 120, damping: 20 });
  const sheenX = useSpring(gx, { stiffness: 90, damping: 26 });
  const sheenY = useSpring(gy, { stiffness: 90, damping: 26 });
  const sheen = useMotionTemplate`radial-gradient(900px circle at ${sheenX}px ${sheenY}px, rgba(255,255,255,0.07), transparent 52%)`;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = boardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
    gx.set(e.clientX - rect.left);
    gy.set(e.clientY - rect.top);
  }

  function onEnter() {
    hoverZ.set(36);
  }

  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
    hoverZ.set(0);
  }

  return (
    <div ref={wrapRef} className={cn("relative [perspective:2200px]", className)}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 bottom-[-8%] h-24 rounded-[100%] bg-blue-500/15 blur-3xl"
        style={{ opacity: riseOpacity, scaleX: riseScale }}
      />

      {/* Scroll approach toward the viewer */}
      <motion.div
        style={{
          y: riseY,
          scale: riseScale,
          rotateX: riseRotateX,
          opacity: riseOpacity,
          transformStyle: "preserve-3d",
          transformOrigin: "center bottom",
        }}
        className="will-change-transform"
      >
        {/* Cursor tilt layer */}
        <motion.div
          ref={boardRef}
          onMouseMove={onMove}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{
            rotateX: tiltX,
            rotateY: tiltY,
            z: boardZ,
            transformStyle: "preserve-3d",
          }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505] shadow-[0_40px_120px_-48px_rgba(0,0,0,0.95),0_0_80px_-40px_rgba(59,130,246,0.28)] will-change-transform"
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 opacity-80"
            style={{ background: sheen }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] rounded-2xl ring-1 ring-inset ring-white/[0.04]"
          />
          <div className="relative z-10" style={{ transform: "translateZ(12px)" }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Lift + gloss row for dense lists inside terminal panels */
export function ParallaxRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 3, backgroundColor: "rgba(255,255,255,0.035)" }}
      transition={{ duration: duration.instant, ease: easeOut }}
      className={cn("-mx-1.5 rounded-md px-1.5 transition-colors", className)}
    >
      {children}
    </motion.div>
  );
}
