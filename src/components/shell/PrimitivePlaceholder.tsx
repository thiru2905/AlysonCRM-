import type { LucideIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shell/Page";
import { Sparkles } from "lucide-react";

export function PrimitivePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  points,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
}) {
  return (
    <PageContainer>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-10 grid md:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 min-h-[360px] flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-xl bg-accent grid place-items-center mb-4">
            <Icon className="h-5 w-5 text-ai" />
          </div>
          <h3 className="text-display text-lg">Surface reserved for {eyebrow.toLowerCase()}.</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            The platform shell is in place. App-specific views (CRM, ATS, Success, Marketing,
            Real Estate, Mortgage, Insurance) will render here on top of the same primitive.
          </p>
        </div>
        <aside className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground text-mono">
            <Sparkles className="h-3 w-3 text-ai" />
            What this primitive does
          </div>
          <ul className="mt-3 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="text-sm text-foreground/85 leading-relaxed flex gap-2">
                <span className="mt-2 h-1 w-1 rounded-full bg-ai shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </PageContainer>
  );
}
