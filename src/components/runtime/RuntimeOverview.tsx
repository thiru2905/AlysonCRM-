import { useDesktopAgent } from "@/hooks/use-desktop-agent";
import { listDevicesFn } from "@/lib/agent/server";
import { useQuery } from "@tanstack/react-query";

export function RuntimeOverview() {
  const { runtimeOnline, crmStatus } = useDesktopAgent();
  const devices = useQuery({
    queryKey: ["desktop-devices"],
    queryFn: () => listDevicesFn(),
    refetchInterval: 15_000,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Runtime", value: runtimeOnline ? "Online" : "Offline" },
        { label: "CRM device", value: crmStatus.replace(/_/g, " ") },
        { label: "Paired devices", value: String(devices.data?.length ?? 0) },
        { label: "Browser agent", value: "localhost:8820" },
      ].map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-lg font-medium mt-1 capitalize">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
