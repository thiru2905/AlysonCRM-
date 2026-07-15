"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { transitionMedium } from "@/lib/motion";

type CanvasTextProps = {
  text: string;
  className?: string;
  colors?: string[];
  animationDuration?: number;
  lineWidth?: number;
  lineGap?: number;
  curveIntensity?: number;
};

const DEFAULT_COLORS = ["#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6", "#38BDF8"];

/**
 * Readable hero highlight — solid blue glyphs + soft scanline shimmer.
 */
export function CanvasText({
  text,
  className,
  colors = DEFAULT_COLORS,
  animationDuration = 7,
  lineWidth = 2,
  lineGap = 5,
  curveIntensity = 8,
}: CanvasTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!waveRef.current) waveRef.current = document.createElement("canvas");
    const waveLayer = waveRef.current;
    const wctx = waveLayer.getContext("2d");
    if (!wctx) return;

    let running = true;
    const start = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.ceil(rect.width));
      const h = Math.max(1, Math.ceil(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      waveLayer.width = canvas.width;
      waveLayer.height = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    void document.fonts?.ready?.then(() => resize());

    const draw = (now: number) => {
      if (!running) return;
      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 1 || h < 1) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const styles = getComputedStyle(wrap);
      const fontFamily = styles.fontFamily || '"Space Grotesk", sans-serif';
      const fontWeight = styles.fontWeight || "600";
      const fontSize = styles.fontSize || "48px";
      const font = `${fontWeight} ${fontSize} ${fontFamily}`;
      const t = ((now - start) / 1000 / animationDuration) * Math.PI * 2;

      ctx.clearRect(0, 0, w, h);
      ctx.font = font;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // Solid readable letters
      const grad = ctx.createLinearGradient(0, h * 0.15, w, h * 0.9);
      grad.addColorStop(0, "#A5D8FF");
      grad.addColorStop(0.4, "#60A5FA");
      grad.addColorStop(1, "#2563EB");
      ctx.fillStyle = grad;
      ctx.fillText(text, 0, h / 2);

      // Soft glow behind
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.shadowColor = "rgba(59,130,246,0.5)";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "rgba(59,130,246,0.3)";
      ctx.fillText(text, 0, h / 2);
      ctx.restore();

      // Gentle wave shimmer clipped to glyphs
      wctx.clearRect(0, 0, w, h);
      const rows = Math.ceil(h / lineGap) + 2;
      for (let i = 0; i < rows; i++) {
        const y = i * lineGap;
        wctx.beginPath();
        wctx.strokeStyle = colors[i % colors.length];
        wctx.lineWidth = lineWidth;
        wctx.globalAlpha = 0.4 + 0.2 * Math.sin(t + i * 0.28);
        for (let x = 0; x <= w; x += 5) {
          const wave =
            Math.sin(x * 0.02 + t * 1.05 + i * 0.3) * (curveIntensity * 0.35) +
            Math.sin(x * 0.008 - t * 0.55 + i) * (curveIntensity * 0.18);
          const yy = y + wave;
          if (x === 0) wctx.moveTo(x, yy);
          else wctx.lineTo(x, yy);
        }
        wctx.stroke();
      }
      wctx.globalAlpha = 1;
      wctx.globalCompositeOperation = "destination-in";
      wctx.font = font;
      wctx.textAlign = "left";
      wctx.textBaseline = "middle";
      wctx.fillStyle = "#fff";
      wctx.fillText(text, 0, h / 2);
      wctx.globalCompositeOperation = "source-over";

      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = 0.75;
      ctx.drawImage(waveLayer, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [text, colors, animationDuration, lineWidth, lineGap, curveIntensity]);

  return (
    <motion.span
      ref={wrapRef}
      className={cn(
        "relative inline-block bg-transparent font-[family-name:var(--landing-display)] font-bold leading-none tracking-[-0.045em]",
        className,
      )}
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={transitionMedium}
      aria-label={text}
    >
      <span className="invisible whitespace-pre select-none" aria-hidden>
        {text}
      </span>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
    </motion.span>
  );
}

type HeroCanvasHeadlineProps = {
  lead: ReactNode;
  highlight: string;
  className?: string;
};

/** Hero headline — Space Grotesk, sized so the CTA ball stays in frame */
export function HeroCanvasHeadline({ lead, highlight, className }: HeroCanvasHeadlineProps) {
  return (
    <h1
      className={cn(
        "mx-auto max-w-3xl text-balance text-center font-[family-name:var(--landing-display)] font-medium leading-[1.12] tracking-[-0.04em]",
        "text-[1.85rem] sm:text-[2.4rem] md:text-[2.85rem] lg:text-[3.15rem]",
        className,
      )}
    >
      <motion.span
        className="text-[var(--landing-heading)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitionMedium, delay: 0.08 }}
      >
        {lead}{" "}
      </motion.span>
      <CanvasText
        text={highlight}
        className="align-baseline font-semibold text-[1.85rem] sm:text-[2.4rem] md:text-[2.85rem] lg:text-[3.15rem]"
      />
    </h1>
  );
}
