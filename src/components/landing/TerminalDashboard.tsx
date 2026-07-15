"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ArrowRight, CircleDot } from "lucide-react";
import { LiveBeep } from "@/components/landing/AgenticCylinder";
import {
  ParallaxCard,
  ParallaxRow,
  ParallaxStage,
} from "@/components/aceternity/parallax-card";
import { transitionMedium, transitionSlow } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TICKERS = [
  { k: "PIPELINE", v: "$4.82M", d: "+3.2%", up: true },
  { k: "P(HIT MRR)", v: "0.71", d: "+0.04", up: true },
  { k: "WORKERS", v: "38 / 42", d: "6 idle", up: true },
  { k: "APPROVALS", v: "7", d: "2 hot", up: false },
  { k: "HERMES", v: "READY", d: "paired", up: true },
  { k: "BURN", v: "$1.14k/h", d: "−8%", up: true },
  { k: "LEARN Δ", v: "+142", d: "24h", up: true },
];

const OUTCOMES = [
  { label: "Revenue booked", value: "+$186k", conf: 0.82 },
  { label: "Meetings landed", value: "24", conf: 0.9 },
  { label: "Cycle time saved", value: "−11d", conf: 0.77 },
  { label: "Cost avoided", value: "$9.2k", conf: 0.86 },
];

const SCHEDULE = [
  { t: "09:45", who: "You", what: "Approve Northwind redline v3", ev: "$148k" },
  { t: "10:00", who: "Atlas", what: "Draft Halden security response", ev: "$92k" },
  { t: "11:15", who: "Scout", what: "EDGAR sweep · Sable filings", ev: "$320k" },
  { t: "12:00", who: "Nova", what: "Send 42 personalized outreach", ev: "+$14k" },
  { t: "14:00", who: "You", what: "Review 3 experiment winners", ev: "+11%" },
];

const HEALTH = [
  { label: "Pipeline coverage", value: "3.4×", ok: true },
  { label: "Worker utilization", value: "91%", ok: true },
  { label: "Approval lag", value: "38m", ok: false },
  { label: "Hermes send pace", value: "1–2/d", ok: true },
  { label: "Browser session", value: "paired", ok: true },
];

const ROI = [
  { task: "Northwind redline", rpm: "$37k/min", w: "92%" },
  { task: "Marc offer band 4B", rpm: "$109k/min", w: "78%" },
  { task: "OSS outreach batch", rpm: "$14k/min", w: "64%" },
  { task: "Sable EDGAR enrich", rpm: "$53k/min", w: "71%" },
];

const EXPERIMENTS = [
  { name: "OSS-hook · Security", status: "WINNING", delta: "+19%", tone: "win" as const },
  { name: "Short-subject · SaaS", status: "SHIPPING", delta: "+8%", tone: "ship" as const },
  { name: "Voice-first follow-up", status: "RUNNING", delta: "+3%", tone: "run" as const },
];

const FORECAST = [28, 34, 31, 40, 38, 46, 44, 52, 49, 58, 61, 55, 64, 70];

/** Bloomberg-style Mission Control preview — parallax hover + cursor glow */
export function TerminalDashboard() {
  return (
    <ParallaxStage>
      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <LiveBeep />
          <div>
            <p className="font-[family-name:var(--landing-mono)] text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Alyson · Live
            </p>
            <p className="font-[family-name:var(--landing-display)] text-sm font-semibold tracking-tight text-white">
              Mission Control
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-[family-name:var(--landing-mono)] text-[10px] text-zinc-600 sm:inline">
            Mon · 09:41:22 GMT
          </span>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/overview"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-[0_0_24px_-6px_rgba(255,255,255,0.55)] transition hover:bg-zinc-100"
            >
              #APPROVE TOP 4
              <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Ticker */}
      <div className="flex gap-0 overflow-x-auto border-b border-white/[0.06] scrollbar-thin">
        {TICKERS.map((t) => (
          <motion.div
            key={t.k}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            className="flex shrink-0 cursor-default items-baseline gap-2 border-r border-white/[0.05] px-4 py-2.5 font-[family-name:var(--landing-mono)]"
          >
            <span className="text-[9px] tracking-wider text-zinc-600">{t.k}</span>
            <span className="text-[11px] font-medium text-white">{t.v}</span>
            <span className={cn("text-[10px]", t.up ? "text-emerald-400" : "text-amber-400")}>{t.d}</span>
          </motion.div>
        ))}
      </div>

      {/* Headline strip */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="max-w-xl">
          <h3 className="font-[family-name:var(--landing-display)] text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Alyson is running the company. You supervise.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            7 approvals waiting · est.{" "}
            <span className="text-blue-300">+$186k</span> if top actions ship today.
          </p>
        </div>
        <Link
          to="/overview"
          className="inline-flex items-center gap-2 text-xs font-medium text-blue-300 transition hover:text-blue-200"
        >
          Open full terminal
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Dense terminal grid */}
      <div
        className="grid grid-cols-1 gap-3 bg-transparent p-3 md:grid-cols-12 md:gap-3 md:p-4"
        style={{ transformStyle: "preserve-3d" }}
      >
        <TerminalPanel className="md:col-span-5" title="Today · Predicted outcomes" tilt={6} delay={0.04}>
          <div className="space-y-3">
            {OUTCOMES.map((o, i) => (
              <ParallaxRow key={o.label}>
                <div className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="font-[family-name:var(--landing-mono)] text-[10px] uppercase tracking-wider text-zinc-500">
                    {o.label}
                  </span>
                  <span className="text-sm font-semibold text-white">{o.value}</span>
                </div>
                <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-blue-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${o.conf * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ ...transitionMedium, delay: i * 0.04 }}
                  />
                </div>
              </ParallaxRow>
            ))}
          </div>
        </TerminalPanel>

        <TerminalPanel className="md:col-span-4" title="Revenue forecast" tilt={7} delay={0.08}>
          <p className="font-[family-name:var(--landing-display)] text-2xl font-semibold text-white">$4.82M</p>
          <p className="mt-0.5 font-[family-name:var(--landing-mono)] text-[10px] text-emerald-400">P50 · +3.2%</p>
          <div className="mt-4 flex h-16 items-end gap-[3px]">
            {FORECAST.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-blue-600/80 to-sky-400/50"
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                whileHover={{ scaleY: 1.12, filter: "brightness(1.25)" }}
                viewport={{ once: true }}
                transition={{ ...transitionMedium, delay: i * 0.04 }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between font-[family-name:var(--landing-mono)] text-[9px] text-zinc-600">
            <span>P10 $3.4M</span>
            <span>P50 $4.82M</span>
            <span>P90 $6.1M</span>
          </div>
        </TerminalPanel>

        <TerminalPanel className="md:col-span-3" title="Organization health" tilt={6} delay={0.12}>
          <ul className="space-y-1">
            {HEALTH.map((h) => (
              <li key={h.label}>
                <ParallaxRow className="flex items-center justify-between gap-2 py-1.5">
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    <CircleDot className={cn("h-3 w-3", h.ok ? "text-emerald-400" : "text-amber-400")} />
                    {h.label}
                  </span>
                  <span className="font-[family-name:var(--landing-mono)] text-[11px] text-white">{h.value}</span>
                </ParallaxRow>
              </li>
            ))}
          </ul>
        </TerminalPanel>

        <TerminalPanel className="md:col-span-5" title="Recommended schedule" tilt={5.5} delay={0.1}>
          <ul className="space-y-0">
            {SCHEDULE.map((s) => (
              <li key={s.t + s.what}>
                <ParallaxRow className="flex items-start gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
                  <span className="w-10 shrink-0 font-[family-name:var(--landing-mono)] text-[10px] text-zinc-600">
                    {s.t}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white">{s.what}</p>
                    <p className="mt-0.5 font-[family-name:var(--landing-mono)] text-[10px] text-zinc-600">{s.who}</p>
                  </div>
                  <span className="shrink-0 font-[family-name:var(--landing-mono)] text-[10px] text-blue-300">{s.ev}</span>
                </ParallaxRow>
              </li>
            ))}
          </ul>
        </TerminalPanel>

        <TerminalPanel className="md:col-span-4" title="Predicted ROI by task" tilt={6} delay={0.14}>
          <div className="space-y-2">
            {ROI.map((r, i) => (
              <ParallaxRow key={r.task} className="py-1">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-zinc-400">{r.task}</span>
                  <span className="font-[family-name:var(--landing-mono)] text-blue-300">{r.rpm}</span>
                </div>
                <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-blue-400/80"
                    initial={{ width: 0 }}
                    whileInView={{ width: r.w }}
                    viewport={{ once: true }}
                    transition={{ ...transitionMedium, delay: i * 0.05 }}
                  />
                </div>
              </ParallaxRow>
            ))}
          </div>
        </TerminalPanel>

        <TerminalPanel className="md:col-span-3" title="Experiments running" tilt={7} delay={0.18}>
          <ul className="space-y-3">
            {EXPERIMENTS.map((e) => (
              <motion.li
                key={e.name}
                whileHover={{ y: -2, scale: 1.015 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-lg border border-white/[0.06] bg-black/40 px-3 py-2.5 hover:border-white/15 hover:bg-black/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-[family-name:var(--landing-mono)] text-[9px] uppercase tracking-wider",
                      e.tone === "win" && "bg-emerald-500/10 text-emerald-400/90",
                      e.tone === "ship" && "bg-white/[0.06] text-zinc-300",
                      e.tone === "run" && "bg-zinc-500/10 text-zinc-500",
                    )}
                  >
                    {e.status}
                  </span>
                  <span className="font-[family-name:var(--landing-mono)] text-[11px] text-white">{e.delta}</span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">{e.name}</p>
              </motion.li>
            ))}
          </ul>
        </TerminalPanel>

        <TerminalPanel className="md:col-span-12" title="Hermes · LinkedIn runtime" tilt={3.5} delay={0.2}>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { k: "Desktop Agent", v: "8787", s: "online" },
              { k: "Browser MCP", v: "8820", s: "online" },
              { k: "Profiles saved", v: "3", s: "synced" },
              { k: "Invites pending", v: "1", s: "approve" },
            ].map((c) => (
              <motion.div
                key={c.k}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-lg border border-white/[0.06] bg-black/50 px-3 py-3 hover:border-white/15 hover:bg-black/70"
              >
                <p className="font-[family-name:var(--landing-mono)] text-[9px] uppercase tracking-wider text-zinc-600">
                  {c.k}
                </p>
                <p className="mt-1 font-[family-name:var(--landing-display)] text-lg font-semibold text-white">{c.v}</p>
                <p className="mt-0.5 text-[11px] text-emerald-400/90">{c.s}</p>
              </motion.div>
            ))}
          </div>
        </TerminalPanel>
      </div>
    </ParallaxStage>
  );
}

function TerminalPanel({
  title,
  children,
  className,
  tilt = 7,
  delay = 0,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  tilt?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, z: -40, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, z: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ ...transitionSlow, delay }}
      className={cn("min-w-0", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      <ParallaxCard tilt={tilt} hoverLift={32} className="h-full p-4 sm:p-5">
        <p className="mb-4 font-[family-name:var(--landing-mono)] text-[9px] uppercase tracking-[0.18em] text-zinc-600">
          {title}
        </p>
        {children}
      </ParallaxCard>
    </motion.div>
  );
}
