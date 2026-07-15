import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { notifyDone, notifySoon } from "@/lib/actions";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  CheckCircle2,
  Chrome,
  CircleDot,
  Clock,
  DollarSign,
  FlaskConical,
  Radio,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/overview")({
  component: MissionControl,
});

// ─────────────────────────────────────────────────────────────
// Mock live data
// ─────────────────────────────────────────────────────────────

const NOW = "Mon · 09:41:22 GMT";

const TICKERS = [
  { k: "PIPELINE", v: "$4.82M", d: "+3.2%", up: true },
  { k: "P(HIT MRR)", v: "0.71", d: "+0.04", up: true },
  { k: "WORKERS", v: "38 / 42", d: "6 idle", up: true },
  { k: "APPROVALS", v: "7", d: "2 hot", up: false },
  { k: "EXPERIMENTS", v: "12", d: "3 sig.", up: true },
  { k: "BURN", v: "$1.14k/h", d: "−8%", up: true },
  { k: "RISK IDX", v: "0.28", d: "−0.03", up: true },
  { k: "LEARN Δ", v: "+142", d: "24h", up: true },
];

const OUTCOMES = [
  { label: "Revenue booked", value: "+$186k", conf: 0.82, hint: "if 4 approvals ship" },
  { label: "Meetings landed", value: "24", conf: 0.9, hint: "17 auto · 7 assisted" },
  { label: "Cycle time saved", value: "−11d", conf: 0.77, hint: "across active projects" },
  { label: "Cost avoided", value: "$9.2k", conf: 0.86, hint: "vs manual execution" },
];

const SCHEDULE = [
  { t: "09:45", who: "You", what: "Approve Northwind redline v3", ev: "$148k", kind: "human" },
  { t: "10:00", who: "Atlas", what: "Draft Halden security response", ev: "$92k", kind: "ai" },
  { t: "10:30", who: "You + Mira", what: "Debrief · Marc design offer", ev: "$218k", kind: "human" },
  { t: "11:15", who: "Scout", what: "EDGAR sweep · Sable filings", ev: "$320k", kind: "browser" },
  { t: "12:00", who: "Nova", what: "Send 42 personalized outreach", ev: "+$14k", kind: "ai" },
  { t: "14:00", who: "You", what: "Review 3 experiment winners", ev: "+11% lift", kind: "human" },
  { t: "15:30", who: "Atlas", what: "Comp modelling · design band 4B", ev: "close +19%", kind: "ai" },
];

const APPROVALS = [
  {
    id: "A-01",
    title: "Ship redline v3 to Northwind Materials",
    worker: "Atlas",
    workerKind: "ai" as const,
    ev: "+$148,000",
    conf: 0.86,
    estMinutes: 4,
    oppCost: "−9d cycle if delayed to tomorrow",
    evidence: [
      "Priya asked legal for §7 changes twice in 48h",
      "Sub-24h redlines close 4.1× faster (Exp-3, conf 0.97)",
      "Legal reviewed v2 · 0 open issues on our side",
    ],
    urgency: "hot" as const,
  },
  {
    id: "A-02",
    title: "Approve comp band 4B for Marc Devlin (design)",
    worker: "Mira",
    workerKind: "human" as const,
    ev: "+$218,000 hire · P(accept) 0.78",
    conf: 0.79,
    estMinutes: 2,
    oppCost: "Band 4A → P(accept) 0.54 · likely re-open req",
    evidence: [
      "Competing offer expected Thursday (signal · Ines)",
      "12 NYC comparables accepted 4B at 78%",
      "Recruiter conviction: 4.6 / 5",
    ],
    urgency: "hot" as const,
  },
  {
    id: "A-03",
    title: "Launch OSS-hook outreach batch (42 candidates)",
    worker: "Nova",
    workerKind: "ai" as const,
    ev: "+7 warm replies (est)",
    conf: 0.71,
    estMinutes: 1,
    oppCost: "Delaying loses 2 candidates to competitors this week",
    evidence: [
      "OSS-hook arm winning +19% in Security segment",
      "All 42 have OSS activity in last 30d",
      "No compliance flags",
    ],
    urgency: "warm" as const,
  },
  {
    id: "A-04",
    title: "Enrich Sable Trust with Q3 acquisition filings",
    worker: "Scout",
    workerKind: "browser" as const,
    ev: "+$320k signal window",
    conf: 0.83,
    estMinutes: 6,
    oppCost: "Filings drop off after 5d · signal decays 40%",
    evidence: [
      "Owen mentioned 2 off-market assets on last call",
      "EDGAR pulls surface intent 5–8d before RFP",
      "Rate limit clear · 0.12 credits budgeted",
    ],
    urgency: "warm" as const,
  },
];

const WORKERS_LIVE = [
  { name: "Atlas", role: "Deal desk AI", kind: "ai" as const, task: "Northwind redline v3", pct: 0.72, eta: "3m" },
  { name: "Nova", role: "SDR AI", kind: "ai" as const, task: "Personalizing 42 emails", pct: 0.34, eta: "11m" },
  { name: "Scout", role: "Research browser", kind: "browser" as const, task: "EDGAR crawl · SBLE", pct: 0.58, eta: "5m" },
  { name: "Echo", role: "Meeting scribe", kind: "ai" as const, task: "Transcribing Halden call", pct: 0.91, eta: "1m" },
  { name: "Vault", role: "Reconciler", kind: "api" as const, task: "Stripe ↔ QBO", pct: 0.22, eta: "18m" },
  { name: "Mira", role: "Account exec", kind: "human" as const, task: "Prepping Cove & Fjord", pct: 0.5, eta: "—" },
];

const BROWSERS = [
  { host: "priya-mbp-16", city: "London", session: "recruiter.linkedin.com", pct: 0.4, cookies: 214 },
  { host: "ops-01", city: "NYC", session: "app.hubspot.com", pct: 0.7, cookies: 88 },
  { host: "scout-cf-01", city: "Frankfurt", session: "sec.gov/edgar", pct: 0.58, cookies: 12 },
  { host: "ines-mbp", city: "Madrid", session: "figma.com", pct: 0.15, cookies: 41 },
];

const DECISIONS = [
  { t: "09:41:04", who: "Atlas", act: "Merged clause §7.2 into redline v3", conf: 0.94 },
  { t: "09:40:11", who: "Nova", act: "Deprioritized 3 leads · ICP-v4 misfit", conf: 0.88 },
  { t: "09:39:22", who: "Scout", act: "Skipped duplicate filing (Q2)", conf: 0.99 },
  { t: "09:37:58", who: "Vault", act: "Auto-reconciled 12 Stripe payouts", conf: 0.97 },
  { t: "09:36:41", who: "Echo", act: "Tagged blocker: 'security review'", conf: 0.83 },
  { t: "09:34:12", who: "Atlas", act: "Delayed outreach · comp not approved", conf: 0.9 },
];

const EXPERIMENTS = [
  { name: "First-touch subject · Ent Ops", arm: "Subject-B", lift: 18, conf: 0.94, status: "winning" },
  { name: "Redline SLA · Negotiation", arm: "SLA-24h", lift: 41, conf: 0.97, status: "shipping" },
  { name: "Outreach hook · Security IC", arm: "OSS-hook", lift: 19, conf: 0.9, status: "winning" },
  { name: "Screen framing · ML", arm: "Frame-Research", lift: 14, conf: 0.86, status: "learning" },
  { name: "Pricing anchor · Health", arm: "Anchor-Mid", lift: 6, conf: 0.62, status: "learning" },
];

const REVENUE_SPARK = [42, 44, 43, 47, 51, 49, 54, 58, 56, 61, 65, 63, 68, 72, 71, 76, 82];

const HEALTH = [
  { k: "Pipeline coverage", v: 3.8, target: 3.0, unit: "×", ok: true },
  { k: "Answer SLA", v: 0.94, target: 0.9, unit: "", ok: true },
  { k: "Worker utilization", v: 0.71, target: 0.65, unit: "", ok: true },
  { k: "Concentration risk", v: 0.42, target: 0.35, unit: "", ok: false },
  { k: "Cash runway", v: 18, target: 12, unit: "mo", ok: true },
];

const KNOWLEDGE = [
  { at: "3m", src: "Meeting · Halden", note: "Security team is the top blocker for Robotics-segment", tag: "pattern" },
  { at: "22m", src: "Redline · Northwind", note: "§7.2 indemnity scope is the sticking point", tag: "objection" },
  { at: "1h", src: "Ashby · Design", note: "Comp band 4B wins 78% of NYC accepts", tag: "benchmark" },
  { at: "2h", src: "EDGAR · Sable", note: "Off-market signal precedes RFP by 5–8d", tag: "signal" },
];

const RISK_PROJECTS = [
  { id: "P-201", name: "Halden onboarding", risk: 0.72, why: "Security review unbooked · SLA in 6h" },
  { id: "P-118", name: "Cove & Fjord pilot", risk: 0.61, why: "3 stakeholders silent · 5d" },
  { id: "P-092", name: "Meridian re-open", risk: 0.54, why: "Prior owner churned · context loss" },
];

const ROI_TASKS = [
  { task: "Ship Northwind redline v3", roi: 42.1, min: 4 },
  { task: "Approve Marc comp band 4B", roi: 38.6, min: 2 },
  { task: "Launch OSS-hook outreach", roi: 14.2, min: 1 },
  { task: "Enrich Sable filings", roi: 9.8, min: 6 },
  { task: "Book Halden security", roi: 8.4, min: 3 },
];

// ─────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────

function MissionControl() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top status bar */}
      <div className="border-b border-border/60 bg-surface/60 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-2 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-ai)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-ai)]" />
            </span>
            <span className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              ALYSON · LIVE
            </span>
          </div>
          <span className="text-mono text-[10px] text-muted-foreground">{NOW}</span>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-1 text-mono text-[10px] text-muted-foreground">
            <Radio className="h-3 w-3" /> 42 workers · 128 tasks · 12 experiments
          </div>
        </div>
        {/* Ticker strip */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-1.5 border-t border-border/40 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-6 min-w-max">
            {TICKERS.map((t) => (
              <div key={t.k} className="flex items-baseline gap-2">
                <span className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.k}
                </span>
                <span className="text-mono text-sm tabular-nums">{t.v}</span>
                <span
                  className={cn(
                    "text-mono text-[10px] tabular-nums",
                    t.up ? "text-success" : "text-destructive",
                  )}
                >
                  {t.d}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Briefing headline */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MISSION CONTROL · MON 06.07.26
            </div>
            <h1 className="text-display text-3xl md:text-[36px] leading-tight mt-1">
              Alyson is running the company.{" "}
              <span className="text-muted-foreground">You supervise.</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              7 approvals waiting · 6 workers executing · 12 experiments live. If you
              approve the top 4 today, expected weighted value is{" "}
              <span className="text-foreground">+$186k</span> at confidence 0.82.
            </p>
          </div>
          <button
            type="button"
            onClick={() => notifyDone("Approved top 4", "+$186k expected · confidence 0.82")}
            className="flex items-center gap-2 text-mono text-[11px] px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-3.5 w-3.5" /> APPROVE TOP 4
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Row 1: Outcomes · Revenue forecast · Health */}
        <div className="mt-6 grid grid-cols-12 gap-3">
          <Panel className="col-span-12 lg:col-span-5" label="Today · Predicted outcomes" hint="if recommended actions ship">
            <div className="grid grid-cols-2 divide-x divide-y divide-border/60 border-t border-border/60">
              {OUTCOMES.map((o) => (
                <div key={o.label} className="p-4">
                  <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {o.label}
                  </div>
                  <div className="text-display text-2xl mt-1 tabular-nums">
                    {o.value}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <ConfBar value={o.conf} />
                    <span className="text-mono text-[10px] text-muted-foreground tabular-nums">
                      {o.conf.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">{o.hint}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="col-span-12 md:col-span-6 lg:col-span-4" label="Revenue forecast" hint="30-day projection · Alyson model v4.2">
            <div className="p-4">
              <div className="flex items-baseline gap-2">
                <div className="text-display text-3xl tabular-nums">$4.82M</div>
                <div className="text-mono text-xs text-success tabular-nums">
                  +$412k vs plan
                </div>
              </div>
              <Sparkline points={REVENUE_SPARK} className="mt-3 h-16" />
              <div className="grid grid-cols-3 gap-2 mt-3 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <div>
                  <div>P10</div>
                  <div className="text-foreground tabular-nums normal-case text-sm mt-0.5">
                    $3.4M
                  </div>
                </div>
                <div>
                  <div>P50</div>
                  <div className="text-foreground tabular-nums normal-case text-sm mt-0.5">
                    $4.82M
                  </div>
                </div>
                <div>
                  <div>P90</div>
                  <div className="text-foreground tabular-nums normal-case text-sm mt-0.5">
                    $6.1M
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="col-span-12 md:col-span-6 lg:col-span-3" label="Organization health">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {HEALTH.map((h) => (
                <li key={h.k} className="px-4 py-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      h.ok ? "bg-success" : "bg-warning",
                    )}
                  />
                  <span className="text-xs text-muted-foreground flex-1 truncate">
                    {h.k}
                  </span>
                  <span className="text-mono text-xs tabular-nums">
                    {h.v}
                    {h.unit}
                  </span>
                  <span className="text-mono text-[10px] text-muted-foreground tabular-nums">
                    ≥ {h.target}
                    {h.unit}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Row 2: Recommended schedule · Predicted ROI · Experiments */}
        <div className="mt-3 grid grid-cols-12 gap-3">
          <Panel className="col-span-12 lg:col-span-5" label="Recommended schedule" hint="Alyson's plan for your day">
            <ol className="border-t border-border/60">
              {SCHEDULE.map((s, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[56px_20px_1fr_auto] gap-3 px-4 py-2 border-b border-border/40 last:border-b-0 items-center hover:bg-accent/30"
                >
                  <span className="text-mono text-xs text-muted-foreground tabular-nums">
                    {s.t}
                  </span>
                  <KindGlyph kind={s.kind as never} className="text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-sm truncate">{s.what}</div>
                    <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.who}
                    </div>
                  </div>
                  <span className="text-mono text-xs text-[var(--color-ai)] tabular-nums">
                    {s.ev}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel className="col-span-12 md:col-span-6 lg:col-span-4" label="Predicted ROI by task" hint="expected value / minute">
            <ul className="border-t border-border/60">
              {ROI_TASKS.map((r) => {
                const max = Math.max(...ROI_TASKS.map((x) => x.roi));
                return (
                  <li key={r.task} className="px-4 py-2.5 border-b border-border/40 last:border-b-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm truncate flex-1">{r.task}</span>
                      <span className="text-mono text-xs tabular-nums">
                        {r.roi.toFixed(1)}×
                      </span>
                      <span className="text-mono text-[10px] text-muted-foreground tabular-nums">
                        {r.min}m
                      </span>
                    </div>
                    <div className="mt-1.5 h-0.5 bg-border/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-ai)]"
                        style={{ width: `${(r.roi / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className="col-span-12 md:col-span-6 lg:col-span-3" label="Experiments running" hint="live · optimizing conversion">
            <ul className="border-t border-border/60">
              {EXPERIMENTS.map((x) => (
                <li key={x.name} className="px-4 py-2 border-b border-border/40 last:border-b-0">
                  <div className="flex items-baseline gap-2">
                    <FlaskConical className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs truncate flex-1">{x.name}</span>
                    <span
                      className={cn(
                        "text-mono text-xs tabular-nums",
                        x.status === "shipping"
                          ? "text-success"
                          : x.status === "winning"
                            ? "text-[var(--color-ai)]"
                            : "text-muted-foreground",
                      )}
                    >
                      +{x.lift}%
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-mono text-[10px] text-muted-foreground">
                    <span>arm · {x.arm}</span>
                    <span>· conf {x.conf.toFixed(2)}</span>
                    <span className="ml-auto uppercase tracking-wider">{x.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Row 3: Human approvals (wide) */}
        <div className="mt-3 grid grid-cols-12 gap-3">
          <Panel
            className="col-span-12"
            label="Human approvals needed"
            hint="every recommendation includes expected value, confidence, evidence, time, opportunity cost, and worker"
            accent
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-border/60">
              {APPROVALS.map((a, i) => (
                <ApprovalRow key={a.id} a={a} borderRight={i % 2 === 0} />
              ))}
            </div>
          </Panel>
        </div>

        {/* Row 4: Workers executing · Browser workers · AI decisions */}
        <div className="mt-3 grid grid-cols-12 gap-3">
          <Panel className="col-span-12 lg:col-span-4" label="Workers executing" hint="live · this moment">
            <ul className="border-t border-border/60">
              {WORKERS_LIVE.map((w) => (
                <li key={w.name} className="px-4 py-2.5 border-b border-border/40 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <KindGlyph kind={w.kind} className="text-muted-foreground" />
                    <span className="text-sm">{w.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      · {w.role}
                    </span>
                    <span className="ml-auto text-mono text-[10px] text-muted-foreground tabular-nums">
                      ETA {w.eta}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {w.task}
                  </div>
                  <div className="mt-1.5 h-0.5 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-ai)]"
                      style={{ width: `${w.pct * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="col-span-12 md:col-span-6 lg:col-span-4" label="Live browser workers" hint="fleet · desktop">
            <ul className="border-t border-border/60">
              {BROWSERS.map((b) => (
                <li
                  key={b.host}
                  className="px-4 py-2.5 border-b border-border/40 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Chrome className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-mono text-xs">{b.host}</span>
                    <span className="text-mono text-[10px] text-muted-foreground">
                      · {b.city}
                    </span>
                    <span className="ml-auto text-mono text-[10px] text-muted-foreground tabular-nums">
                      {b.cookies} cookies
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {b.session}
                  </div>
                  <div className="mt-1.5 h-0.5 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-ai)]"
                      style={{ width: `${b.pct * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            className="col-span-12 md:col-span-6 lg:col-span-4"
            label="AI decisions · autonomous"
            hint="last 5 minutes · no human touched these"
          >
            <ul className="border-t border-border/60 max-h-[280px] overflow-y-auto scrollbar-thin">
              {DECISIONS.map((d, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[56px_1fr_auto] gap-2 px-4 py-2 border-b border-border/40 last:border-b-0 items-start"
                >
                  <span className="text-mono text-[10px] text-muted-foreground tabular-nums pt-0.5">
                    {d.t}
                  </span>
                  <div className="min-w-0">
                    <div className="text-mono text-[10px] uppercase tracking-wider text-[var(--color-ai)]">
                      {d.who}
                    </div>
                    <div className="text-xs mt-0.5">{d.act}</div>
                  </div>
                  <span className="text-mono text-[10px] text-muted-foreground tabular-nums pt-0.5">
                    {d.conf.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Row 5: High-risk · Knowledge / Learning */}
        <div className="mt-3 grid grid-cols-12 gap-3">
          <Panel className="col-span-12 lg:col-span-5" label="High-risk projects" hint="risk index > 0.5">
            <ul className="border-t border-border/60">
              {RISK_PROJECTS.map((r) => (
                <li key={r.id} className="px-4 py-3 border-b border-border/40 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <span className="text-sm">{r.name}</span>
                    <span className="text-mono text-[10px] text-muted-foreground">
                      · {r.id}
                    </span>
                    <span className="ml-auto text-mono text-xs text-warning tabular-nums">
                      {r.risk.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{r.why}</div>
                  <div className="mt-2 h-0.5 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning"
                      style={{ width: `${r.risk * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="col-span-12 lg:col-span-7" label="Recent learning · knowledge updates" hint="Alyson learned in the last hour">
            <ul className="border-t border-border/60">
              {KNOWLEDGE.map((k, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[48px_1fr_auto] gap-3 px-4 py-2.5 border-b border-border/40 last:border-b-0 items-start"
                >
                  <span className="text-mono text-[10px] text-muted-foreground pt-1 tabular-nums">
                    {k.at}
                  </span>
                  <div className="min-w-0">
                    <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {k.src}
                    </div>
                    <div className="text-sm mt-0.5">{k.note}</div>
                  </div>
                  <span className="text-mono text-[10px] uppercase tracking-wider text-[var(--color-ai)]">
                    {k.tag}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Footer status */}
        <div className="mt-6 flex items-center gap-4 flex-wrap text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CircleDot className="h-3 w-3 text-success" /> Autonomy · Level 3
          </span>
          <span>· Guardrails 12 active</span>
          <span>· Audit log streaming</span>
          <Link
            to="/predictions"
            className="ml-auto flex items-center gap-1 text-foreground hover:text-[var(--color-ai)] transition-colors normal-case tracking-normal"
          >
            Open prediction center <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

function Panel({
  label,
  hint,
  children,
  className,
  accent,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card overflow-hidden",
        accent && "ring-1 ring-[var(--color-ai)]/25",
        className,
      )}
    >
      <header className="px-4 py-2 flex items-center gap-2">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            accent ? "bg-[var(--color-ai)]" : "bg-muted-foreground/40",
          )}
        />
        <span className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        {hint && (
          <span className="text-mono text-[10px] text-muted-foreground/70 truncate">
            · {hint}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function KindGlyph({
  kind,
  className,
}: {
  kind: "human" | "ai" | "browser" | "api";
  className?: string;
}) {
  const Icon =
    kind === "ai" ? Bot : kind === "browser" ? Chrome : kind === "api" ? Zap : User;
  return <Icon className={cn("h-3.5 w-3.5", className)} />;
}

function ConfBar({ value }: { value: number }) {
  return (
    <div className="flex-1 h-1 bg-border/60 rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--color-ai)]"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ai)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-ai)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke="var(--color-ai)" strokeWidth="1.2" />
    </svg>
  );
}

function ApprovalRow({
  a,
  borderRight,
}: {
  a: (typeof APPROVALS)[number];
  borderRight: boolean;
}) {
  return (
    <div
      className={cn(
        "p-4 border-b border-border/40",
        borderRight && "lg:border-r lg:border-border/40",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
            a.urgency === "hot" ? "bg-destructive" : "bg-warning",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {a.id}
            </span>
            <span className="text-sm">{a.title}</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric
              icon={<DollarSign className="h-3 w-3" />}
              label="Expected value"
              value={a.ev}
              tone="ai"
            />
            <Metric
              icon={<Brain className="h-3 w-3" />}
              label="Confidence"
              value={a.conf.toFixed(2)}
              bar={a.conf}
            />
            <Metric
              icon={<Clock className="h-3 w-3" />}
              label="Est. time"
              value={`${a.estMinutes}m`}
            />
            <Metric
              icon={<KindGlyph kind={a.workerKind} />}
              label="Required worker"
              value={a.worker}
            />
            <Metric
              icon={<TrendingUp className="h-3 w-3" />}
              label="Opportunity cost"
              value={a.oppCost}
              wide
            />
          </div>

          <div className="mt-3">
            <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
              Supporting evidence
            </div>
            <ul className="space-y-0.5">
              {a.evidence.map((e) => (
                <li
                  key={e}
                  className="text-xs text-muted-foreground pl-3 relative before:absolute before:left-0 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground/60"
                >
                  {e}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => notifyDone("Approved")}
              className="text-mono text-[11px] px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3 w-3" /> Approve
            </button>
            <button
              type="button"
              onClick={() => notifySoon("Modify")}
              className="text-mono text-[11px] px-3 py-1.5 rounded-md border border-border hover:bg-accent"
            >
              Modify
            </button>
            <button
              type="button"
              onClick={() => notifyDone("Snoozed", "We'll surface this again tomorrow")}
              className="text-mono text-[11px] px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground"
            >
              Snooze
            </button>
            <span className="ml-auto text-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> reversible
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  wide,
  tone,
  bar,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
  tone?: "ai";
  bar?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-surface/40 p-2",
        wide && "col-span-2",
      )}
    >
      <div className="flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "text-sm mt-0.5 truncate",
          tone === "ai" && "text-[var(--color-ai)] tabular-nums",
        )}
      >
        {value}
      </div>
      {typeof bar === "number" && (
        <div className="mt-1 h-0.5 bg-border/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-ai)]"
            style={{ width: `${bar * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
