"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export type TimelineEntry = {
  title: string;
  content: ReactNode;
};

type TimelineProps = {
  data: TimelineEntry[];
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Aceternity Timeline — sticky year/step markers + scroll beam that grows top → bottom.
 */
export function Timeline({
  data,
  title = "Changelog from my journey",
  description,
  className,
}: TimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className={cn("w-full font-sans", className)}>
      {(title || description) && (
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 md:px-8 lg:px-10">
          {title ? (
            <h2 className="mb-4 max-w-4xl font-[family-name:var(--landing-display)] text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="max-w-lg text-sm leading-relaxed text-zinc-500 md:text-base">{description}</p>
          ) : null}
        </div>
      )}

      <div ref={ref} className="relative mx-auto max-w-7xl pb-20">
        {data.map((item, index) => (
          <div key={`${item.title}-${index}`} className="flex justify-start pt-10 md:gap-10 md:pt-40">
            <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
              <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black md:left-3">
                <div className="h-3 w-3 rounded-full border border-blue-400/50 bg-blue-500/30 p-2 shadow-[0_0_12px_rgba(59,130,246,0.55)]" />
              </div>
              <h3 className="hidden text-xl font-bold text-zinc-600 md:block md:pl-20 md:text-5xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-20 pr-4 md:pl-4">
              <h3 className="mb-4 block text-left text-2xl font-bold text-zinc-500 md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        <div
          style={{ height: `${height}px` }}
          className="absolute left-8 top-0 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.08)_10%,rgba(255,255,255,0.08)_90%,transparent_100%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-blue-600 via-blue-400 to-transparent from-[0%] via-[12%]"
          />
        </div>
      </div>
    </div>
  );
}
