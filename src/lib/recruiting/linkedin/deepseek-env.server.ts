// ---------------------------------------------------------------------------
// Resolve DEEPSEEK_API_KEY reliably in TanStack Start / Nitro server handlers.
// Vite only auto-injects VITE_* into the client; server secrets need explicit load.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | undefined | null = null;

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadFromEnvFiles(root: string): string | undefined {
  for (const file of [".env.local", ".env"]) {
    const vars = parseEnvFile(join(root, file));
    const key = vars.DEEPSEEK_API_KEY?.trim();
    if (key) return key;
  }
  return undefined;
}

/** Load DEEPSEEK_API_KEY from process.env or project .env (server-only). */
export function getDeepSeekApiKey(root = process.cwd()): string | undefined {
  if (cached !== null) return cached || undefined;

  const fromProcess = process.env.DEEPSEEK_API_KEY?.trim();
  if (fromProcess) {
    cached = fromProcess;
    return fromProcess;
  }

  const fromFile = loadFromEnvFiles(root);
  if (fromFile) {
    process.env.DEEPSEEK_API_KEY = fromFile;
    cached = fromFile;
    return fromFile;
  }

  cached = "";
  return undefined;
}

export function isDeepSeekConfigured(root = process.cwd()): boolean {
  return Boolean(getDeepSeekApiKey(root));
}
