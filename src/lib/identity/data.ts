// Alyson Identity Graph — deterministic seed dataset
// Every person, company, place, project, meeting, email, phone, and browser
// action is a node. Relationships carry strength, recency, and provenance.

export type IdentityKind =
  | "person"
  | "company"
  | "place"
  | "project"
  | "meeting"
  | "email"
  | "phone"
  | "browser";

export type EdgeKind =
  | "works_at"
  | "located_in"
  | "attended"
  | "emailed"
  | "called"
  | "browsed"
  | "owns"
  | "part_of"
  | "met_with"
  | "introduced_by";

export interface IdentityNode {
  id: string;
  kind: IdentityKind;
  label: string;
  sublabel?: string;
  ownerId?: string; // person who "owns" this record inside the org
  handle?: string;
  meta?: Record<string, string | number>;
}

export interface IdentityEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  strength: number; // 0..1 relationship strength
  lastAt: string; // ISO date of last interaction
  count?: number; // number of interactions
  note?: string;
}

export interface CommEvent {
  id: string;
  at: string;
  channel: "email" | "call" | "meeting" | "browser" | "slack";
  fromId: string;
  toId: string;
  subject: string;
  durationMin?: number;
}

// --------------------------------------------------------------------
// Nodes
// --------------------------------------------------------------------

export const NODES: IdentityNode[] = [
  // Internal team (people)
  { id: "p_alyson", kind: "person", label: "Alyson", sublabel: "AI operator", handle: "@alyson" },
  { id: "p_maya", kind: "person", label: "Maya Chen", sublabel: "Head of Growth", handle: "maya@alyson.os" },
  { id: "p_dev", kind: "person", label: "Devraj Patel", sublabel: "Founding AE", handle: "dev@alyson.os" },
  { id: "p_sara", kind: "person", label: "Sara Iyer", sublabel: "Solutions Eng", handle: "sara@alyson.os" },

  // External people (customers / prospects / partners)
  { id: "p_lena", kind: "person", label: "Lena Novak", sublabel: "VP Ops · Northwind", handle: "lena@northwind.co", ownerId: "p_dev" },
  { id: "p_theo", kind: "person", label: "Theo Marsh", sublabel: "CTO · Northwind", handle: "theo@northwind.co", ownerId: "p_dev" },
  { id: "p_ravi", kind: "person", label: "Ravi Kapoor", sublabel: "Founder · Meridian", handle: "ravi@meridian.io", ownerId: "p_maya" },
  { id: "p_juno", kind: "person", label: "Juno Park", sublabel: "PM · Halcyon", handle: "juno@halcyon.dev", ownerId: "p_sara" },
  { id: "p_ines", kind: "person", label: "Inés Roldán", sublabel: "Analyst · Halcyon", handle: "ines@halcyon.dev", ownerId: "p_sara" },
  { id: "p_marco", kind: "person", label: "Marco Bianchi", sublabel: "Partner · Vela Capital", handle: "marco@vela.vc", ownerId: "p_maya" },

  // Companies
  { id: "c_northwind", kind: "company", label: "Northwind", sublabel: "Logistics · 420 employees" },
  { id: "c_meridian", kind: "company", label: "Meridian", sublabel: "Fintech · Series B" },
  { id: "c_halcyon", kind: "company", label: "Halcyon", sublabel: "Devtools · 60 employees" },
  { id: "c_vela", kind: "company", label: "Vela Capital", sublabel: "Investor · led Series A" },
  { id: "c_alyson", kind: "company", label: "Alyson", sublabel: "Us" },

  // Places
  { id: "pl_sf", kind: "place", label: "San Francisco", sublabel: "HQ region" },
  { id: "pl_nyc", kind: "place", label: "New York", sublabel: "East coast" },
  { id: "pl_london", kind: "place", label: "London", sublabel: "EMEA" },

  // Projects (deals / initiatives)
  { id: "pr_northwind", kind: "project", label: "Northwind expansion", sublabel: "Pilot → 3-region rollout", ownerId: "p_dev" },
  { id: "pr_meridian", kind: "project", label: "Meridian partnership", sublabel: "Co-marketing motion", ownerId: "p_maya" },
  { id: "pr_halcyon", kind: "project", label: "Halcyon renewal", sublabel: "Multi-year renewal", ownerId: "p_sara" },

  // Meetings
  { id: "m_nw_qbr", kind: "meeting", label: "Northwind QBR", sublabel: "Mar 12 · 45m" },
  { id: "m_meridian_intro", kind: "meeting", label: "Meridian intro", sublabel: "Mar 04 · 30m" },
  { id: "m_halcyon_sync", kind: "meeting", label: "Halcyon weekly", sublabel: "Weekly · 30m" },

  // Email threads (represented as nodes so they can be searched / drilled)
  { id: "e_nw_pricing", kind: "email", label: "Re: pricing memo", sublabel: "Thread · 8 msgs" },
  { id: "e_meridian_partnership", kind: "email", label: "Partnership terms v3", sublabel: "Thread · 4 msgs" },
  { id: "e_halcyon_renewal", kind: "email", label: "Renewal draft", sublabel: "Thread · 12 msgs" },

  // Phone calls
  { id: "ph_lena", kind: "phone", label: "Call · Lena", sublabel: "Mar 18 · 22m" },
  { id: "ph_juno", kind: "phone", label: "Call · Juno", sublabel: "Mar 20 · 14m" },

  // Browser actions
  { id: "b_northwind_site", kind: "browser", label: "northwind.co/pricing", sublabel: "3 visits · this week" },
  { id: "b_meridian_deck", kind: "browser", label: "Meridian deck (Notion)", sublabel: "Opened 2× today" },
  { id: "b_halcyon_docs", kind: "browser", label: "Halcyon API docs", sublabel: "6 sessions · Mar" },
];

// --------------------------------------------------------------------
// Edges
// --------------------------------------------------------------------

export const EDGES: IdentityEdge[] = [
  // Employment
  { id: "e1", source: "p_lena", target: "c_northwind", kind: "works_at", strength: 0.95, lastAt: "2025-03-20", note: "VP Ops · 4y tenure" },
  { id: "e2", source: "p_theo", target: "c_northwind", kind: "works_at", strength: 0.95, lastAt: "2025-03-20" },
  { id: "e3", source: "p_ravi", target: "c_meridian", kind: "works_at", strength: 0.95, lastAt: "2025-03-19" },
  { id: "e4", source: "p_juno", target: "c_halcyon", kind: "works_at", strength: 0.95, lastAt: "2025-03-21" },
  { id: "e5", source: "p_ines", target: "c_halcyon", kind: "works_at", strength: 0.85, lastAt: "2025-03-21" },
  { id: "e6", source: "p_marco", target: "c_vela", kind: "works_at", strength: 0.95, lastAt: "2025-03-15" },
  { id: "e7", source: "p_maya", target: "c_alyson", kind: "works_at", strength: 1.0, lastAt: "2025-03-22" },
  { id: "e8", source: "p_dev", target: "c_alyson", kind: "works_at", strength: 1.0, lastAt: "2025-03-22" },
  { id: "e9", source: "p_sara", target: "c_alyson", kind: "works_at", strength: 1.0, lastAt: "2025-03-22" },

  // Investor relationship
  { id: "e10", source: "c_vela", target: "c_alyson", kind: "part_of", strength: 0.7, lastAt: "2025-02-01", note: "Led Series A" },
  { id: "e11", source: "c_vela", target: "c_meridian", kind: "part_of", strength: 0.6, lastAt: "2024-11-10", note: "Portfolio co" },

  // Location
  { id: "e12", source: "c_northwind", target: "pl_sf", kind: "located_in", strength: 0.8, lastAt: "2025-01-01" },
  { id: "e13", source: "c_meridian", target: "pl_nyc", kind: "located_in", strength: 0.8, lastAt: "2025-01-01" },
  { id: "e14", source: "c_halcyon", target: "pl_london", kind: "located_in", strength: 0.8, lastAt: "2025-01-01" },
  { id: "e15", source: "c_alyson", target: "pl_sf", kind: "located_in", strength: 1.0, lastAt: "2025-01-01" },
  { id: "e16", source: "c_vela", target: "pl_sf", kind: "located_in", strength: 0.9, lastAt: "2025-01-01" },

  // Ownership (owner AE / CSM inside Alyson)
  { id: "e17", source: "p_dev", target: "pr_northwind", kind: "owns", strength: 1.0, lastAt: "2025-03-22" },
  { id: "e18", source: "p_maya", target: "pr_meridian", kind: "owns", strength: 1.0, lastAt: "2025-03-22" },
  { id: "e19", source: "p_sara", target: "pr_halcyon", kind: "owns", strength: 1.0, lastAt: "2025-03-22" },

  // Project ↔ Company
  { id: "e20", source: "pr_northwind", target: "c_northwind", kind: "part_of", strength: 0.95, lastAt: "2025-03-22" },
  { id: "e21", source: "pr_meridian", target: "c_meridian", kind: "part_of", strength: 0.95, lastAt: "2025-03-22" },
  { id: "e22", source: "pr_halcyon", target: "c_halcyon", kind: "part_of", strength: 0.95, lastAt: "2025-03-22" },

  // Meetings
  { id: "e23", source: "p_dev", target: "m_nw_qbr", kind: "attended", strength: 0.9, lastAt: "2025-03-12" },
  { id: "e24", source: "p_lena", target: "m_nw_qbr", kind: "attended", strength: 0.9, lastAt: "2025-03-12" },
  { id: "e25", source: "p_theo", target: "m_nw_qbr", kind: "attended", strength: 0.7, lastAt: "2025-03-12" },
  { id: "e26", source: "m_nw_qbr", target: "pr_northwind", kind: "part_of", strength: 0.9, lastAt: "2025-03-12" },

  { id: "e27", source: "p_maya", target: "m_meridian_intro", kind: "attended", strength: 0.9, lastAt: "2025-03-04" },
  { id: "e28", source: "p_ravi", target: "m_meridian_intro", kind: "attended", strength: 0.9, lastAt: "2025-03-04" },
  { id: "e29", source: "p_marco", target: "m_meridian_intro", kind: "introduced_by", strength: 0.85, lastAt: "2025-03-04", note: "Warm intro" },
  { id: "e30", source: "m_meridian_intro", target: "pr_meridian", kind: "part_of", strength: 0.9, lastAt: "2025-03-04" },

  { id: "e31", source: "p_sara", target: "m_halcyon_sync", kind: "attended", strength: 0.95, lastAt: "2025-03-21" },
  { id: "e32", source: "p_juno", target: "m_halcyon_sync", kind: "attended", strength: 0.95, lastAt: "2025-03-21" },
  { id: "e33", source: "p_ines", target: "m_halcyon_sync", kind: "attended", strength: 0.8, lastAt: "2025-03-21" },
  { id: "e34", source: "m_halcyon_sync", target: "pr_halcyon", kind: "part_of", strength: 0.9, lastAt: "2025-03-21" },

  // Emails
  { id: "e35", source: "p_dev", target: "e_nw_pricing", kind: "emailed", strength: 0.8, lastAt: "2025-03-19", count: 5 },
  { id: "e36", source: "p_lena", target: "e_nw_pricing", kind: "emailed", strength: 0.8, lastAt: "2025-03-19", count: 3 },
  { id: "e37", source: "e_nw_pricing", target: "pr_northwind", kind: "part_of", strength: 0.8, lastAt: "2025-03-19" },

  { id: "e38", source: "p_maya", target: "e_meridian_partnership", kind: "emailed", strength: 0.85, lastAt: "2025-03-17", count: 3 },
  { id: "e39", source: "p_ravi", target: "e_meridian_partnership", kind: "emailed", strength: 0.85, lastAt: "2025-03-17", count: 1 },
  { id: "e40", source: "e_meridian_partnership", target: "pr_meridian", kind: "part_of", strength: 0.85, lastAt: "2025-03-17" },

  { id: "e41", source: "p_sara", target: "e_halcyon_renewal", kind: "emailed", strength: 0.9, lastAt: "2025-03-21", count: 7 },
  { id: "e42", source: "p_juno", target: "e_halcyon_renewal", kind: "emailed", strength: 0.9, lastAt: "2025-03-21", count: 5 },
  { id: "e43", source: "e_halcyon_renewal", target: "pr_halcyon", kind: "part_of", strength: 0.9, lastAt: "2025-03-21" },

  // Calls
  { id: "e44", source: "p_dev", target: "ph_lena", kind: "called", strength: 0.7, lastAt: "2025-03-18" },
  { id: "e45", source: "p_lena", target: "ph_lena", kind: "called", strength: 0.7, lastAt: "2025-03-18" },
  { id: "e46", source: "p_sara", target: "ph_juno", kind: "called", strength: 0.7, lastAt: "2025-03-20" },
  { id: "e47", source: "p_juno", target: "ph_juno", kind: "called", strength: 0.7, lastAt: "2025-03-20" },

  // Browser
  { id: "e48", source: "p_lena", target: "b_northwind_site", kind: "browsed", strength: 0.65, lastAt: "2025-03-22", count: 3 },
  { id: "e49", source: "b_northwind_site", target: "c_northwind", kind: "part_of", strength: 0.5, lastAt: "2025-03-22" },
  { id: "e50", source: "p_maya", target: "b_meridian_deck", kind: "browsed", strength: 0.7, lastAt: "2025-03-22", count: 2 },
  { id: "e51", source: "b_meridian_deck", target: "pr_meridian", kind: "part_of", strength: 0.5, lastAt: "2025-03-22" },
  { id: "e52", source: "p_ines", target: "b_halcyon_docs", kind: "browsed", strength: 0.75, lastAt: "2025-03-21", count: 6 },
  { id: "e53", source: "b_halcyon_docs", target: "c_halcyon", kind: "part_of", strength: 0.5, lastAt: "2025-03-21" },

  // Cross-company warm intros / met_with
  { id: "e54", source: "p_marco", target: "p_ravi", kind: "met_with", strength: 0.75, lastAt: "2024-12-11", note: "Vela portfolio dinner" },
  { id: "e55", source: "p_marco", target: "p_maya", kind: "met_with", strength: 0.8, lastAt: "2025-01-22" },
  { id: "e56", source: "p_lena", target: "p_juno", kind: "met_with", strength: 0.45, lastAt: "2024-10-04", note: "Ex-colleagues at Stripe" },
];

// --------------------------------------------------------------------
// Communication timeline (recent activity)
// --------------------------------------------------------------------

export const COMMS: CommEvent[] = [
  { id: "c1", at: "2025-03-22T14:12:00Z", channel: "browser", fromId: "p_lena", toId: "b_northwind_site", subject: "Viewed pricing page (3rd time)" },
  { id: "c2", at: "2025-03-22T11:04:00Z", channel: "email", fromId: "p_lena", toId: "p_dev", subject: "Re: pricing memo — final questions" },
  { id: "c3", at: "2025-03-21T17:45:00Z", channel: "meeting", fromId: "p_sara", toId: "p_juno", subject: "Halcyon weekly sync", durationMin: 30 },
  { id: "c4", at: "2025-03-21T09:22:00Z", channel: "email", fromId: "p_sara", toId: "p_juno", subject: "Renewal draft v4" },
  { id: "c5", at: "2025-03-20T16:00:00Z", channel: "call", fromId: "p_sara", toId: "p_juno", subject: "Renewal negotiation", durationMin: 14 },
  { id: "c6", at: "2025-03-19T13:10:00Z", channel: "email", fromId: "p_dev", toId: "p_lena", subject: "Pricing memo — updated" },
  { id: "c7", at: "2025-03-18T15:30:00Z", channel: "call", fromId: "p_dev", toId: "p_lena", subject: "Northwind pilot check-in", durationMin: 22 },
  { id: "c8", at: "2025-03-17T10:00:00Z", channel: "email", fromId: "p_maya", toId: "p_ravi", subject: "Partnership terms v3" },
  { id: "c9", at: "2025-03-12T14:00:00Z", channel: "meeting", fromId: "p_dev", toId: "p_lena", subject: "Northwind QBR", durationMin: 45 },
  { id: "c10", at: "2025-03-04T15:30:00Z", channel: "meeting", fromId: "p_maya", toId: "p_ravi", subject: "Meridian intro (Marco)", durationMin: 30 },
];

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

export const KIND_LABEL: Record<IdentityKind, string> = {
  person: "Person",
  company: "Company",
  place: "Place",
  project: "Project",
  meeting: "Meeting",
  email: "Email",
  phone: "Call",
  browser: "Browser",
};

export const EDGE_LABEL: Record<EdgeKind, string> = {
  works_at: "works at",
  located_in: "located in",
  attended: "attended",
  emailed: "emailed",
  called: "called",
  browsed: "browsed",
  owns: "owns",
  part_of: "part of",
  met_with: "met with",
  introduced_by: "intro’d by",
};

export function getNode(id: string): IdentityNode | undefined {
  return NODES.find((n) => n.id === id);
}

export function neighborsOf(id: string, kinds?: Set<IdentityKind>): {
  node: IdentityNode;
  edge: IdentityEdge;
}[] {
  const out: { node: IdentityNode; edge: IdentityEdge }[] = [];
  for (const e of EDGES) {
    let otherId: string | null = null;
    if (e.source === id) otherId = e.target;
    else if (e.target === id) otherId = e.source;
    if (!otherId) continue;
    const n = getNode(otherId);
    if (!n) continue;
    if (kinds && !kinds.has(n.kind)) continue;
    out.push({ node: n, edge: e });
  }
  // strongest first
  out.sort((a, b) => b.edge.strength - a.edge.strength);
  return out;
}

// Shared connections between two nodes (mutual neighbors)
export function sharedNeighbors(aId: string, bId: string): IdentityNode[] {
  const a = new Set(neighborsOf(aId).map((n) => n.node.id));
  const shared: IdentityNode[] = [];
  for (const { node } of neighborsOf(bId)) {
    if (a.has(node.id)) shared.push(node);
  }
  return shared;
}

// BFS shortest path (warm intro chain)
export function shortestPath(fromId: string, toId: string): IdentityNode[] | null {
  if (fromId === toId) {
    const n = getNode(fromId);
    return n ? [n] : null;
  }
  const prev = new Map<string, string | null>();
  prev.set(fromId, null);
  const queue = [fromId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    for (const { node } of neighborsOf(cur)) {
      if (!prev.has(node.id)) {
        prev.set(node.id, cur);
        queue.push(node.id);
      }
    }
  }
  if (!prev.has(toId)) return null;
  const path: string[] = [];
  let cur: string | null = toId;
  while (cur) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return path.map((id) => getNode(id)!).filter(Boolean);
}

export function edgeBetween(aId: string, bId: string): IdentityEdge | undefined {
  return EDGES.find(
    (e) =>
      (e.source === aId && e.target === bId) ||
      (e.source === bId && e.target === aId),
  );
}

export function commsFor(id: string): CommEvent[] {
  return COMMS.filter((c) => c.fromId === id || c.toId === id).sort(
    (a, b) => +new Date(b.at) - +new Date(a.at),
  );
}

// Aggregate "relationship strength" between an anchor person and another node
// as a blend of edge strength, communication count, and recency.
export function relationshipStrength(anchorId: string, otherId: string): number {
  const direct = edgeBetween(anchorId, otherId);
  const comms = COMMS.filter(
    (c) =>
      (c.fromId === anchorId && c.toId === otherId) ||
      (c.fromId === otherId && c.toId === anchorId),
  );
  const base = direct ? direct.strength : 0;
  const commBoost = Math.min(0.4, comms.length * 0.08);
  const recency = comms.length
    ? Math.max(
        0,
        1 -
          (Date.now() - +new Date(comms[0]!.at)) /
            (1000 * 60 * 60 * 24 * 90),
      ) * 0.15
    : 0;
  return Math.min(1, base + commBoost + recency);
}
