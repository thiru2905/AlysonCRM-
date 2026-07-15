"use client";

import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  Briefcase,
  Chrome,
  Contact,
  FlaskConical,
  FolderKanban,
  HeartHandshake,
  Home,
  Landmark,
  Layers,
  Link2,
  Megaphone,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wand2,
} from "lucide-react";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { HoverEffect, type HoverItem } from "@/components/aceternity/hover-effect";
import { InfiniteMarquee, type TweetCard } from "@/components/aceternity/infinite-marquee";
import { LabBackground } from "@/components/aceternity/lab-background";
import { MovingBorder } from "@/components/aceternity/moving-border";
import { Spotlight } from "@/components/aceternity/spotlight";
import { HeroCanvasHeadline } from "@/components/aceternity/canvas-text";
import { SpotlightFeatureCard } from "@/components/aceternity/card-spotlight";
import { FaqAccordion } from "@/components/aceternity/faq-accordion";
import { Timeline } from "@/components/aceternity/timeline";
import { AgenticCylinder, LiveBeep } from "@/components/landing/AgenticCylinder";
import { HeroSideBubbles } from "@/components/landing/HeroSideBubbles";
import { TerminalDashboard } from "@/components/landing/TerminalDashboard";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PRIMITIVE_MODULES: HoverItem[] = [
  {
    title: "Hermes Engine",
    description: "LinkedIn missions: search, extract profiles, approve, then send from Chrome.",
    to: "/hermes",
    icon: <Rocket className="h-5 w-5" />,
    badge: "Flagship",
  },
  {
    title: "Browser Workers",
    description: "Live Chrome sessions, tool calls, and mission activity on your desktop.",
    to: "/browser-workers",
    icon: <Chrome className="h-5 w-5" />,
  },
  {
    title: "Profiles",
    description: "Saved LinkedIn people with invite status and outreach history.",
    to: "/profiles",
    icon: <Contact className="h-5 w-5" />,
  },
  {
    title: "LinkedIn Outreach",
    description: "Campaigns, prospects, sequences, and conversation tracking.",
    to: "/outreach",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Automation",
    description: "Natural-language tasks, plans, approvals, and run monitoring.",
    to: "/automation",
    icon: <Bot className="h-5 w-5" />,
  },
  {
    title: "Overview",
    description: "Mission Control — approvals, workers, and live signals.",
    to: "/overview",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Data Sources",
    description: "People, companies, and objects your workspace reasons about.",
    to: "/entities",
    icon: <Boxes className="h-5 w-5" />,
  },
  {
    title: "Work",
    description: "Projects, phases, and tasks for humans and AI workers.",
    to: "/work",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    title: "Workers",
    description: "AI agents — workload, needs, and cost.",
    to: "/workers",
    icon: <Bot className="h-5 w-5" />,
  },
  {
    title: "Experiments",
    description: "Compare prompts, models, and workflows side by side.",
    to: "/experiments",
    icon: <FlaskConical className="h-5 w-5" />,
  },
  {
    title: "Knowledge",
    description: "Sources of truth the workspace reads and writes.",
    to: "/knowledge",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Relationships",
    description: "Graph of people, companies, and actions.",
    to: "/relationships",
    icon: <Network className="h-5 w-5" />,
  },
  {
    title: "Predictions",
    description: "Forecasts with confidence and provenance.",
    to: "/predictions",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const FLAVOR_MODULES: HoverItem[] = [
  {
    title: "Flavors",
    description: "CRM-shaped apps on one core — tuned per team.",
    to: "/flavors",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "CRM",
    description: "Leads, customers, and opportunities.",
    to: "/crm",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    title: "Recruiting",
    description: "Roles, candidates, LinkedIn search, and pipelines.",
    to: "/recruiting",
    icon: <UsersRound className="h-5 w-5" />,
  },
  {
    title: "Customer Success",
    description: "Retention, expansion, and QBRs.",
    to: "/success",
    icon: <HeartHandshake className="h-5 w-5" />,
  },
  {
    title: "Marketing",
    description: "Campaigns, audiences, and experiments.",
    to: "/marketing",
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    title: "Affiliate Outreach",
    description: "Partners, payouts, and outbound.",
    to: "/affiliate",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Real Estate",
    description: "Listings, showings, and offers.",
    to: "/real-estate",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Mortgage",
    description: "Applications, underwriting, and closings.",
    to: "/mortgage",
    icon: <Landmark className="h-5 w-5" />,
  },
  {
    title: "Insurance",
    description: "Quotes, policies, and claims.",
    to: "/insurance",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "New flavor",
    description: "Describe your team — Alyson scaffolds a flavor.",
    to: "/flavors/new",
    icon: <Wand2 className="h-5 w-5" />,
    badge: "Build",
  },
];

const FLOW = [
  {
    step: "01",
    title: "Mission",
    body: "Set the audience in Hermes. The planner maps LinkedIn steps for that run.",
  },
  {
    step: "02",
    title: "Extract",
    body: "Browser Workers open Chrome, run search, and save people to Profiles.",
  },
  {
    step: "03",
    title: "Approve",
    body: "You review each connection before anything is sent.",
  },
  {
    step: "04",
    title: "Send",
    body: "On approve, Hermes opens the profile and sends — paced like a person.",
  },
];

const TWEETS_A: TweetCard[] = [
  {
    name: "Maya R.",
    handle: "@mayarecruits",
    body: "Approved one invite at a time. Profiles actually showed up in Saved Profiles after extract.",
    meta: "2h",
  },
  {
    name: "Jordan Lee",
    handle: "@jlee_gtm",
    body: "Desktop Agent + Hermes is the first setup where Chrome looks normal — no test-software banner.",
    meta: "5h",
  },
  {
    name: "Priya N.",
    handle: "@priyan_ops",
    body: "Browser Workers activity finally matches what I see on screen. Huge for trust.",
    meta: "1d",
  },
  {
    name: "Chris V.",
    handle: "@cv_talent",
    body: "We keep sends at 1–2/day. Hermes makes the approval step obvious instead of buried.",
    meta: "1d",
  },
];

const TWEETS_B: TweetCard[] = [
  {
    name: "Elena K.",
    handle: "@elenak_ae",
    body: "Recruiting flavor + Hermes search URL paste = faster shortlists without leaving Alyson.",
    meta: "3h",
  },
  {
    name: "Sam Ortiz",
    handle: "@sortiz",
    body: "Pairing the Desktop Agent took a minute. After that Hermes just… ran.",
    meta: "8h",
  },
  {
    name: "Nina Park",
    handle: "@ninapark",
    body: "Connection dialog handled ‘Send without a note’ correctly on our last mission.",
    meta: "12h",
  },
  {
    name: "Theo M.",
    handle: "@theom_b2b",
    body: "Blue UI in the app matches the site now. Feels like one product.",
    meta: "2d",
  },
];

const NAV_LINKS = [
  { label: "Terminal", href: "#terminal" },
  { label: "Playbook", href: "#playbook" },
  { label: "Journey", href: "#journey" },
  { label: "Control room", href: "#lab" },
  { label: "Hermes", href: "#hermes" },
  { label: "Modules", href: "#modules" },
  { label: "Flavors", href: "#flavors" },
  { label: "FAQ", href: "#faq" },
];

/** Compact set for the floating cylindrical pill on scroll */
const PILL_NAV_LINKS = [
  { label: "Terminal", href: "#terminal" },
  { label: "Journey", href: "#journey" },
  { label: "Hermes", href: "#hermes" },
  { label: "FAQ", href: "#faq" },
];

function TimelineCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#080808] p-4 text-sm leading-relaxed text-zinc-400 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

const JOURNEY_TIMELINE = [
  {
    title: "Boot",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
          Spin up the local stack — CRM, Desktop Agent, Browser Workers. One machine.
          No cloud runner required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TimelineCard>
            <p className="font-[family-name:var(--landing-mono)] text-[10px] uppercase tracking-[0.18em] text-blue-400/80">
              Ports
            </p>
            <p className="mt-2 text-zinc-300">3000 · 8787 · 8820</p>
            <p className="mt-1 text-xs text-zinc-600">CRM · Agent · Browser MCP</p>
          </TimelineCard>
          <TimelineCard>
            <p className="font-[family-name:var(--landing-mono)] text-[10px] uppercase tracking-[0.18em] text-emerald-400/80">
              Status
            </p>
            <p className="mt-2 text-zinc-300">Pair device → Mission Control</p>
            <p className="mt-1 text-xs text-zinc-600">LinkedIn session stays local</p>
          </TimelineCard>
        </div>
      </div>
    ),
  },
  {
    title: "Search",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
          Hermes plans the mission. Chrome opens a normal window, runs LinkedIn search, and
          extracts profiles into Saved Profiles for review.
        </p>
        <TimelineCard className="font-[family-name:var(--landing-mono)] text-[12px] text-zinc-500">
          <p className="text-zinc-600">// hermes mission</p>
          <p className="mt-2 text-emerald-400/90">search_people → extract_profiles</p>
          <p className="text-sky-300/90">sync → /profiles · status: captured</p>
        </TimelineCard>
      </div>
    ),
  },
  {
    title: "Approve",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
          Nothing sends until you say so. Review invites, caps, and tone — then approve each step
          in Mission Control.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Invite draft", "Daily cap", "Human pace"].map((label) => (
            <TimelineCard key={label} className="text-center">
              <p className="text-zinc-200">{label}</p>
            </TimelineCard>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Send",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
          Chrome delivers connections like a person — paced, logged, synced. Supervised AI that
          stays on your desk.
        </p>
        <TimelineCard>
          <p className="text-zinc-300">invite_pending → accepted → conversation</p>
          <p className="mt-2 text-xs text-zinc-600">
            Track outreach in Profiles, Work, and Hermes runtime.
          </p>
        </TimelineCard>
      </div>
    ),
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I deploy an AI agent with Alyson?",
    answer:
      "Run the local stack — CRM on 3000, Desktop Agent on 8787, Browser Workers on 8820 — then open Mission Control and pair your device. Agents stay on your machine; nothing is shipped to a cloud runner by default.",
  },
  {
    question: "What does Hermes actually send on LinkedIn?",
    answer:
      "Hermes searches, extracts profiles into Saved Profiles, and drafts connection invites. Chrome only sends after you approve each step. Caps stay low so outreach still looks human.",
  },
  {
    question: "Do I need a cloud subscription for Browser Workers?",
    answer:
      "No. Browser Workers talk to a local Chrome profile. Your LinkedIn session stays in ~/.browser-agent/chrome-profile, and Mission Control only orchestrates the machine in front of you.",
  },
  {
    question: "Can I customize agents for recruiting or insurance?",
    answer:
      "Yes. Flavors and modules (Recruiting, CRM, Outreach, Insurance) share the same supervised runtime — swap the playbook without changing how approvals and browser automation work.",
  },
  {
    question: "Is my LinkedIn account at risk?",
    answer:
      "Risk drops when humans stay in the loop. Alyson paces sends, waits for your approval, and never auto-blasts. Treat daily caps as a hard ceiling, not a target.",
  },
];

const FOOTER = {
  product: [
    { label: "Mission Control", to: "/overview" as const },
    { label: "Hermes Engine", to: "/hermes" as const },
    { label: "Browser Workers", to: "/browser-workers" as const },
    { label: "Profiles", to: "/profiles" as const },
    { label: "Automation", to: "/automation" as const },
  ],
  company: [
    { label: "Recruiting", to: "/recruiting" as const },
    { label: "CRM", to: "/crm" as const },
    { label: "Flavors", to: "/flavors" as const },
    { label: "Outreach", to: "/outreach" as const },
  ],
  legal: [
    { label: "Terms & Conditions", to: "/terms" as const },
    { label: "Privacy Policy", to: "/privacy" as const },
  ],
};

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 26, mass: 0.4 });
  const heroFade = useTransform(smooth, [0, 0.85], [1, 0.6]);

  return (
    <div
      className={cn(
        "landing-root min-h-screen overflow-x-hidden antialiased",
        "bg-[var(--landing-bg)] text-[var(--landing-fg)]",
        "font-[family-name:var(--landing-sans)]",
      )}
    >
      <LandingNav />

      <motion.section
        ref={heroRef}
        style={{ opacity: heroFade }}
        className="relative flex min-h-[100svh] flex-col overflow-hidden"
      >
        <LabBackground glow={0.35} />
        <HeroSideBubbles />
        {/* Torch beam — top-left, falling onto the CTA ball */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
        >
          <div
            className="absolute left-[-5%] top-[-10%] h-[130%] w-[70%] origin-top-left rotate-[18deg] opacity-90"
            style={{
              background:
                "linear-gradient(180deg, rgba(191,219,254,0.55) 0%, rgba(96,165,250,0.32) 18%, rgba(59,130,246,0.18) 42%, rgba(59,130,246,0.06) 68%, transparent 88%)",
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 22%, black 48%, transparent 78%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, black 22%, black 48%, transparent 78%)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="absolute left-[8%] top-[8%] h-[95%] w-[28%] origin-top rotate-[16deg] opacity-80"
            style={{
              background:
                "linear-gradient(180deg, rgba(224,242,254,0.7) 0%, rgba(147,197,253,0.45) 22%, rgba(59,130,246,0.22) 55%, transparent 90%)",
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 35%, black 55%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, black 35%, black 55%, transparent 100%)",
              filter: "blur(8px)",
            }}
          />
          {/* Hot core of the torch */}
          <div
            className="absolute left-[18%] top-[12%] h-[70%] w-[12%] origin-top rotate-[15deg] opacity-70"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(186,230,253,0.35) 30%, rgba(59,130,246,0.12) 70%, transparent 100%)",
              filter: "blur(14px)",
            }}
          />
        </div>
        <Spotlight
          className="-top-10 left-[-10%] opacity-100 md:left-[-5%]"
          fill="#93C5FD"
        />
        <BackgroundBeams className="opacity-25" />

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 pb-2 pt-24 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: easeOut }}
          >
            <MovingBorder
              duration={4.5}
              containerClassName="shadow-[0_0_20px_-6px_rgba(59,130,246,0.55)]"
              className="bg-zinc-950/90 px-2.5 py-1 backdrop-blur-sm"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="scale-[0.72]">
                  <LiveBeep />
                </span>
                <span className="font-[family-name:var(--landing-mono)] text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Hermes
                </span>
                <span className="h-0.5 w-0.5 rounded-full bg-blue-400/80 shadow-[0_0_6px_1px_rgba(96,165,250,0.7)]" />
                <span className="font-[family-name:var(--landing-mono)] text-[9px] font-medium tracking-[0.04em] text-zinc-300">
                  powering Alyson CRM+
                </span>
              </span>
            </MovingBorder>
          </motion.div>

          <div className="mt-5 w-full sm:mt-6">
            <HeroCanvasHeadline
              lead={
                <>
                  LinkedIn outreach,
                  <br />
                  under your
                </>
              }
              highlight="control."
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: easeOut }}
            className="mx-auto mt-4 max-w-md text-[13px] leading-[1.65] text-[var(--landing-muted)] sm:mt-5 sm:text-sm"
          >
            Search people, save profiles, approve each invite, and send from real Chrome — Hermes,
            Browser Workers, and your CRM+ workspace.
          </motion.p>

          <div className="mt-auto flex w-full shrink-0 justify-center pt-6 sm:pt-8">
            <AgenticCylinder scrollProgress={smooth} />
          </div>
        </div>
      </motion.section>

      {/* Bloomberg-style Mission Control */}
      <section id="terminal" className="relative scroll-mt-24 border-t border-white/[0.06] px-4 py-24 sm:px-6">
        <LabBackground glow={0.3} />
        <div className="relative z-10 mx-auto max-w-6xl [perspective:1800px]">
          <SectionHeader
            eyebrow="Terminal"
            title="Bloomberg density. Supervised AI."
            body="A live Mission Control surface — tickers, forecasts, approvals, schedule, and Hermes runtime. Same language as the product."
          />
          <div className="mt-12">
            <TerminalDashboard />
          </div>
        </div>
      </section>

      {/* Card Spotlight playbook */}
      <section id="playbook" className="relative scroll-mt-24 border-t border-white/[0.06] px-6 py-24">
        <LabBackground glow={0.3} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Playbook"
            title="Hover the cards — the lab lights up"
            body="Aceternity Card Spotlight on every surface. Cursor glow, blue glitter grid, checklists for how Alyson runs."
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mt-12 grid items-stretch gap-4 lg:grid-cols-2"
          >
            <SpotlightFeatureCard
              title="Hermes mission steps"
              description="Follow these steps for a safe LinkedIn outreach run:"
              steps={[
                "Start Desktop Agent + Browser Workers",
                "Pair the device from Mission Control",
                "Create a Hermes mission and extract profiles",
                "Approve each invite before Chrome sends",
              ]}
              footer="Keeping approvals in the loop protects your LinkedIn account and keeps send volume intentional."
            />
            <SpotlightFeatureCard
              title="Runtime checklist"
              description="Confirm the local stack before you supervise:"
              steps={[
                "CRM online on port 3000",
                "Desktop Agent healthy on 8787",
                "Browser MCP attached on 8820",
                "LinkedIn session signed in (Alyson Chrome)",
              ]}
              footer="Three local processes, one supervised loop — nothing leaves your machine without your say."
            />
          </motion.div>
        </div>
      </section>

      <section id="journey" className="relative scroll-mt-24 border-t border-white/[0.06] px-4 py-16 sm:px-6 md:py-24">
        <LabBackground glow={0.3} />
        <div className="relative z-10 mx-auto max-w-7xl">
          <Timeline
            title="From boot to send"
            description="Scroll the beam — watch Alyson’s supervised loop unfold from stack up to invite delivered."
            data={JOURNEY_TIMELINE}
          />
        </div>
      </section>

      <section id="lab" className="relative scroll-mt-24 border-t border-white/[0.06] px-6 py-24">
        <LabBackground className="opacity-90" glow={0.3} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Control room"
            title="Bento of the agentic stack"
            body="Mission flow and runtime surfaces — pitch-black lab panels, one instrument rack."
          />
          <div className="mt-12">
            <BentoGrid>
              <BentoGridItem
                index={0}
                className="md:col-span-2 md:row-span-2"
                to="/hermes"
                badge="Live"
                title="Hermes Engine"
                description="Plan LinkedIn missions, extract profiles, approve invites, and send from a normal Chrome window."
                icon={<Rocket className="h-4 w-4" />}
                header={
                  <div className="relative flex h-full min-h-[7rem] items-end overflow-hidden rounded-xl border border-white/5 bg-black p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.25),transparent_55%)]" />
                    <div className="relative space-y-2">
                      <div className="flex items-center gap-2">
                        <LiveBeep />
                        <span className="font-[family-name:var(--landing-mono)] text-[10px] tracking-widest text-emerald-300/80">
                          RUNTIME / HERMES
                        </span>
                      </div>
                      <p className="font-[family-name:var(--landing-mono)] text-[11px] text-zinc-500">
                        search → extract → approve → send
                      </p>
                    </div>
                  </div>
                }
              />
              {FLOW.map((item, i) => (
                <BentoGridItem
                  key={item.step}
                  index={i + 1}
                  title={`${item.step} · ${item.title}`}
                  description={item.body}
                  icon={
                    <span className="font-[family-name:var(--landing-mono)] text-[10px] text-blue-300">
                      {item.step}
                    </span>
                  }
                />
              ))}
              <BentoGridItem
                index={5}
                to="/browser-workers"
                title="Browser Workers"
                description="Chrome fleet on :8820 — sessions, tools, human pacing."
                icon={<Chrome className="h-4 w-4" />}
                badge="8820"
              />
              <BentoGridItem
                index={6}
                to="/profiles"
                title="Saved Profiles"
                description="Prospects with invite status and send history."
                icon={<Contact className="h-4 w-4" />}
              />
              <BentoGridItem
                index={7}
                to="/automation"
                title="Automation"
                description="Natural-language tasks, plans, and approvals."
                icon={<Bot className="h-4 w-4" />}
              />
            </BentoGrid>
          </div>
        </div>
      </section>

      <section id="hermes" className="relative scroll-mt-24 border-t border-white/[0.06] px-6 py-24">
        <div className="absolute inset-0 bg-black" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Hermes"
            title="Outreach that stays in your browser"
            body="Search real people, save them to Profiles, approve each invite, send from Chrome."
          />
          <div className="mt-12">
            <BentoGrid className="md:auto-rows-[10.5rem]">
              {[
                {
                  t: "Desktop Agent",
                  d: "Pairs with CRM locally. Orchestrates automations on port 8787.",
                  to: "/overview",
                  icon: <Bot className="h-4 w-4" />,
                  span: "md:col-span-1",
                },
                {
                  t: "Browser Workers",
                  d: "Tool timeline, screenshots, human-paced delays — watch the mission live.",
                  to: "/browser-workers",
                  icon: <Chrome className="h-4 w-4" />,
                  span: "md:col-span-2",
                },
                {
                  t: "Saved Profiles",
                  d: "Every extracted prospect lands here with invite and send status.",
                  to: "/profiles",
                  icon: <Contact className="h-4 w-4" />,
                  span: "md:col-span-2",
                },
                {
                  t: "Open Hermes",
                  d: "Jump straight into the control surface and start a mission.",
                  to: "/hermes",
                  icon: <Rocket className="h-4 w-4" />,
                  span: "md:col-span-1",
                  badge: "Go",
                },
              ].map((b, i) => (
                <BentoGridItem
                  key={b.t}
                  index={i}
                  className={b.span}
                  to={b.to}
                  title={b.t}
                  description={b.d}
                  icon={b.icon}
                  badge={"badge" in b ? b.badge : undefined}
                />
              ))}
            </BentoGrid>
          </div>
        </div>
      </section>

      <section id="modules" className="relative scroll-mt-24 border-t border-white/[0.06] px-6 py-24">
        <LabBackground glow={0.3} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Workspace"
            title="Module rack"
            body="Same routes as the in-app sidebar — pick a panel and open it live."
          />
          <div className="mt-12">
            <BentoGrid className="md:auto-rows-[9.5rem] lg:grid-cols-4">
              {PRIMITIVE_MODULES.map((m, i) => (
                <BentoGridItem
                  key={m.to + m.title}
                  index={i}
                  className={i === 0 || i === 1 ? "md:col-span-2" : undefined}
                  to={m.to}
                  title={m.title}
                  description={m.description}
                  icon={m.icon}
                  badge={m.badge}
                />
              ))}
            </BentoGrid>
          </div>
        </div>
      </section>

      <section id="flavors" className="relative scroll-mt-24 border-t border-white/[0.06] px-6 py-24">
        <div className="absolute inset-0 bg-black" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Flavors"
            title="One core. Many teams."
            body="CRM, Recruiting, Success, Marketing, Real Estate, Mortgage, Insurance, and more."
          />
          <div className="mt-12">
            <HoverEffect items={FLAVOR_MODULES} />
          </div>
        </div>
      </section>

      <section id="runtime" className="relative scroll-mt-24 border-t border-white/[0.06] bg-black px-6 py-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Runtime stack"
            title="Three local processes. One supervised loop."
            body="CRM, Desktop Agent, and Browser Workers stay on your machine — quiet black surfaces, human approvals in the loop."
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {[
              {
                port: ":3000",
                title: "Alyson CRM+",
                body: "Mission Control, Hermes planner, Profiles, Flavors. The surface you supervise from.",
                to: "/overview",
              },
              {
                port: ":8787",
                title: "Desktop Agent",
                body: "Pairs with a code, owns automations, talks to the browser agent for Chrome actions.",
                to: "/browser-workers",
              },
              {
                port: ":8820",
                title: "Browser Workers",
                body: "Real Chrome profile, tool timeline, human-paced LinkedIn steps — no automation banner.",
                to: "/browser-workers",
              },
            ].map((card, i) => (
              <motion.div
                key={card.port}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.55, ease: easeOut }}
                className="group h-full rounded-2xl border border-white/[0.08] bg-[#050505] p-6 transition duration-500 hover:border-white/[0.14] hover:bg-[#080808]"
              >
                <p className="font-[family-name:var(--landing-mono)] text-[11px] tracking-[0.18em] text-zinc-500">
                  {card.port}
                </p>
                <h3 className="mt-3 font-[family-name:var(--landing-display)] text-xl font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.body}</p>
                <Link
                  to={card.to as "/"}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white"
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 grid gap-6 border-t border-white/[0.06] pt-16 md:grid-cols-2">
            <div>
              <p className="font-[family-name:var(--landing-mono)] text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Safety rails
              </p>
              <h3 className="mt-3 font-[family-name:var(--landing-display)] text-2xl font-semibold text-white">
                Approve before every send
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Hermes extracts profiles, drafts the path, then waits. You approve. Chrome sends —
                paced like a person. Daily caps stay low by design.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#050505] p-5 font-[family-name:var(--landing-mono)] text-[11px] leading-relaxed text-zinc-500">
              <p className="text-zinc-600">// typical mission</p>
              <p className="mt-2 text-zinc-300">search_people → extract_profiles(2)</p>
              <p className="text-zinc-400">await_approval(1)</p>
              <p className="text-zinc-300">send_connection · without_note</p>
              <p className="mt-3 text-zinc-600">status: invite_pending · synced → /profiles</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] bg-black py-16">
        <div className="mx-auto mb-10 max-w-6xl px-6">
          <p className="font-[family-name:var(--landing-mono)] text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Field notes
          </p>
          <h2 className="mt-3 font-[family-name:var(--landing-display)] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            What teams notice first
          </h2>
        </div>
        <div className="space-y-4">
          <InfiniteMarquee items={TWEETS_A} speed={48} />
          <InfiniteMarquee items={TWEETS_B} speed={55} reverse />
        </div>
      </section>

      <section id="faq" className="relative scroll-mt-24 border-t border-white/[0.06] bg-black px-6 py-24">
        <div className="relative z-10 mx-auto max-w-6xl">
          <FaqAccordion
            category="Runtime"
            description="Everything you need to know about deploying local AI agents and supervising LinkedIn outreach."
            items={FAQ_ITEMS}
          />
        </div>
      </section>

      <footer
        className="border-t px-6 pb-12 pt-16"
        style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-bg)" }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-[family-name:var(--landing-display)] text-lg font-semibold tracking-[0.06em] text-[var(--landing-heading)]">
              Alyson CRM+
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--landing-muted)]">
              Agentic CRM+ for LinkedIn outreach — local agents, approve before you send.
            </p>
          </div>
          <FooterCol title="Product" links={FOOTER.product} />
          <FooterCol title="Workspace" links={FOOTER.company} />
          <FooterCol title="Legal" links={FOOTER.legal} />
        </div>
        <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Alyson. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-xs text-zinc-500">
            <Link to="/terms" className="transition hover:text-zinc-300">
              Terms
            </Link>
            <Link to="/privacy" className="transition hover:text-zinc-300">
              Privacy
            </Link>
            <Link to="/overview" className="transition hover:text-zinc-300">
              Open app
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <p className="font-[family-name:var(--landing-mono)] text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to as "/"} className="text-sm text-zinc-500 transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 56);
  });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4">
      <AnimatePresence mode="wait" initial={false}>
        {!scrolled ? (
          <motion.div
            key="nav-inline"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="pointer-events-auto w-full max-w-6xl"
          >
            <div className="flex h-14 items-center justify-between rounded-2xl border border-transparent px-2 sm:px-4">
              <Link
                to="/"
                className="font-[family-name:var(--landing-display)] text-base font-semibold tracking-[0.08em] text-[var(--landing-heading)]"
              >
                Alyson CRM+
              </Link>
              <nav className="hidden items-center gap-7 md:flex">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="text-sm text-[var(--landing-nav-fg)] transition duration-300 hover:text-[var(--landing-nav-fg-hover)]"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <Link
                to="/overview"
                className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition duration-300 hover:bg-blue-400 sm:text-sm"
              >
                Open app
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="nav-pill"
            initial={{ opacity: 0, y: -18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="pointer-events-auto"
          >
            <nav
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)]",
                "backdrop-blur-xl sm:gap-1.5 sm:px-2.5 sm:py-2",
              )}
              style={{
                backgroundColor: "var(--landing-pill-bg)",
                borderColor: "var(--landing-pill-border)",
              }}
              aria-label="Floating navigation"
            >
              <Link
                to="/"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-[family-name:var(--landing-display)] text-[10px] font-semibold tracking-wider text-[var(--landing-heading)] ring-1 transition hover:opacity-90 sm:h-10 sm:w-10 sm:text-[11px]"
                style={{ backgroundColor: "var(--landing-elevated)", boxShadow: "inset 0 0 0 1px var(--landing-border)" }}
                title="Alyson CRM+"
              >
                A+
              </Link>

              <div
                className="mx-0.5 hidden h-5 w-px sm:block"
                style={{ backgroundColor: "var(--landing-border)" }}
              />

              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none sm:gap-1">
                {PILL_NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-medium text-[var(--landing-nav-fg)] transition hover:text-[var(--landing-nav-fg-hover)] sm:px-3 sm:text-xs"
                  >
                    {l.label}
                  </a>
                ))}
              </div>

              <div
                className="mx-0.5 hidden h-5 w-px sm:block"
                style={{ backgroundColor: "var(--landing-border)" }}
              />

              <Link
                to="/overview"
                className="shrink-0 rounded-full bg-blue-500 px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-400 sm:px-4 sm:text-xs"
              >
                Open app
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.85, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="font-[family-name:var(--landing-mono)] text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--landing-muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-[family-name:var(--landing-display)] text-3xl font-semibold tracking-tight text-[var(--landing-heading)] sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--landing-muted)]">{body}</p>
        </motion.div>
      );
    }
