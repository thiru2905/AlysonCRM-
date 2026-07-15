import { RUNTIME_EXTENSION_CAPS } from "@/lib/runtime/config";

export function RuntimeExtensionPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h3 className="text-sm font-medium">Extension capabilities</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {RUNTIME_EXTENSION_CAPS.map((cap) => (
          <div key={cap.label} className="rounded-lg border border-border/60 p-3">
            <cap.icon className="h-4 w-4 mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{cap.label}</p>
            <p className="text-xs text-muted-foreground">{cap.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
