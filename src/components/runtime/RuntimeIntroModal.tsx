import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDesktopAgent } from "@/hooks/use-desktop-agent";
import { createPairingCodeFn, getDesktopInstallInfoFn } from "@/lib/agent/server";
import {
  detectOs,
  RUNTIME_DOWNLOADS,
  RUNTIME_HEALTH_URL,
} from "@/lib/runtime/config";
import { Download, Link2, RefreshCcw, Terminal } from "lucide-react";
import { notifyDone } from "@/lib/actions";

const STATE_LABEL: Record<string, string> = {
  not_installed: "Not Installed",
  downloading: "Downloading",
  installed: "Installed",
  waiting_for_pairing: "Waiting For Pairing",
  connected: "Connected",
  disconnected: "Disconnected",
  update_required: "Update Required",
  failed: "Failed",
};

async function pairDesktopAgent(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("http://127.0.0.1:8787/alyson/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: body || `Pairing failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Desktop agent is not running. Run the installer script first.",
    };
  }
}

export function RuntimeIntroModal() {
  const {
    crmStatus,
    runtimeOnline,
    needsOnboarding,
    refresh,
    pairingCode,
    setPairingCode,
  } = useDesktopAgent();
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [pairing, setPairing] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const os = detectOs();
  const download =
    RUNTIME_DOWNLOADS.find((d) => d.os === os && d.filename.endsWith(".bat")) ??
    RUNTIME_DOWNLOADS.find((d) => d.os === os) ??
    RUNTIME_DOWNLOADS[0];

  useEffect(() => {
    if (needsOnboarding) setOpen(true);
  }, [needsOnboarding]);

  useEffect(() => {
    if (crmStatus === "connected") setOpen(false);
  }, [crmStatus]);

  async function handleConnectDevice() {
    setPairing(true);
    setPairError(null);
    try {
      const result = await createPairingCodeFn();
      setPairingCode(result.code);
      setManualCode(result.code);

      if (runtimeOnline) {
        const paired = await pairDesktopAgent(result.code);
        if (paired.ok) {
          notifyDone("Device connected", "Desktop agent paired with Alyson.");
          setOpen(false);
          void refresh();
          return;
        }
        setPairError(paired.error ?? "Could not pair automatically.");
      } else {
        setPairError(
          "Desktop agent is offline. Download and run the installer, then click Connect Device again."
        );
      }
      notifyDone("Pairing code ready", result.code);
    } finally {
      setPairing(false);
    }
  }

  async function handlePairWithCode() {
    if (!manualCode.trim()) return;
    setPairing(true);
    setPairError(null);
    const paired = await pairDesktopAgent(manualCode);
    setPairing(false);
    if (paired.ok) {
      notifyDone("Device paired", "Desktop agent connected to Alyson.");
      setOpen(false);
      void refresh();
      return;
    }
    setPairError(paired.error ?? "Pairing failed.");
  }

  function handleDownload() {
    window.location.assign(download.url);
    notifyDone(
      "Installer downloading",
      "Run the downloaded .bat file, keep the window open, then click Connect Device."
    );
  }

  async function copyDevCommand() {
    const info = await getDesktopInstallInfoFn();
    void navigator.clipboard.writeText(info.devCommand);
    notifyDone("Copied", "Paste in a terminal to start the desktop agent.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Install Alyson Desktop Agent</DialogTitle>
          <DialogDescription>
            Install Alyson Desktop Agent to allow Alyson to safely perform browser
            tasks from your computer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{STATE_LABEL[crmStatus] ?? crmStatus}</Badge>
          {runtimeOnline ? (
            <Badge className="bg-emerald-600">Runtime online</Badge>
          ) : (
            <Badge variant="destructive">Runtime offline</Badge>
          )}
        </div>

        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Run the start script (see commands below) and keep the terminal open.</li>
          <li>Wait until status shows <strong>Runtime online</strong>.</li>
          <li>Click <strong>Connect Device</strong> to pair automatically.</li>
        </ol>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono space-y-1">
          <p className="text-muted-foreground font-sans text-[11px] mb-1">CMD (note the /d — switches to D: drive)</p>
          <p>cd /d &quot;D:\agentic\thiru\alyson-recruiter\alysonCRM+\desktop&quot;</p>
          <p>npm run start</p>
        </div>

        {pairingCode && (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground mb-1">Pairing code</p>
            <p className="text-2xl font-mono tracking-widest">{pairingCode}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Expires in 5 minutes. Desktop agent exchanges this with Alyson CRM.
            </p>
          </div>
        )}

        {pairError && (
          <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/5 p-3">
            {pairError}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Pairing code (optional manual entry)</label>
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="8-character code"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Health: {RUNTIME_HEALTH_URL}
        </p>

        <DialogFooter className="flex-wrap gap-2 sm:justify-start">
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download Agent
          </Button>
          <Button variant="outline" onClick={copyDevCommand}>
            <Terminal className="h-4 w-4" />
            Copy dev command
          </Button>
          <Button variant="secondary" onClick={handleConnectDevice} disabled={pairing}>
            <Link2 className="h-4 w-4" />
            {pairing ? "Connecting…" : "Connect Device"}
          </Button>
          {manualCode && (
            <Button onClick={handlePairWithCode} disabled={pairing}>
              Pair with code
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => void refresh()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
