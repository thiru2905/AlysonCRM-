import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createCampaignFn,
  listCampaignsFn,
  listProspectsFn,
  startAutomationFn,
} from "@/lib/agent/server";
import { Megaphone, Plus, Search } from "lucide-react";
import { notifyDone } from "@/lib/actions";

export const Route = createFileRoute("/outreach")({
  component: OutreachView,
});

function OutreachView() {
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("SaaS founders in USA");
  const qc = useQueryClient();

  const campaigns = useQuery({
    queryKey: ["linkedin-campaigns"],
    queryFn: () => listCampaignsFn(),
  });

  const prospects = useQuery({
    queryKey: ["linkedin-prospects"],
    queryFn: () => listProspectsFn({ data: {} }),
    refetchInterval: 10_000,
  });

  async function handleCreateCampaign() {
    if (!name.trim()) return;
    await createCampaignFn({
      data: { name: name.trim(), targetAudience: audience, dailyLimit: 25 },
    });
    setName("");
    await qc.invalidateQueries({ queryKey: ["linkedin-campaigns"] });
    notifyDone("Campaign created", name);
  }

  async function handleFindProspects() {
    const runId = await startAutomationFn({
      data: { prompt: `Find LinkedIn ${audience} and save as prospects` },
    });
    notifyDone("Prospect search started", runId);
  }

  return (
    <PageContainer
      title="LinkedIn Outreach"
      description="Campaigns, prospects, sequences, and approval-gated outreach actions."
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <h2 className="text-sm font-medium">New campaign</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Campaign name"
            />
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Target audience"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateCampaign}>
              <Plus className="h-4 w-4" />
              Create campaign
            </Button>
            <Button variant="secondary" onClick={handleFindProspects}>
              <Search className="h-4 w-4" />
              Find prospects with Alyson
            </Button>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Campaigns</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(campaigns.data ?? []).map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{c.name}</p>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{c.targetAudience}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Daily limit: {c.dailyLimit} · {c.sequence.length} sequence steps
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Prospects</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Company</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(prospects.data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.title ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.company ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
