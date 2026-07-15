/**
 * Alyson motion system — slow, soft, aesthetic.
 * Prefer these tokens everywhere over one-off timings.
 */
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.4, 0, 0.2, 1] as const;

/** Durations in seconds — intentionally unhurried */
export const duration = {
  instant: 0.28,
  soft: 0.55,
  medium: 0.85,
  slow: 1.15,
  drift: 1.6,
} as const;

export const transitionSoft = {
  duration: duration.soft,
  ease: easeOut,
} as const;

export const transitionMedium = {
  duration: duration.medium,
  ease: easeOut,
} as const;

export const transitionSlow = {
  duration: duration.slow,
  ease: easeOut,
} as const;

/** Gentle springs — no snappy bounce */
export const springSoft = {
  type: "spring" as const,
  stiffness: 70,
  damping: 24,
  mass: 0.55,
};

export const springGentle = {
  type: "spring" as const,
  stiffness: 90,
  damping: 28,
  mass: 0.45,
};

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitionMedium,
  },
};
