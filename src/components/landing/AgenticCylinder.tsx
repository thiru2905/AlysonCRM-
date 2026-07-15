"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

type AgenticCylinderProps = {
  className?: string;
  scrollProgress?: MotionValue<number>;
};

/**
 * Hero CTA orb — larger matte sphere with brighter bubble glow around it.
 */
export function AgenticCylinder({ className, scrollProgress }: AgenticCylinderProps) {
  const reduce = useReducedMotion();
  const lift = useTransform(scrollProgress ?? emptyProgress(), [0, 1], [0, 22]);
  const springY = useSpring(lift, { stiffness: 55, damping: 22, mass: 0.5 });

  const bubbles = useMemo(
    () => [
      { t: "2%", l: "22%", s: 4.5, d: 3.4, delay: 0.05 },
      { t: "8%", l: "68%", s: 3.2, d: 4.1, delay: 0.35 },
      { t: "14%", l: "12%", s: 3.8, d: 3.8, delay: 0.7 },
      { t: "18%", l: "88%", s: 2.8, d: 4.6, delay: 0.2 },
      { t: "28%", l: "4%", s: 3.4, d: 3.5, delay: 1.0 },
      { t: "32%", l: "96%", s: 4.2, d: 4.3, delay: 0.55 },
      { t: "44%", l: "0%", s: 2.6, d: 5.0, delay: 0.9 },
      { t: "48%", l: "100%", s: 3.0, d: 3.9, delay: 1.25 },
      { t: "58%", l: "8%", s: 4.0, d: 4.4, delay: 0.15 },
      { t: "62%", l: "90%", s: 3.6, d: 3.7, delay: 0.8 },
      { t: "72%", l: "16%", s: 2.9, d: 4.8, delay: 0.4 },
      { t: "76%", l: "82%", s: 4.4, d: 3.6, delay: 1.1 },
      { t: "86%", l: "28%", s: 3.3, d: 4.2, delay: 0.25 },
      { t: "90%", l: "72%", s: 2.7, d: 5.1, delay: 0.65 },
      { t: "96%", l: "48%", s: 3.9, d: 3.8, delay: 1.35 },
      { t: "6%", l: "48%", s: 2.4, d: 4.7, delay: 0.95 },
      { t: "38%", l: "42%", s: 2.2, d: 5.3, delay: 0.5 },
      { t: "52%", l: "58%", s: 2.5, d: 4.0, delay: 1.4 },
      { t: "24%", l: "56%", s: 2.0, d: 4.5, delay: 0.75 },
      { t: "68%", l: "44%", s: 2.3, d: 3.9, delay: 1.15 },
    ],
    [],
  );

  /** Extra tiny pops — short pop / fade cycles around the rim */
  const popBubbles = useMemo(
    () => [
      { t: "10%", l: "38%", s: 2.2, d: 2.4, delay: 0.1 },
      { t: "22%", l: "78%", s: 1.8, d: 2.8, delay: 0.55 },
      { t: "40%", l: "18%", s: 2.0, d: 2.2, delay: 1.0 },
      { t: "55%", l: "84%", s: 1.6, d: 2.6, delay: 0.35 },
      { t: "78%", l: "34%", s: 2.1, d: 2.3, delay: 0.8 },
      { t: "88%", l: "62%", s: 1.7, d: 2.7, delay: 1.35 },
    ],
    [],
  );

  return (
    <motion.div
      className={cn(
        "relative mx-auto flex h-[280px] w-full max-w-lg items-end justify-center sm:h-[340px]",
        className,
      )}
      style={{ y: springY }}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      aria-hidden
    >
      {/* Stronger floor bloom */}
      <motion.div
        className="pointer-events-none absolute bottom-[-6%] left-1/2 h-28 w-[72%] -translate-x-1/2 rounded-[100%] bg-blue-500/28 blur-3xl"
        animate={reduce ? undefined : { opacity: [0.35, 0.6, 0.35], scaleX: [0.92, 1.06, 0.92] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[8%] left-1/2 h-40 w-[60%] -translate-x-1/2 rounded-[100%] bg-sky-400/15 blur-3xl"
        animate={reduce ? undefined : { opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      <motion.div
        className="relative mb-[-4%] aspect-square w-[68%] max-w-[280px] sm:w-[62%] sm:max-w-[320px]"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Bubbles around the ball */}
        <div className="pointer-events-none absolute -inset-[36%]">
          {bubbles.map((b, i) => (
            <motion.span
              key={`glow-${i}`}
              className="absolute rounded-full bg-sky-300"
              style={{
                top: b.t,
                left: b.l,
                width: b.s,
                height: b.s,
                boxShadow: "0 0 14px 3px rgba(96,165,250,0.75), 0 0 28px 6px rgba(59,130,246,0.35)",
              }}
              animate={
                reduce
                  ? { opacity: 0.55 }
                  : {
                      opacity: [0.2, 1, 0.35, 0.95, 0.2],
                      scale: [0.7, 1.35, 0.85, 1.2, 0.7],
                      y: [0, -8, 2, -5, 0],
                    }
              }
              transition={{
                duration: b.d,
                delay: b.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          {popBubbles.map((b, i) => (
            <motion.span
              key={`pop-${i}`}
              className="absolute rounded-full bg-blue-400"
              style={{
                top: b.t,
                left: b.l,
                width: b.s,
                height: b.s,
                boxShadow: "0 0 10px 2px rgba(96,165,250,0.9), 0 0 22px 5px rgba(59,130,246,0.45)",
              }}
              animate={
                reduce
                  ? { opacity: 0.4 }
                  : {
                      opacity: [0, 1, 0.85, 0],
                      scale: [0.2, 1.55, 1.1, 0.4],
                      y: [4, -6, -10, -14],
                    }
              }
              transition={{
                duration: b.d,
                delay: b.delay,
                repeat: Infinity,
                ease: "easeOut",
                repeatDelay: 0.45,
              }}
            />
          ))}
        </div>

        {/* Torch catch on the ball — left / top rim lit by beam */}
        <div
          className="pointer-events-none absolute -left-[18%] -top-[22%] z-[2] h-[70%] w-[70%] rounded-full opacity-90"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, rgba(186,230,253,0.35) 22%, rgba(59,130,246,0.18) 48%, transparent 70%)",
            filter: "blur(6px)",
          }}
        />
        <div
          className="pointer-events-none absolute left-[6%] top-[8%] z-[3] h-[42%] w-[48%] rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.65), rgba(147,197,253,0.25) 40%, transparent 72%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Soft rim glow */}
        <div
          className="absolute -inset-[14%] rounded-full opacity-80 blur-2xl"
          style={{
            background:
              "radial-gradient(circle at 70% 75%, rgba(59,130,246,0.4), rgba(56,189,248,0.12) 40%, transparent 62%)",
          }}
        />
        <div
          className="absolute -inset-[6%] rounded-full opacity-50 blur-xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(147,197,253,0.25), transparent 50%)",
          }}
        />

        {/* Sphere body */}
        <div
          className="relative h-full w-full rounded-full"
          style={{
            background: [
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0%, rgba(226,232,240,0.22) 12%, transparent 28%)",
              "radial-gradient(circle at 72% 70%, rgba(59,130,246,0.55) 0%, rgba(37,99,235,0.22) 28%, transparent 52%)",
              "radial-gradient(circle at 50% 48%, #3f4654 0%, #232833 42%, #12151c 72%, #0a0c10 100%)",
            ].join(", "),
            boxShadow: [
              "inset -18px -22px 40px rgba(0,0,0,0.55)",
              "inset 14px 16px 28px rgba(255,255,255,0.06)",
              "0 28px 56px rgba(0,0,0,0.5)",
              "0 0 72px -12px rgba(59,130,246,0.55)",
            ].join(", "),
          }}
        >
          <div
            className="absolute left-[18%] top-[14%] h-[26%] w-[34%] rounded-full opacity-90"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.7), rgba(255,255,255,0.15) 45%, transparent 70%)",
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 78% 62%, rgba(96,165,250,0.22), transparent 35%)",
            }}
          />
          <div
            className="absolute inset-x-[12%] bottom-[6%] h-[18%] rounded-[100%] opacity-50 blur-md"
            style={{
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55), transparent 70%)",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function emptyProgress(): MotionValue<number> {
  return { get: () => 0, set: () => {}, on: () => () => {}, getVelocity: () => 0 } as MotionValue<number>;
}

export function LiveBeep() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5" aria-hidden>
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-400"
        animate={{ scale: [1, 2.2, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-400/70"
        animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
      />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.75)]" />
    </span>
  );
}
