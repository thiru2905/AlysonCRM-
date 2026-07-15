import { useCallback, useEffect, useState } from "react";
import {
  RUNTIME_HEALTH_URL,
  RUNTIME_POLL_MS,
  RUNTIME_VERSION,
} from "@/lib/runtime/config";
import { getDeviceStatusFn } from "@/lib/agent/server";

export type DesktopInstallState =
  | "not_installed"
  | "downloading"
  | "installed"
  | "waiting_for_pairing"
  | "connected"
  | "disconnected"
  | "update_required"
  | "failed";

export function useDesktopAgent() {
  const [runtimeOnline, setRuntimeOnline] = useState(false);
  const [crmStatus, setCrmStatus] = useState<DesktopInstallState>("not_installed");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const health = await fetch(RUNTIME_HEALTH_URL, { signal: AbortSignal.timeout(3000) })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      setRuntimeOnline(Boolean(health?.ok));

      const status = await getDeviceStatusFn();
      if (status.device?.status === "connected" && health?.paired) {
        setCrmStatus("connected");
      } else if (health?.ok && !health?.paired) {
        setCrmStatus("waiting_for_pairing");
      } else if (health?.ok) {
        setCrmStatus("disconnected");
      } else if (status.status === "not_installed") {
        setCrmStatus("not_installed");
      } else {
        setCrmStatus("disconnected");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), RUNTIME_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    runtimeOnline,
    crmStatus,
    pairingCode,
    setPairingCode,
    runtimeVersion: RUNTIME_VERSION,
    loading,
    refresh,
    needsOnboarding:
      crmStatus === "not_installed" ||
      crmStatus === "disconnected" ||
      crmStatus === "waiting_for_pairing",
  };
}
