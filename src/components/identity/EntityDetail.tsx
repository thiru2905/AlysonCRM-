import { useMemo } from "react";
import { KIND_ICON, KIND_TONE } from "./kind-visual";
import {
  EDGE_LABEL,
  commsFor,
  edgeBetween,
  neighborsOf,
  relationshipStrength,
  sharedNeighbors,
  shortestPath,
  getNode,
  type IdentityNode,
  KIND_LABEL,
} from "@/lib/identity/data";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

const CHANNEL_ICON = {
  email: KIND_ICON.email,
  call: KIND_ICON.phone,
  meeting: KIND_ICON.meeting,
  browser: KIND_ICON.browser,
  slack: KIND_ICON.email,
} as const;

interface Props {
  node: IdentityNode;
  onFocus: (id: string) => void;
}

export function EntityDetail({ node, onFocus }: Props) {
  const tone = KIND_TONE[node.kind];
  const Icon = KIND_ICON[node.kind];
  const neighbors = useMemo(() => neighborsOf(node.id), [node.id]);
  const owner = node.ownerId ? getNode(node.ownerId) : undefined;
  const comms = useMemo(() => commsFor(node.id).slice(0, 8), [node.id]);

  // Shared contacts / companies for people
  const shared = useMemo(() => {
    if (node.kind !== "person") return null;
    // pick top-strength other person to compare
    const otherPeople = neighborsOf(node.id).filter(
      (n) => n.node.kind === "person",
    );
    const target = otherPeople[0]?.node;
    if (!target) return null;
    const s = sharedNeighbors(node.id, target.id);
    return { with: target, nodes: s };
  }, [node.id, node.kind]);

  // Warm intro path — from an "us" node to this person
  const warm = useMemo(() => {
    if (node.kind !== "person" || node.handle?.endsWith("@alyson.os"))
      return null;
    const path = shortestPath("p_maya", node.id);
    if (!path || path.length < 2) return null;
    return path;
  }, [node.id, node.kind, node.handle]);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-md flex items-center justify-center ring-1",
              tone.bg,
              tone.ring,
            )}
          >
            <Icon className={cn("h-5 w-5", tone.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {KIND_LABEL[node.kind]}
            </div>
            <div className="text-display text-base leading-tight truncate">
              {node.label}
            </div>
            {node.sublabel && (
              <div className="text-xs text-muted-foreground truncate">
                {node.sublabel}
              </div>
            )}
          </div>
        </div>

        {owner && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Owned by</span>
            <button
              onClick={() => onFocus(owner.id)}
              className="text-foreground hover:text-ai transition"
            >
              {owner.label}
            </button>
          </div>
        )}
      </div>

      {/* Warm intro */}
      {warm && (
        <Section title="Warm introduction" eyebrow="Path">
          <div className="flex flex-wrap items-center gap-1.5">
            {warm.map((p, i) => (
              <span key={p.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => onFocus(p.id)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] surface-hairline hover:bg-accent transition",
                    KIND_TONE[p.kind].text,
                  )}
                >
                  {p.label}
                </button>
                {i < warm.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {warm.length - 1} hop{warm.length - 1 === 1 ? "" : "s"} · shortest
            path via mutual connections.
          </p>
        </Section>
      )}

      {/* Relationships */}
      <Section title="Relationships" eyebrow={`${neighbors.length} links`}>
        <ul className="space-y-1">
          {neighbors.slice(0, 12).map(({ node: n, edge }) => {
            const t = KIND_TONE[n.kind];
            const NIcon = KIND_ICON[n.kind];
            const strength =
              node.kind === "person" && n.kind === "person"
                ? relationshipStrength(node.id, n.id)
                : edge.strength;
            return (
              <li key={edge.id}>
                <button
                  onClick={() => onFocus(n.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition group"
                >
                  <NIcon className={cn("h-3.5 w-3.5 shrink-0", t.text)} />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-xs truncate">{n.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {EDGE_LABEL[edge.kind]}
                      {edge.note ? ` · ${edge.note}` : ""}
                    </div>
                  </div>
                  <StrengthBar value={strength} />
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Shared contacts / companies */}
      {shared && (
        <Section
          title="Shared connections"
          eyebrow={`with ${shared.with.label}`}
        >
          {shared.nodes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No mutual connections yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shared.nodes.map((s) => {
                const t = KIND_TONE[s.kind];
                const SIcon = KIND_ICON[s.kind];
                return (
                  <button
                    key={s.id}
                    onClick={() => onFocus(s.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] surface-hairline hover:bg-accent transition",
                    )}
                  >
                    <SIcon className={cn("h-3 w-3", t.text)} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* Communication history */}
      <Section title="Communication history" eyebrow="Timeline">
        {comms.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No direct communication recorded.
          </p>
        ) : (
          <ol className="relative ml-2 border-l border-border/60 space-y-2 pl-3">
            {comms.map((c) => {
              const CIcon = CHANNEL_ICON[c.channel];
              const other = c.fromId === node.id ? c.toId : c.fromId;
              const otherNode = getNode(other);
              return (
                <li key={c.id} className="relative">
                  <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-border-strong" />
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CIcon className="h-3 w-3" />
                    <span className="uppercase tracking-[0.1em]">
                      {c.channel}
                    </span>
                    <span>·</span>
                    <span>{formatDate(c.at)}</span>
                  </div>
                  <div className="text-xs mt-0.5">{c.subject}</div>
                  {otherNode && (
                    <button
                      onClick={() => onFocus(otherNode.id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition"
                    >
                      with {otherNode.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      {/* Alyson prompt */}
      <div className="px-4 py-3 mt-auto border-t border-border/60">
        <div className="flex items-start gap-2 rounded-md surface-hairline p-2.5 bg-ai/5">
          <Sparkles className="h-3.5 w-3.5 text-ai mt-0.5 shrink-0" />
          <div className="text-[11px] text-muted-foreground leading-snug">
            Ask Alyson:{" "}
            <span className="text-foreground">
              "Draft a warm intro to {node.label}."
            </span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground mt-0.5" />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-b border-border/60">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </div>
        {eyebrow && (
          <div className="text-[10px] text-muted-foreground/70">{eyebrow}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function StrengthBar({ value }: { value: number }) {
  return (
    <div className="w-10 h-1 rounded-full bg-muted overflow-hidden shrink-0">
      <div
        className="h-full bg-ai/70"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diffH < 24) return `${Math.max(1, Math.round(diffH))}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
