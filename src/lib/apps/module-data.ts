import type { AppModuleProps } from "@/components/app-module/AppModule";

/* ------------------------------------------------------------------ */
/* Customer Success                                                    */
/* ------------------------------------------------------------------ */

export const SUCCESS_MODULE: AppModuleProps = {
  eyebrow: "APPLICATION · CUSTOMER SUCCESS",
  title: "Retention, driven by Alyson",
  description:
    "Accounts are Projects. Health is a Prediction. Every save motion is a task the OS can run itself.",
  metric: { label: "NRR (30d)", value: "112%", hint: "vs 104% last month" },
  brief: {
    confidence: 0.84,
    stats: [
      { label: "Accounts at risk", value: "3", hint: "$284k ARR exposed in 30 days" },
      { label: "If you approve 5 saves", value: "+$146k", hint: "predicted ARR retained" },
      { label: "Expansion window open", value: "6 accounts", hint: "usage over threshold" },
    ],
    recommendation:
      "let Sable run the QBR prep for Northwind, approve the expansion motion on Meridian, and route the churn-signal on Halden to Priya.",
  },
  filters: [
    { id: "at_risk", label: "At risk" },
    { id: "expansion", label: "Expansion" },
    { id: "onboarding", label: "Onboarding" },
    { id: "healthy", label: "Healthy" },
  ],
  filterRow: (row, filter) => row.meta?.toLowerCase().includes(filter.replace("_", " ")) ?? false,
  columnHeaders: ["Account · Alyson's next move", "Health", "ARR", "Renewal"],
  rows: [
    {
      id: "s-northwind",
      ref: "ACC-8842 · NEGOTIATING RENEWAL",
      primary: "Northwind Materials",
      secondary: "220 seats · Priya Rao, VP Ops",
      heat: "hot",
      meta: "at risk",
      metrics: [
        { label: "Health", value: "62", tone: "warning" },
        { label: "ARR", value: "$148k" },
        { label: "Renewal", value: "18d" },
      ],
      nextAction: "Draft QBR deck showing +38% workflow adoption in Q3",
      nextActionKind: "ai",
      rationale:
        "Priya escalated a support ticket this week — QBR framed around wins historically flips sentiment 2.4×.",
      owner: "Sable",
    },
    {
      id: "s-meridian",
      ref: "ACC-8811 · EXPANSION MOTION",
      primary: "Meridian Health Group",
      secondary: "48 seats · Dr. Aya Sato, CMO",
      heat: "warm",
      meta: "expansion",
      metrics: [
        { label: "Health", value: "81", tone: "success" },
        { label: "ARR", value: "$66k" },
        { label: "Renewal", value: "94d" },
      ],
      nextAction: "Propose clinical-ops seat pack (+30 seats)",
      nextActionKind: "ai",
      rationale:
        "Usage on clinical workflows is 4× above expansion threshold. Similar accounts converted at 71%.",
      owner: "Nova",
    },
    {
      id: "s-halden",
      ref: "ACC-8790 · CHURN SIGNAL",
      primary: "Halden Robotics",
      secondary: "34 seats · Marc Devlin, RevOps",
      heat: "hot",
      meta: "at risk",
      metrics: [
        { label: "Health", value: "38", tone: "danger" },
        { label: "ARR", value: "$92k" },
        { label: "Renewal", value: "46d" },
      ],
      nextAction: "Route executive save-call to Priya today",
      nextActionKind: "human",
      rationale:
        "Two power users went dormant 21 days ago; support tickets spiking. Sub-48h exec touch retains 61%.",
      owner: "Priya (human)",
    },
    {
      id: "s-cove",
      ref: "ACC-8740 · ONBOARDING",
      primary: "Cove & Fjord Insurance",
      secondary: "120 seats · Ines Vidal, Underwriting",
      heat: "warm",
      meta: "onboarding",
      metrics: [
        { label: "Health", value: "70", tone: "success" },
        { label: "ARR", value: "$210k" },
        { label: "TTV", value: "9d" },
      ],
      nextAction: "Ship second-cohort enablement pack",
      nextActionKind: "ai",
      rationale: "First cohort activation at 82%. Enabling cohort two in <14d protects renewal.",
      owner: "Sable",
    },
    {
      id: "s-sable-trust",
      ref: "ACC-8702 · HEALTHY",
      primary: "Sable Property Trust",
      secondary: "60 seats · Owen Frey, Acquisitions",
      heat: "cold",
      meta: "healthy",
      metrics: [
        { label: "Health", value: "91", tone: "success" },
        { label: "ARR", value: "$320k" },
        { label: "Renewal", value: "180d" },
      ],
      nextAction: "Send a light-touch executive summary; no ask",
      nextActionKind: "ai",
      rationale: "Advocacy signal present — Owen referred two peer buyers this quarter.",
      owner: "Nova",
    },
  ],
  workersLabel: "CSMs · Workers",
  workers: [
    { id: "w1", name: "Sable", role: "Success AI", kind: "ai", workingOn: "Northwind QBR draft", primaryMetric: "12 accts", secondaryMetric: "84% NRR" },
    { id: "w2", name: "Nova", role: "Expansion AI", kind: "ai", workingOn: "Meridian seat proposal", primaryMetric: "8 accts", secondaryMetric: "62% conv" },
    { id: "w3", name: "Scout", role: "Signals browser", kind: "browser", workingOn: "Support ticket sentiment", primaryMetric: "22 accts", secondaryMetric: "0.86 f1" },
    { id: "w4", name: "Priya Cole", role: "Sr CSM", kind: "human", workingOn: "Halden save call", primaryMetric: "9 accts", secondaryMetric: "94% NRR" },
  ],
  experiments: [
    { id: "e1", name: "QBR framing", hypothesis: "Wins-first framing beats roadmap-first on renewal calls.", lift: "+27%", confidence: 0.91, arm: "Wins-First", appliesTo: "Renewal cohort" },
    { id: "e2", name: "Onboarding cadence", hypothesis: "Two-week cohort activation lifts TTV by 5 days.", lift: "+34%", confidence: 0.88, arm: "Cohort-14d", appliesTo: "Onboarding" },
    { id: "e3", name: "Save-call speed", hypothesis: "Sub-48h exec touch retains 61% of churn signals.", lift: "+41%", confidence: 0.94, arm: "48h-SLA", appliesTo: "At-risk accounts" },
  ],
};

/* ------------------------------------------------------------------ */
/* Affiliate Outreach                                                  */
/* ------------------------------------------------------------------ */

export const AFFILIATE_MODULE: AppModuleProps = {
  eyebrow: "APPLICATION · AFFILIATE OUTREACH",
  title: "Partners, driven by Alyson",
  description:
    "Partners are Entities. Outreach is a Playbook. Every payout is a task the OS can run itself.",
  metric: { label: "Attributed GMV (30d)", value: "$412k", hint: "vs $286k last month" },
  brief: {
    confidence: 0.81,
    stats: [
      { label: "Active partners", value: "184", hint: "of 212 recruited this quarter" },
      { label: "If you approve 6 outreaches", value: "+34 partners", hint: "expected activations in 14 days" },
      { label: "Payout anomalies", value: "3", hint: "flagged by Nova for review" },
    ],
    recommendation:
      "let Atlas send the v3 outbound to the 40 dormant creators, approve Nova's payout reconciliation for Halden, and route the top-10 producers to Priya for a Q4 co-marketing ask.",
  },
  filters: [
    { id: "outreach", label: "Outreach" },
    { id: "activated", label: "Activated" },
    { id: "producing", label: "Producing" },
    { id: "dormant", label: "Dormant" },
  ],
  filterRow: (row, filter) => row.meta?.toLowerCase().includes(filter) ?? false,
  columnHeaders: ["Partner · Alyson's next move", "Tier", "GMV (30d)", "Status"],
  rows: [
    {
      id: "a-halden",
      ref: "AFF-9142 · TOP PRODUCER",
      primary: "Halden Creator Studio",
      secondary: "Content · 480k followers · Marc Devlin",
      heat: "hot",
      meta: "producing",
      metrics: [
        { label: "Tier", value: "Gold", tone: "success" },
        { label: "GMV", value: "$62k" },
        { label: "CVR", value: "4.8%", tone: "success" },
      ],
      nextAction: "Offer Q4 co-marketing slot + bump commission to 18%",
      nextActionKind: "ai",
      rationale:
        "Top 3% producer, three months in a row. Commission bump lifts retention 41% at this tier.",
      owner: "Atlas",
    },
    {
      id: "a-northwind",
      ref: "AFF-9088 · PAYOUT REVIEW",
      primary: "Northwind Affiliates LLC",
      secondary: "Agency · 22 sub-affiliates · Priya Rao",
      heat: "warm",
      meta: "producing",
      metrics: [
        { label: "Tier", value: "Silver" },
        { label: "GMV", value: "$28k" },
        { label: "CVR", value: "2.1%" },
      ],
      nextAction: "Reconcile October payout ($4,820) — 3 sub-affiliate mismatches",
      nextActionKind: "ai",
      rationale: "Nova detected 3 attribution mismatches. Reconciling now avoids escalation.",
      owner: "Nova",
    },
    {
      id: "a-meridian",
      ref: "AFF-9042 · ACTIVATION STALLED",
      primary: "Meridian Health Blog",
      secondary: "Editorial · 92k monthly · Dr. Aya Sato",
      heat: "warm",
      meta: "activated",
      metrics: [
        { label: "Tier", value: "New" },
        { label: "GMV", value: "$0" },
        { label: "Days", value: "18d", tone: "warning" },
      ],
      nextAction: "Send activation nudge v2 + share top-3 creative pack",
      nextActionKind: "ai",
      rationale:
        "Signed 18 days ago, no first click. Nudge v2 converts 34% of stalled activations.",
      owner: "Atlas",
    },
    {
      id: "a-sable",
      ref: "AFF-9001 · DORMANT",
      primary: "Sable Media Group",
      secondary: "Newsletter · 220k list · Owen Frey",
      heat: "cold",
      meta: "dormant",
      metrics: [
        { label: "Tier", value: "Bronze" },
        { label: "GMV", value: "$2.1k" },
        { label: "Last", value: "62d ago", tone: "warning" },
      ],
      nextAction: "Re-engage with holiday co-promo + free product credit",
      nextActionKind: "ai",
      rationale: "Was Silver in Q2. Holiday re-engage flow reactivates 22% of dormant Silvers.",
      owner: "Atlas",
    },
    {
      id: "a-cove",
      ref: "AFF-8944 · OUTREACH",
      primary: "Cove Podcast Network",
      secondary: "Audio · 14 shows · Ines Vidal",
      heat: "warm",
      meta: "outreach",
      metrics: [
        { label: "Tier", value: "—" },
        { label: "Est GMV", value: "$18k/mo" },
        { label: "Touch", value: "3 of 7" },
      ],
      nextAction: "Send touch 4: host-read script + revenue model",
      nextActionKind: "browser",
      rationale:
        "Opened touch 3 twice. Host-read script converts 28% of engaged podcast prospects.",
      owner: "Scout",
    },
    {
      id: "a-frey",
      ref: "AFF-8902 · PAYOUT SENT",
      primary: "Frey Fitness Collective",
      secondary: "Community · 8 coaches · lead: Owen Frey",
      heat: "cold",
      meta: "producing",
      metrics: [
        { label: "Tier", value: "Silver" },
        { label: "GMV", value: "$14k" },
        { label: "Paid", value: "$2.1k", tone: "success" },
      ],
      nextAction: "Send monthly performance recap + top-coach spotlight",
      nextActionKind: "api",
      rationale:
        "Recaps drive 2.6× more sub-coach signups in following month.",
      owner: "Docs API",
    },
  ],
  workersLabel: "Partner ops · Workers",
  workers: [
    { id: "w1", name: "Atlas", role: "Outbound AI", kind: "ai", workingOn: "Dormant re-engage v3", primaryMetric: "40 sends", secondaryMetric: "22% react" },
    { id: "w2", name: "Nova", role: "Payout ops AI", kind: "ai", workingOn: "Northwind reconciliation", primaryMetric: "184 partners", secondaryMetric: "0 anomalies open" },
    { id: "w3", name: "Scout", role: "Partner site scraper", kind: "browser", workingOn: "Cove podcast prospecting", primaryMetric: "62 sites", secondaryMetric: "9 leads" },
    { id: "w4", name: "Priya Rao", role: "Partner manager", kind: "human", workingOn: "Halden Q4 co-marketing", primaryMetric: "12 top-tier", secondaryMetric: "94% retain" },
  ],
  experiments: [
    { id: "e1", name: "Commission bump at Gold", hypothesis: "18% commission at Gold lifts retention 41% vs 15%.", lift: "+41%", confidence: 0.92, arm: "Gold-18", appliesTo: "Top-tier producers" },
    { id: "e2", name: "Activation nudge v2", hypothesis: "Creative-pack nudge converts stalled activations 34%.", lift: "+34%", confidence: 0.87, arm: "Nudge-v2", appliesTo: "New partners > 14d idle" },
    { id: "e3", name: "Host-read podcast script", hypothesis: "Host-read scripts convert podcast prospects 28% vs 11%.", lift: "+17pt", confidence: 0.9, arm: "Host-read", appliesTo: "Podcast outreach" },
  ],
};


/* ------------------------------------------------------------------ */
/* Marketing                                                           */
/* ------------------------------------------------------------------ */

export const MARKETING_MODULE: AppModuleProps = {
  eyebrow: "APPLICATION · MARKETING",
  title: "Demand, driven by Alyson",
  description:
    "Campaigns are Projects. Audiences are Entities. Every send is an experiment the OS can score.",
  metric: { label: "Pipeline sourced (30d)", value: "$1.42M", hint: "vs $980k last month" },
  brief: {
    confidence: 0.82,
    stats: [
      { label: "Live campaigns", value: "6", hint: "3 in test, 3 fully rolled out" },
      { label: "If you approve 4 sends", value: "+$187k", hint: "predicted pipeline in 14 days" },
      { label: "Fatigue signals", value: "2 audiences", hint: "unsubscribe rate above threshold" },
    ],
    recommendation:
      "let Nova ship the winning subject variant to Enterprise-Ops, approve the retargeting for the Q4-AI ebook, and pause the Manufacturing burst until fatigue clears.",
  },
  filters: [
    { id: "email", label: "Email" },
    { id: "paid", label: "Paid" },
    { id: "content", label: "Content" },
    { id: "webinar", label: "Webinar" },
  ],
  filterRow: (row, filter) => row.meta?.toLowerCase().includes(filter) ?? false,
  columnHeaders: ["Campaign · Alyson's next move", "CTR", "MQLs", "Pipe"],
  rows: [
    {
      id: "m-q4ai",
      ref: "MC-Q4-AI · IN MARKET",
      primary: "Q4 AI Ops · demand-gen ebook",
      secondary: "Audience: Enterprise-Ops · 24k reach",
      heat: "hot",
      meta: "email",
      metrics: [
        { label: "CTR", value: "6.4%", tone: "success" },
        { label: "MQLs", value: "184" },
        { label: "Pipe", value: "$412k" },
      ],
      nextAction: "Roll out subject variant B to remaining 60% of audience",
      nextActionKind: "ai",
      rationale: "Variant B lifts open rate by 23% at 0.94 confidence. Rollout ships $187k pipe.",
      owner: "Nova",
    },
    {
      id: "m-retarget",
      ref: "MC-RT-EB · RETARGETING",
      primary: "Ebook retargeting · LinkedIn + Meta",
      secondary: "Audience: Downloaded but no-demo",
      heat: "warm",
      meta: "paid",
      metrics: [
        { label: "CTR", value: "2.1%" },
        { label: "MQLs", value: "62" },
        { label: "Pipe", value: "$188k" },
      ],
      nextAction: "Approve $12k budget lift on high-intent segment",
      nextActionKind: "human",
      rationale: "Segment CPM stable, conversion up 18% week-over-week.",
      owner: "Ryan (human)",
    },
    {
      id: "m-mfg",
      ref: "MC-MFG-BURST · PAUSED",
      primary: "Manufacturing burst · account-based",
      secondary: "Audience: 800 target accounts",
      heat: "cold",
      meta: "email",
      metrics: [
        { label: "CTR", value: "0.9%", tone: "danger" },
        { label: "MQLs", value: "4" },
        { label: "Pipe", value: "$0" },
      ],
      nextAction: "Hold sends until fatigue score drops below 0.4",
      nextActionKind: "api",
      rationale: "Unsub rate 2.4× baseline. Cooling window: 21 days for full recovery.",
      owner: "Fatigue guard",
    },
    {
      id: "m-webinar",
      ref: "MC-WB-CFO · UPCOMING",
      primary: "CFO Roundtable · Nov 22",
      secondary: "Audience: Finance leaders, F500",
      heat: "warm",
      meta: "webinar",
      metrics: [
        { label: "Reg", value: "312" },
        { label: "MQLs", value: "94" },
        { label: "Pipe", value: "$620k" },
      ],
      nextAction: "Send day-of reminder + calendar hold reissue",
      nextActionKind: "ai",
      rationale: "Reminder cadence lifts attend rate 41% for finance audiences.",
      owner: "Nova",
    },
    {
      id: "m-content",
      ref: "MC-CT-BLOG · EVERGREEN",
      primary: "AI-ops benchmark report",
      secondary: "Audience: Organic + partner syndication",
      heat: "cold",
      meta: "content",
      metrics: [
        { label: "CTR", value: "4.2%" },
        { label: "MQLs", value: "38" },
        { label: "Pipe", value: "$96k" },
      ],
      nextAction: "Refresh with Q3 data and re-syndicate",
      nextActionKind: "ai",
      rationale: "Refreshed benchmarks average 3.2× lift in second-window traffic.",
      owner: "Atlas",
    },
  ],
  workersLabel: "Marketers · Workers",
  workers: [
    { id: "w1", name: "Nova", role: "Campaign AI", kind: "ai", workingOn: "Q4-AI subject test", primaryMetric: "6 camps", secondaryMetric: "18% CTR" },
    { id: "w2", name: "Atlas", role: "Content AI", kind: "ai", workingOn: "Benchmark refresh", primaryMetric: "4 assets", secondaryMetric: "0.88 f1" },
    { id: "w3", name: "Scout", role: "Audience browser", kind: "browser", workingOn: "Look-alike sourcing", primaryMetric: "12 aud", secondaryMetric: "3.1× lift" },
    { id: "w4", name: "Mira Chen", role: "Growth lead", kind: "human", workingOn: "Q4 pipeline plan", primaryMetric: "6 camps", secondaryMetric: "$1.4M" },
  ],
  experiments: [
    { id: "e1", name: "Subject line", hypothesis: "Metric-in-subject lifts open rate on ops personas.", lift: "+23%", confidence: 0.94, arm: "Subject-B", appliesTo: "Enterprise-Ops" },
    { id: "e2", name: "Retarget window", hypothesis: "7-day window beats 14-day for ebook downloaders.", lift: "+18%", confidence: 0.86, arm: "Window-7d", appliesTo: "Downloaded no-demo" },
    { id: "e3", name: "Webinar reminder", hypothesis: "Two-touch reminder beats single-touch by 41%.", lift: "+41%", confidence: 0.92, arm: "Two-touch", appliesTo: "Finance webinars" },
  ],
};

/* ------------------------------------------------------------------ */
/* Real Estate                                                         */
/* ------------------------------------------------------------------ */

export const REAL_ESTATE_MODULE: AppModuleProps = {
  eyebrow: "APPLICATION · REAL ESTATE",
  title: "Listings, driven by Alyson",
  description:
    "Properties are Entities. Buyers are Audiences. Every showing is a task the OS can run itself.",
  metric: { label: "Active listings", value: "18", hint: "$42.4M portfolio" },
  brief: {
    confidence: 0.83,
    stats: [
      { label: "Offers this week", value: "6", hint: "3 above ask, 2 at ask" },
      { label: "If you approve 4 actions", value: "+11 tours", hint: "predicted in 7 days" },
      { label: "At risk", value: "2 listings", hint: "days-on-market > 45" },
    ],
    recommendation:
      "let Scout re-shoot 42 Bleecker after the price cut, approve the price adjustment on 118 Wren, and route the multi-offer situation on 7 Larch to Sofia.",
  },
  filters: [
    { id: "listing", label: "Active" },
    { id: "under_contract", label: "Under contract" },
    { id: "showing", label: "Showings" },
    { id: "price_cut", label: "Price cut" },
  ],
  filterRow: (row, filter) => row.meta?.toLowerCase().includes(filter.replace("_", " ")) ?? false,
  columnHeaders: ["Property · Alyson's next move", "List", "Days", "Offers"],
  rows: [
    {
      id: "p-larch",
      ref: "PR-7-LARCH · MULTI-OFFER",
      primary: "7 Larch Street · Brooklyn Heights",
      secondary: "3 bed · 2.5 bath · $2.4M",
      heat: "hot",
      meta: "listing",
      metrics: [
        { label: "List", value: "$2.4M" },
        { label: "Days", value: "6" },
        { label: "Offers", value: "4", tone: "success" },
      ],
      nextAction: "Route highest-and-best request to all 4 offer parties",
      nextActionKind: "ai",
      rationale:
        "Two offers already at 4% over ask. Highest-and-best in <48h historically clears $85k more.",
      owner: "Sofia (human)",
    },
    {
      id: "p-wren",
      ref: "PR-118-WREN · PRICE CUT",
      primary: "118 Wren Ave · Cobble Hill",
      secondary: "4 bed · 3 bath · $3.1M",
      heat: "warm",
      meta: "price_cut",
      metrics: [
        { label: "List", value: "$3.1M", tone: "warning" },
        { label: "Days", value: "52" },
        { label: "Offers", value: "0" },
      ],
      nextAction: "Approve 4.5% price adjustment to $2.96M",
      nextActionKind: "human",
      rationale:
        "Comparable listings clear within 21 days of a 3–5% cut. Current-price probability: 12%.",
      owner: "Ryan (human)",
    },
    {
      id: "p-bleecker",
      ref: "PR-42-BLEECKER · RE-SHOOT",
      primary: "42 Bleecker · West Village",
      secondary: "2 bed · 2 bath · $1.85M",
      heat: "warm",
      meta: "listing",
      metrics: [
        { label: "List", value: "$1.85M" },
        { label: "Days", value: "22" },
        { label: "Offers", value: "1" },
      ],
      nextAction: "Book photography re-shoot for staged living room",
      nextActionKind: "browser",
      rationale: "Listings with re-shot hero images see 3.4× more saves in the first week.",
      owner: "Scout",
    },
    {
      id: "p-clinton",
      ref: "PR-9-CLINTON · UNDER CONTRACT",
      primary: "9 Clinton · Fort Greene",
      secondary: "3 bed · 2 bath · $1.65M",
      heat: "cold",
      meta: "under_contract",
      metrics: [
        { label: "List", value: "$1.65M" },
        { label: "Days", value: "14" },
        { label: "Offers", value: "6" },
      ],
      nextAction: "Track appraisal + inspection contingency dates",
      nextActionKind: "api",
      rationale: "Closing scheduled 21 days out. Contingency windows expire in 7 and 10 days.",
      owner: "Docs API",
    },
    {
      id: "p-orchard",
      ref: "PR-88-ORCHARD · SHOWINGS",
      primary: "88 Orchard · LES",
      secondary: "1 bed · 1 bath · $985k",
      heat: "warm",
      meta: "showing",
      metrics: [
        { label: "List", value: "$985k" },
        { label: "Days", value: "9" },
        { label: "Offers", value: "0" },
      ],
      nextAction: "Send saved-search buyers a weekend open-house invite",
      nextActionKind: "ai",
      rationale: "18 matched saved searches. Open-house conversion averages 2.1 offers per event.",
      owner: "Nova",
    },
  ],
  workersLabel: "Agents · Workers",
  workers: [
    { id: "w1", name: "Nova", role: "Buyer outreach", kind: "ai", workingOn: "Saved-search invites", primaryMetric: "8 lists", secondaryMetric: "4.2% CTR" },
    { id: "w2", name: "Scout", role: "Comps + media browser", kind: "browser", workingOn: "Photo re-shoot brief", primaryMetric: "6 lists", secondaryMetric: "3.4× saves" },
    { id: "w3", name: "Atlas", role: "Pricing AI", kind: "ai", workingOn: "Wren adjustment model", primaryMetric: "18 lists", secondaryMetric: "0.91 acc" },
    { id: "w4", name: "Sofia Reyes", role: "Sr Agent", kind: "human", workingOn: "Larch highest-and-best", primaryMetric: "5 lists", secondaryMetric: "96% clear" },
  ],
  experiments: [
    { id: "e1", name: "Highest-and-best", hypothesis: "48h H&B window clears more $ than open bidding.", lift: "+3.5%", confidence: 0.9, arm: "H&B-48h", appliesTo: "Multi-offer" },
    { id: "e2", name: "Hero re-shoot", hypothesis: "Re-shoot after 14d lifts saves 3.4×.", lift: "+240%", confidence: 0.88, arm: "Re-shoot-14d", appliesTo: "Slow listings" },
    { id: "e3", name: "Price cut size", hypothesis: "3–5% cut clears faster than aggressive 8%+.", lift: "+21d", confidence: 0.83, arm: "Cut-4.5", appliesTo: "45d+ on market" },
  ],
};

/* ------------------------------------------------------------------ */
/* Mortgage                                                            */
/* ------------------------------------------------------------------ */

export const MORTGAGE_MODULE: AppModuleProps = {
  eyebrow: "APPLICATION · MORTGAGE",
  title: "Loans, driven by Alyson",
  description:
    "Applications are Projects. Underwriting is a Workflow. Every document request is a task the OS can run itself.",
  metric: { label: "Loans in flight", value: "42", hint: "$14.8M origination volume" },
  brief: {
    confidence: 0.87,
    stats: [
      { label: "Ready to fund", value: "6", hint: "$2.1M clear-to-close today" },
      { label: "If you approve 4 requests", value: "−9 days", hint: "median time-to-close" },
      { label: "Doc gaps", value: "11 files", hint: "Alyson can auto-request 8" },
    ],
    recommendation:
      "let Docs API pull 8 outstanding tax transcripts, approve the appraisal reorder on Kessler, and route the jumbo underwriting on Sanchez to Priya.",
  },
  filters: [
    { id: "underwriting", label: "Underwriting" },
    { id: "processing", label: "Processing" },
    { id: "clear_to_close", label: "Clear to close" },
    { id: "funded", label: "Funded" },
  ],
  filterRow: (row, filter) => row.meta?.toLowerCase().includes(filter.replace("_", " ")) ?? false,
  columnHeaders: ["Loan · Alyson's next move", "Amount", "LTV", "DTI"],
  rows: [
    {
      id: "l-sanchez",
      ref: "LN-8842 · JUMBO",
      primary: "Sanchez Household · 30yr fixed",
      secondary: "620k Cobble Hill purchase · 20% down",
      heat: "hot",
      meta: "underwriting",
      metrics: [
        { label: "Amount", value: "$496k" },
        { label: "LTV", value: "80%" },
        { label: "DTI", value: "38%", tone: "warning" },
      ],
      nextAction: "Route DTI edge case to underwriter (jumbo tier)",
      nextActionKind: "human",
      rationale:
        "DTI 38% is inside jumbo guidelines with compensating factors (reserves 12mo). Approve historically at 78%.",
      owner: "Priya (human)",
    },
    {
      id: "l-kessler",
      ref: "LN-8811 · APPRAISAL FLAG",
      primary: "Kessler Refi · 15yr fixed",
      secondary: "895k cash-out refi · 62% LTV",
      heat: "warm",
      meta: "processing",
      metrics: [
        { label: "Amount", value: "$555k" },
        { label: "LTV", value: "62%" },
        { label: "DTI", value: "31%" },
      ],
      nextAction: "Reorder appraisal — original comps flagged as stale",
      nextActionKind: "browser",
      rationale: "Comps > 90 days old on 3 of 4 records. Reorder average TAT: 6 days.",
      owner: "Scout",
    },
    {
      id: "l-devlin",
      ref: "LN-8790 · CLEAR TO CLOSE",
      primary: "Devlin Purchase · 30yr fixed",
      secondary: "740k Park Slope · 25% down",
      heat: "hot",
      meta: "clear_to_close",
      metrics: [
        { label: "Amount", value: "$555k" },
        { label: "LTV", value: "75%" },
        { label: "DTI", value: "28%", tone: "success" },
      ],
      nextAction: "Send CD to borrower; schedule closing for Thursday",
      nextActionKind: "ai",
      rationale: "All conditions cleared 2 days ago. TRID timing allows Thursday close.",
      owner: "Nova",
    },
    {
      id: "l-rao",
      ref: "LN-8740 · DOC GAP",
      primary: "Rao FHA · 30yr",
      secondary: "425k Astoria purchase · 3.5% down",
      heat: "warm",
      meta: "underwriting",
      metrics: [
        { label: "Amount", value: "$410k" },
        { label: "LTV", value: "96.5%" },
        { label: "DTI", value: "42%" },
      ],
      nextAction: "Auto-request 4506-T tax transcript from IRS",
      nextActionKind: "api",
      rationale: "IRS transcript auto-pull TAT: 24–48h. Manual request adds 5–7 days.",
      owner: "Docs API",
    },
    {
      id: "l-frey",
      ref: "LN-8702 · FUNDED",
      primary: "Frey Investment · 30yr",
      secondary: "1.2M multi-family · 30% down",
      heat: "cold",
      meta: "funded",
      metrics: [
        { label: "Amount", value: "$840k" },
        { label: "LTV", value: "70%" },
        { label: "DTI", value: "35%" },
      ],
      nextAction: "Send funded-loan summary + post-close survey",
      nextActionKind: "ai",
      rationale: "Funded 3 days ago. Post-close NPS captured within 7 days improves referral rate.",
      owner: "Nova",
    },
  ],
  workersLabel: "Loan officers · Workers",
  workers: [
    { id: "w1", name: "Nova", role: "Borrower comms AI", kind: "ai", workingOn: "CD delivery · Devlin", primaryMetric: "14 loans", secondaryMetric: "3.4h SLA" },
    { id: "w2", name: "Scout", role: "Comps browser", kind: "browser", workingOn: "Kessler appraisal", primaryMetric: "8 loans", secondaryMetric: "6d TAT" },
    { id: "w3", name: "Docs API", role: "Auto-doc puller", kind: "api", workingOn: "IRS 4506-T batch", primaryMetric: "22 files", secondaryMetric: "94% hit" },
    { id: "w4", name: "Priya Ito", role: "Sr Underwriter", kind: "human", workingOn: "Sanchez jumbo review", primaryMetric: "9 loans", secondaryMetric: "18d avg" },
  ],
  experiments: [
    { id: "e1", name: "Auto-doc requests", hypothesis: "API 4506-T pull saves 5 days per loan.", lift: "-5.2d", confidence: 0.95, arm: "Auto-pull", appliesTo: "Underwriting" },
    { id: "e2", name: "CD scheduling", hypothesis: "Same-day CD after CTC cuts close time by 2 days.", lift: "-2.1d", confidence: 0.89, arm: "Same-day-CD", appliesTo: "Clear to close" },
    { id: "e3", name: "Appraisal reorder", hypothesis: "Reorder < 90d comps clears at 92% vs 61%.", lift: "+31%", confidence: 0.91, arm: "Fresh-comps", appliesTo: "Refi files" },
  ],
};

/* ------------------------------------------------------------------ */
/* Insurance                                                           */
/* ------------------------------------------------------------------ */

export const INSURANCE_MODULE: AppModuleProps = {
  eyebrow: "APPLICATION · INSURANCE",
  title: "Policies, driven by Alyson",
  description:
    "Quotes are Projects. Policies are Entities. Every underwriting decision is a prediction the OS can explain.",
  metric: { label: "Written premium (30d)", value: "$1.86M", hint: "vs $1.42M last month" },
  brief: {
    confidence: 0.85,
    stats: [
      { label: "Quotes in flight", value: "18", hint: "$412k premium exposure" },
      { label: "If you approve 5 binds", value: "+$94k", hint: "premium written in 14 days" },
      { label: "Renewals in 30d", value: "34", hint: "12 at risk of non-renewal" },
    ],
    recommendation:
      "let Atlas re-price the Sanchez auto+home bundle, approve the commercial umbrella for Halden, and route the CAT-zone reroute on 3 policies to Priya.",
  },
  filters: [
    { id: "quote", label: "Quotes" },
    { id: "bound", label: "Bound" },
    { id: "renewal", label: "Renewals" },
    { id: "claim", label: "Claims" },
  ],
  filterRow: (row, filter) => row.meta?.toLowerCase().includes(filter) ?? false,
  columnHeaders: ["Policy · Alyson's next move", "Premium", "Loss ratio", "Renew"],
  rows: [
    {
      id: "i-sanchez",
      ref: "IQ-8842 · AUTO + HOME",
      primary: "Sanchez Household · Bundle",
      secondary: "Cobble Hill · 2 drivers · 1 home",
      heat: "hot",
      meta: "quote",
      metrics: [
        { label: "Premium", value: "$3.8k/yr" },
        { label: "LR", value: "0.42", tone: "success" },
        { label: "Bind", value: "3d" },
      ],
      nextAction: "Re-price bundle with multi-policy discount (7%)",
      nextActionKind: "ai",
      rationale:
        "Bundle discount lifts bind probability from 44% → 71% at this risk score. Loss ratio remains inside guidelines.",
      owner: "Atlas",
    },
    {
      id: "i-halden",
      ref: "IQ-8811 · COMMERCIAL UMBRELLA",
      primary: "Halden Robotics · $5M umbrella",
      secondary: "Manufacturing · 34 employees",
      heat: "warm",
      meta: "quote",
      metrics: [
        { label: "Premium", value: "$18.4k/yr" },
        { label: "LR", value: "0.58" },
        { label: "Bind", value: "7d" },
      ],
      nextAction: "Approve carrier placement with Chubb (best combined ratio)",
      nextActionKind: "human",
      rationale: "Chubb quote 12% below market for this NAICS. Alt carrier TAT +9 days.",
      owner: "Priya (human)",
    },
    {
      id: "i-cove",
      ref: "IQ-8790 · RENEWAL AT RISK",
      primary: "Cove & Fjord · General liability",
      secondary: "Insurance broker · renewal 22d",
      heat: "hot",
      meta: "renewal",
      metrics: [
        { label: "Premium", value: "$42k/yr" },
        { label: "LR", value: "0.71", tone: "warning" },
        { label: "Renew", value: "22d" },
      ],
      nextAction: "Request updated exposure schedule + re-quote 3 carriers",
      nextActionKind: "browser",
      rationale: "Loss ratio drift + 5 new hires. Re-shopping preserves premium at 68% probability.",
      owner: "Scout",
    },
    {
      id: "i-frey",
      ref: "IQ-8740 · CLAIM OPEN",
      primary: "Frey Multi-family · Water damage",
      secondary: "Claim #C-8402 · $84k reserve",
      heat: "warm",
      meta: "claim",
      metrics: [
        { label: "Reserve", value: "$84k" },
        { label: "Age", value: "18d" },
        { label: "Sev", value: "Med", tone: "warning" },
      ],
      nextAction: "Route to preferred remediation vendor + schedule inspection",
      nextActionKind: "ai",
      rationale: "Preferred vendors close claims 41% faster with 22% lower severity drift.",
      owner: "Nova",
    },
    {
      id: "i-devlin",
      ref: "IQ-8702 · BOUND",
      primary: "Devlin Auto · 6-month policy",
      secondary: "Park Slope · clean record",
      heat: "cold",
      meta: "bound",
      metrics: [
        { label: "Premium", value: "$1.4k/6mo" },
        { label: "LR", value: "0.32", tone: "success" },
        { label: "Renew", value: "180d" },
      ],
      nextAction: "Schedule 90-day rate-check for competitive protect",
      nextActionKind: "api",
      rationale: "Rate-check at midpoint retains 91% vs 74% for no-check accounts.",
      owner: "Docs API",
    },
  ],
  workersLabel: "Underwriters · Workers",
  workers: [
    { id: "w1", name: "Atlas", role: "Pricing AI", kind: "ai", workingOn: "Sanchez re-price", primaryMetric: "22 quotes", secondaryMetric: "0.87 f1" },
    { id: "w2", name: "Nova", role: "Claims AI", kind: "ai", workingOn: "Frey water claim", primaryMetric: "9 claims", secondaryMetric: "41% faster" },
    { id: "w3", name: "Scout", role: "Carrier browser", kind: "browser", workingOn: "Cove re-shop", primaryMetric: "6 renewals", secondaryMetric: "3 carriers" },
    { id: "w4", name: "Priya Ito", role: "Sr Underwriter", kind: "human", workingOn: "Halden umbrella", primaryMetric: "12 quotes", secondaryMetric: "94% bind" },
  ],
  experiments: [
    { id: "e1", name: "Bundle discount", hypothesis: "7% multi-policy discount lifts bind 27pt.", lift: "+27pt", confidence: 0.93, arm: "Bundle-7", appliesTo: "Auto+Home quotes" },
    { id: "e2", name: "Rate-check cadence", hypothesis: "90-day rate check retains 91% vs 74%.", lift: "+17pt", confidence: 0.9, arm: "90d-check", appliesTo: "Bound auto" },
    { id: "e3", name: "Preferred vendors", hypothesis: "Preferred remediation vendors reduce severity 22%.", lift: "-22%", confidence: 0.88, arm: "Preferred-v", appliesTo: "Property claims" },
  ],
};
