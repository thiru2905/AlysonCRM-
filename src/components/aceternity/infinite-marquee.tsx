"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type TweetCard = {
  handle: string;
  name: string;
  body: string;
  meta?: string;
};

type InfiniteMarqueeProps = {
  items: TweetCard[];
  className?: string;
  speed?: number;
  reverse?: boolean;
};

export function InfiniteMarquee({
  items,
  className,
  speed = 42,
  reverse = false,
}: InfiniteMarqueeProps) {
  const row = [...items, ...items];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <motion.div
        className="flex w-max gap-4 py-2"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {row.map((item, i) => (
          <article
            key={`${item.handle}-${i}`}
            className="w-[300px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#050505] p-4 sm:w-[340px]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-xs font-semibold text-zinc-200">
                {item.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-white">{item.name}</p>
                <p className="truncate text-xs text-zinc-500">{item.handle}</p>
              </div>
              {item.meta ? (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-600">
                  {item.meta}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-left text-sm leading-relaxed text-zinc-300">{item.body}</p>
          </article>
        ))}
      </motion.div>
    </div>
  );
}
