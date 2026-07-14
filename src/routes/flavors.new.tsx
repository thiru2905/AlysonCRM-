import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { notifySoon } from "@/lib/actions";
import {
  ArrowRight,
  Bot,
  Boxes,
  FlaskConical,
  Sparkles,
  Waypoints,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/flavors/new")({
  head: () => ({
    meta: [
      { title: "New Flavor — Alyson OS" },
      { name: "description", content: "Describe your team. Alyson scaffolds a CRM flavor from the shared core: stages, entities, playbooks, workers." },
      { property: "og:title", content: "New Flavor — Alyson OS" },
      { property: "og:description", content: "Describe your team. Alyson scaffolds a CRM flavor." },
    ],
  }),
  component: NewFlavor,
});

const PRESETS = [
  {
    label: "Affiliate outreach",
    prompt:
      "We recruit and manage 200+ affiliates. Every partner is a person or a company, moves through outreach → activation → producing → dormant, and we want AI to draft outbound + monitor payouts.",
  },
  {
    label: "Investor relations",
    prompt:
      "We track LPs and prospective LPs, run quarterly updates, and route intros. Stages: sourced → intro'd → in diligence → committed → funded.",
  },
  {
    label: "Grant fundraising",
    prompt:
      "We manage grant opportunities from foundations. Stages: identified → LOI → full proposal → awarded → reporting. Each has deadlines and required documents.",
  },
];

interface FlavorPlan {
  name: string;
  stages: string[];
  entities: string[];
  playbooks: string[];
  workers: { name: string; role: string; kind: "ai" | "human" | "browser" }[];
}

function scaffold(prompt: string): FlavorPlan | null {
  const p = prompt.toLowerCase().trim();
  if (!p) return null;

  // Naive local scaffolder — a real /flavors/new would call Alyson.
  const isAffiliate = /(affiliate|partner|referr)/.test(p);
  const isInvestor = /(investor|lp|fund|capital)/.test(p);
  const isGrant = /(grant|foundation|proposal|loi)/.test(p);

  if (isAffiliate) {
    return {
      name: "Affiliate Outreach",
      stages: ["Sourced", "Outreach", "Activated", "Producing", "Dormant"],
      entities: ["Partner", "Company", "Payout", "Campaign"],
      playbooks: ["Cold outbound (7-touch)", "Activation nudge", "Payout recovery"],
      workers: [
        { name: "Atlas", role: "Outbound AI", kind: "ai" },
        { name: "Scout", role: "Partner site scraper", kind: "browser" },
        { name: "Nova", role: "Payout ops AI", kind: "ai" },
        { name: "Priya", role: "Partner manager", kind: "human" },
      ],
    };
  }
  if (isInvestor) {
    return {
      name: "Investor Relations",
      stages: ["Sourced", "Intro'd", "Diligence", "Committed", "Funded"],
      entities: ["LP", "Fund", "Update", "Commitment"],
      playbooks: ["Warm intro request", "Quarterly update", "Diligence follow-up"],
      workers: [
        { name: "Atlas", role: "Intro drafter AI", kind: "ai" },
        { name: "Sable", role: "Update writer AI", kind: "ai" },
        { name: "Priya", role: "Partner (human)", kind: "human" },
      ],
    };
  }
  if (isGrant) {
    return {
      name: "Grant Fundraising",
      stages: ["Identified", "LOI", "Proposal", "Awarded", "Reporting"],
      entities: ["Foundation", "Opportunity", "Document", "Report"],
      playbooks: ["Deadline watchdog", "Proposal draft", "Award reporting"],
      workers: [
        { name: "Atlas", role: "Proposal drafter AI", kind: "ai" },
        { name: "Scout", role: "Foundation site watcher", kind: "browser" },
        { name: "Priya", role: "Development lead", kind: "human" },
      ],
    };
  }

  // Generic fallback
  return {
    name: "Custom flavor",
    stages: ["New", "Working", "Qualified", "Won", "Lost"],
    entities: ["Contact", "Company", "Deal"],
    playbooks: ["Intro sequence", "Nurture", "Re-engage"],
    workers: [
      { name: "Atlas", role: "Outreach AI", kind: "ai" },
      { name: "Priya", role: "Owner (human)", kind: "human" },
    ],
  };
}

function NewFlavor() {
  const [prompt, setPrompt] = useState("");
  const plan = useMemo(() => scaffold(prompt), [prompt]);

  return (
    <PageContainer className="max-w-[1200px]">
      <PageHeader
        eyebrow="APPLICATIONS · NEW FLAVOR"
        title="Describe your team. Alyson scaffolds a flavor."
        description="Every flavor sits on the same core — contacts, pipeline, playbooks, workers. Tell Alyson what your team does and she'll pick the pieces."
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4">
        {/* Prompt */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <Wand2 className="h-3.5 w-3.5 text-ai" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Describe your team
            </span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. We're an affiliate outreach team recruiting 200+ partners. We move them through outreach → activated → producing, and want AI to draft cold emails and monitor payouts."
            className="w-full h-48 p-4 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60"
          />
          <div className="px-4 py-3 border-t border-border flex flex-wrap items-center gap-2">
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mr-1">
              Try:
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPrompt(p.prompt)}
                className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:bg-accent transition"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => notifySoon("Generate flavor", plan?.name ?? "your flavor")}
              disabled={!plan}
              className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ai-gradient-bg text-ai-foreground disabled:opacity-40 hover:brightness-110 transition"
            >
              Generate <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60">
            <Sparkles className="h-3.5 w-3.5 text-ai" />
            <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Alyson's scaffold
            </span>
            {plan && (
              <span className="ml-auto text-mono text-[10px] text-muted-foreground">
                preview
              </span>
            )}
          </div>
          {!plan ? (
            <div className="p-6 text-sm text-muted-foreground">
              Start typing or pick a preset. Alyson will map your words onto the
              shared core.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Flavor name
                </div>
                <div className="text-display text-lg mt-1">{plan.name}</div>
              </div>

              <PreviewList
                icon={Waypoints}
                label="Pipeline stages"
                items={plan.stages}
              />
              <PreviewList
                icon={Boxes}
                label="Core entities"
                items={plan.entities}
              />
              <PreviewList
                icon={FlaskConical}
                label="Starting playbooks"
                items={plan.playbooks}
              />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Worker team
                  </span>
                </div>
                <ul className="space-y-1">
                  {plan.workers.map((w) => (
                    <li
                      key={w.name}
                      className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border border-border/40"
                    >
                      <span className="text-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent">
                        {w.kind}
                      </span>
                      <span className="text-foreground">{w.name}</span>
                      <span className="text-muted-foreground truncate">
                        · {w.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground">
                Integrations (CRMs' usual bag) come from the shared{" "}
                <Link to="/knowledge" className="text-ai hover:underline">
                  source
                </Link>{" "}
                tool — added when you generate.
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function PreviewList({
  icon: Icon,
  label,
  items,
}: {
  icon: typeof Waypoints;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className="text-xs px-2 py-1 rounded-md border border-border/60 bg-background"
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
