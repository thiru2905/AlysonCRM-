import { Chrome, Cpu, ShieldCheck } from "lucide-react";
import { RUNTIME_PILLARS, RUNTIME_VERSION } from "@/lib/runtime/config";
import { Badge } from "@/components/ui/badge";
import { useDesktopAgent } from "@/hooks/use-desktop-agent";

export function RuntimeHero() {
  const { crmStatus, runtimeOnline } = useDesktopAgent();

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Alyson Desktop Agent
          </p>
          <h1 className="text-display text-2xl mt-1">Your AI employee, on your machine</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Chrome automation, MCP browser tools, and secure device pairing — all running
            locally under your control.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline">v{RUNTIME_VERSION}</Badge>
          <Badge className={runtimeOnline ? "bg-emerald-600" : ""}>
            {runtimeOnline ? "Online" : "Offline"}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">{crmStatus.replace(/_/g, " ")}</span>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {RUNTIME_PILLARS.map((pillar) => (
          <div key={pillar.label} className="rounded-lg border border-border/70 p-4">
            <pillar.icon className="h-4 w-4 text-primary mb-2" />
            <p className="text-sm font-medium">{pillar.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{pillar.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Chrome className="h-3.5 w-3.5" />
        <Cpu className="h-3.5 w-3.5" />
        <ShieldCheck className="h-3.5 w-3.5" />
        Dedicated Alyson Chrome profile · localhost-only debugging
      </div>
    </section>
  );
}
