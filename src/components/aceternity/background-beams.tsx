"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const PATHS = [
  "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
  "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
  "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
  "M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851",
  "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
  "M-345 -229C-345 -229 -277 176 187 303C651 430 719 835 719 835",
  "M-338 -237C-338 -237 -270 168 194 295C658 422 726 827 726 827",
  "M-331 -245C-331 -245 -263 160 201 287C665 414 733 819 733 819",
];

type BackgroundBeamsProps = {
  className?: string;
};

/** Aceternity-style animated SVG beams */
export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]",
        className,
      )}
      aria-hidden
    >
      <svg
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {PATHS.map((path, i) => (
          <motion.path
            key={path}
            d={path}
            stroke={`url(#landing-beam-${i})`}
            strokeOpacity="0.35"
            strokeWidth="0.5"
            initial={{ pathLength: 0.2, opacity: 0.2 }}
            animate={{
              pathLength: [0.2, 1, 0.2],
              opacity: [0.2, 0.55, 0.2],
            }}
            transition={{
              duration: 8 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.35,
            }}
          />
        ))}
        <defs>
          {PATHS.map((_, i) => (
            <motion.linearGradient
              key={i}
              id={`landing-beam-${i}`}
              x1="0%"
              x2="100%"
              y1="0%"
              y2="0%"
              gradientUnits="userSpaceOnUse"
              animate={{
                x1: ["0%", "100%"],
                x2: ["0%", "95%"],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.2,
              }}
            >
              <stop stopColor="#3B82F6" stopOpacity="0" />
              <stop offset="0.4" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#93C5FD" stopOpacity="0" />
            </motion.linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
}
