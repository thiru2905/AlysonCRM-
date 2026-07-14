import { EntityPanel, ProvenanceTag, formatRelative } from "./EntityPanel";
import { EntityChip } from "./EntityChip";
import { entityMeta } from "@/lib/entities/registry";
import type {
  ActivityEvent,
  Entity,
  EntityRef,
  FileRef,
  HistoryEntry,
  KnowledgeRef,
  Prediction,
  Relationship,
  Score,
  TimelineEvent,
} from "@/lib/entities/types";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Mail,
  Phone,
  StickyNote,
  MessageSquare,
  Upload,
  Globe,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export function SummaryPanel({ entity }: { entity: Entity }) {
  const s = entity.aiSummary;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <EntityPanel
          title="AI Summary"
          hint={s?.stale ? "Signals have changed. Refresh to update." : undefined}
          actions={
            <button
              type="button"
              onClick={() => import("@/lib/actions").then((m) => m.notifyDone("Summary refreshed"))}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          }
        >
          {s ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-md ai-gradient-bg shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug font-medium">{s.headline}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                    {s.body}
                  </p>
                </div>
              </div>
              {s.bullets && (
                <ul className="space-y-1.5 pl-10">
                  {s.bullets.map((b) => (
                    <li key={b} className="text-sm text-foreground/85 flex gap-2">
                      <span className="mt-2 h-1 w-1 rounded-full bg-ai shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="pl-10 pt-1">
                <ProvenanceTag {...s.provenance} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No summary yet.</p>
          )}
        </EntityPanel>

        <RelatedMiniList label="Projects" items={entity.projects} />
      </div>

      <div className="space-y-4">
        <ScoresPanel entity={entity} compact />
        <PredictionsPanel entity={entity} compact />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

const TIMELINE_ICON: Record<TimelineEvent["kind"], LucideIcon> = {
  created: Sparkles,
  message: MessageSquare,
  meeting: MessageSquare,
  call: Phone,
  note: StickyNote,
  status_change: RefreshCw,
  task: FileText,
  worker_action: Sparkles,
  approval: Sparkles,
  file: FileText,
};

export function TimelinePanel({ entity }: { entity: Entity }) {
  return (
    <EntityPanel title="Timeline" hint="Everything that happened, in order.">
      <ol className="relative">
        <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" aria-hidden />
        {entity.timeline.map((ev) => {
          const Icon = TIMELINE_ICON[ev.kind] ?? Sparkles;
          const isWorker = ev.provenance.source === "worker";
          return (
            <li key={ev.id} className="relative pl-8 py-2.5">
              <span
                className={cn(
                  "absolute left-0 top-3.5 h-[22px] w-[22px] rounded-full grid place-items-center border",
                  isWorker
                    ? "bg-ai-soft border-transparent text-ai"
                    : "bg-card border-border text-muted-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
              </span>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{ev.title}</div>
                  {ev.detail && (
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {ev.detail}
                    </div>
                  )}
                  <div className="mt-1.5">
                    <ProvenanceTag {...ev.provenance} at={ev.at} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </EntityPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Relationships                                                       */
/* ------------------------------------------------------------------ */

export function RelationshipsPanel({ entity }: { entity: Entity }) {
  const groups = entity.relationships.reduce<Record<string, Relationship[]>>((acc, r) => {
    (acc[r.kind] ??= []).push(r);
    return acc;
  }, {});
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([kind, rels]) => (
        <EntityPanel key={kind} title={humanKind(kind)} padded={false}>
          <ul>
            {rels.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0">
                <EntityChip entity={r.to} />
                <div className="flex-1" />
                {typeof r.strength === "number" && (
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {Math.round(r.strength * 100)}%
                  </span>
                )}
                <ProvenanceTag {...r.provenance} />
              </li>
            ))}
          </ul>
        </EntityPanel>
      ))}
      {entity.relationships.length === 0 && (
        <EntityPanel><EmptyMuted text="No relationships yet." /></EntityPanel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Knowledge                                                           */
/* ------------------------------------------------------------------ */

const KNOWLEDGE_ICON: Record<KnowledgeRef["sourceType"], LucideIcon> = {
  doc: BookOpen,
  email: Mail,
  call: Phone,
  note: StickyNote,
  web: Globe,
  upload: Upload,
  chat: MessageSquare,
};

export function KnowledgePanel({ entity }: { entity: Entity }) {
  return (
    <EntityPanel title="Knowledge" hint="Sources of truth referenced for this entity." padded={false}>
      <ul>
        {entity.knowledge.map((k) => {
          const Icon = KNOWLEDGE_ICON[k.sourceType];
          return (
            <li key={k.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/60 last:border-b-0">
              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{k.title}</div>
                {k.excerpt && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {k.excerpt}
                  </div>
                )}
                <div className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">
                  {k.sourceType} · updated {formatRelative(k.updatedAt)}
                  {typeof k.trust === "number" && ` · trust ${Math.round(k.trust * 100)}%`}
                </div>
              </div>
            </li>
          );
        })}
        {entity.knowledge.length === 0 && <EmptyMuted text="No knowledge attached." />}
      </ul>
    </EntityPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

export function ScoresPanel({ entity, compact }: { entity: Entity; compact?: boolean }) {
  return (
    <EntityPanel title="Scores" hint={compact ? undefined : "Signals the OS computes for this entity."}>
      <ul className="space-y-3">
        {entity.scores.map((s) => (
          <ScoreRow key={s.key} score={s} />
        ))}
        {entity.scores.length === 0 && <EmptyMuted text="No scores yet." />}
      </ul>
    </EntityPanel>
  );
}

function ScoreRow({ score }: { score: Score }) {
  const TrendIcon = score.trend === "up" ? ArrowUpRight : score.trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    score.trend === "up" ? "text-success" :
    score.trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <li>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium">{score.label}</span>
        <div className="flex-1" />
        <span className="text-mono text-xs">{Math.round(score.value)}</span>
        {score.trend && (
          <span className={cn("inline-flex items-center gap-0.5 text-[10px]", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {typeof score.delta === "number" && <span>{score.delta > 0 ? "+" : ""}{score.delta}</span>}
          </span>
        )}
      </div>
      <div className="relative h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 ai-gradient-bg rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, score.value))}%` }}
        />
      </div>
      {score.hint && <div className="text-[11px] text-muted-foreground mt-1">{score.hint}</div>}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Predictions                                                         */
/* ------------------------------------------------------------------ */

export function PredictionsPanel({ entity, compact }: { entity: Entity; compact?: boolean }) {
  return (
    <EntityPanel title="Predictions" hint={compact ? undefined : "Forecasts, with confidence and drivers."}>
      <ul className="space-y-3">
        {entity.predictions.map((p) => (
          <PredictionRow key={p.id} prediction={p} />
        ))}
        {entity.predictions.length === 0 && <EmptyMuted text="No predictions yet." />}
      </ul>
    </EntityPanel>
  );
}

function PredictionRow({ prediction }: { prediction: Prediction }) {
  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 text-ai mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{prediction.question}</div>
          <div className="text-display text-lg mt-0.5 ai-gradient-text">{prediction.answer}</div>
        </div>
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {Math.round(prediction.confidence * 100)}% · {prediction.horizon ?? "—"}
        </span>
      </div>
      {prediction.drivers && prediction.drivers.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prediction.drivers.map((d) => (
            <span key={d} className="text-[10px] px-1.5 h-4 inline-flex items-center rounded bg-accent text-foreground/80">
              {d}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

export function FilesPanel({ entity }: { entity: Entity }) {
  return (
    <EntityPanel title="Files" padded={false}>
      <ul>
        {entity.files.map((f) => (
          <FileRow key={f.id} file={f} />
        ))}
        {entity.files.length === 0 && <EmptyMuted text="No files uploaded." />}
      </ul>
    </EntityPanel>
  );
}

function FileRow({ file }: { file: FileRef }) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">{file.name}</div>
        <div className="text-[10px] text-mono uppercase tracking-wider text-muted-foreground">
          {file.mime} · {formatBytes(file.sizeBytes)} · {formatRelative(file.uploadedAt)}
        </div>
      </div>
      <EntityChip entity={file.uploadedBy} />
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

export function ActivityPanel({ entity }: { entity: Entity }) {
  return (
    <EntityPanel title="Activity" hint="Who touched this, and how.">
      <ul className="space-y-2.5">
        {entity.activity.map((a: ActivityEvent) => (
          <li key={a.id} className="flex items-center gap-2 text-sm">
            <EntityChip entity={a.actor} />
            <span className="text-muted-foreground">{a.verb}</span>
            {a.target && <span className="truncate">{a.target}</span>}
            <div className="flex-1" />
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {formatRelative(a.at)}
            </span>
          </li>
        ))}
        {entity.activity.length === 0 && <EmptyMuted text="No recorded activity." />}
      </ul>
    </EntityPanel>
  );
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

export function HistoryPanel({ entity }: { entity: Entity }) {
  return (
    <EntityPanel title="History" hint="Field-level audit log.">
      <ul className="divide-y divide-border/60 -my-2">
        {entity.history.map((h: HistoryEntry) => (
          <li key={h.id} className="py-2.5 flex items-center gap-3">
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground w-24 shrink-0">
              {h.field}
            </span>
            <span className="text-xs text-muted-foreground line-through truncate max-w-[140px]">
              {String(h.from ?? "—")}
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="text-xs truncate max-w-[220px]">{String(h.to ?? "—")}</span>
            <div className="flex-1" />
            <EntityChip entity={h.actor} />
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {formatRelative(h.at)}
            </span>
          </li>
        ))}
        {entity.history.length === 0 && <EmptyMuted text="No changes recorded." />}
      </ul>
    </EntityPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Related lists (Projects / Tasks / Experiments)                      */
/* ------------------------------------------------------------------ */

export function RelatedListPanel({
  label,
  items,
  emptyHint,
}: {
  label: string;
  items: EntityRef[];
  emptyHint?: string;
}) {
  return (
    <EntityPanel title={label} padded={false}>
      <ul>
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0">
            <EntityChip entity={it} />
            <div className="flex-1" />
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </li>
        ))}
        {items.length === 0 && <EmptyMuted text={emptyHint ?? `No ${label.toLowerCase()} linked.`} />}
      </ul>
    </EntityPanel>
  );
}

function RelatedMiniList({ label, items }: { label: string; items: EntityRef[] }) {
  if (items.length === 0) return null;
  return (
    <EntityPanel title={label} padded={false}>
      <ul>
        {items.slice(0, 4).map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-b-0">
            <EntityChip entity={it} />
            <div className="flex-1" />
            <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {entityMeta(it.kind).label}
            </span>
          </li>
        ))}
      </ul>
    </EntityPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function humanKind(k: string): string {
  return k.split("_").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function EmptyMuted({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-xs text-muted-foreground">{text}</div>;
}
