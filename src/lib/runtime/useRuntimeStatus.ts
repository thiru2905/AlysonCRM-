import { useEffect, useRef, useState } from "react";
import { RUNTIME_HEALTH_URL, RUNTIME_POLL_MS, RUNTIME_VERSION } from "./config";

export type RuntimeState = "checking" | "connected" | "not_installed" | "disconnected";

export interface RuntimeStatus {
  state: RuntimeState;
  version?: string;
  mocked: boolean;
  lastCheckedAt?: number;
  refresh: () => void;
}

const MOCK_QUERY_KEY = "runtime";
const MOCK_STORAGE_KEY = "alyson.runtime.mock";

function readMockFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const search = new URLSearchParams(window.location.search);
    if (search.get(MOCK_QUERY_KEY) === "mock") {
      window.localStorage.setItem(MOCK_STORAGE_KEY, "1");
      return true;
    }
    if (search.get(MOCK_QUERY_KEY) === "off") {
      window.localStorage.removeItem(MOCK_STORAGE_KEY);
      return false;
    }
    return window.localStorage.getItem(MOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRuntimeMock(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) window.localStorage.setItem(MOCK_STORAGE_KEY, "1");
    else window.localStorage.removeItem(MOCK_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("alyson-runtime-mock-change"));
  } catch {
    /* ignore */
  }
}

async function ping(): Promise<{ ok: boolean; version?: string }> {
  if (typeof window === "undefined") return { ok: false };
  try {
    // AbortSignal.timeout may not exist in every runtime — fall back to a manual controller.
    let signal: AbortSignal;
    const abortSignalCtor = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal };
    if (typeof abortSignalCtor.timeout === "function") {
      signal = abortSignalCtor.timeout(800);
    } else {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 800);
      signal = ctrl.signal;
    }
    const res = await fetch(RUNTIME_HEALTH_URL, {
      method: "GET",
      mode: "cors",
      signal,
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json().catch(() => ({}))) as { version?: string };
    return { ok: true, version: data.version };
  } catch {
    return { ok: false };
  }
}

/**
 * Polls the local Alyson Runtime health endpoint and returns its state.
 * A `?runtime=mock` URL flag (persisted in localStorage) forces a
 * connected preview state for design and demos.
 */
export function useRuntimeStatus(): RuntimeStatus {
  const [mocked, setMocked] = useState<boolean>(() => readMockFlag());
  const [state, setState] = useState<RuntimeState>("checking");
  const [version, setVersion] = useState<string | undefined>();
  const [lastCheckedAt, setLastCheckedAt] = useState<number | undefined>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onChange = () => setMocked(readMockFlag());
    window.addEventListener("alyson-runtime-mock-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("alyson-runtime-mock-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const check = async () => {
    if (mocked) {
      setState("connected");
      setVersion(RUNTIME_VERSION);
      setLastCheckedAt(Date.now());
      return;
    }
    const previous = state;
    if (previous === "checking") setState("checking");
    const result = await ping();
    setLastCheckedAt(Date.now());
    if (result.ok) {
      setState("connected");
      setVersion(result.version ?? RUNTIME_VERSION);
    } else {
      setState(previous === "connected" ? "disconnected" : "not_installed");
      setVersion(undefined);
    }
  };

  useEffect(() => {
    void check();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      void check();
    }, RUNTIME_POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mocked]);

  return {
    state,
    version,
    mocked,
    lastCheckedAt,
    refresh: () => void check(),
  };
}
