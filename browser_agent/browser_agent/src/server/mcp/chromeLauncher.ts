import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { getConfig } from "../config.js";

let spawnedProcess: ChildProcess | null = null;

export function findChromeExecutable(): string {
  const cfg = getConfig();
  if (cfg.chromeExecutablePath && fs.existsSync(cfg.chromeExecutablePath)) {
    return cfg.chromeExecutablePath;
  }

  const localAppData = process.env.LOCALAPPDATA ?? "";
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    "Google Chrome not found. Install Chrome or set CHROME_EXECUTABLE_PATH in .env"
  );
}

export async function probeChromeDebugUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${url.replace(/\/$/, "")}/json/version`, { timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function waitForChromeDebugUrl(url: string, timeoutMs = 25000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await probeChromeDebugUrl(url)) return true;
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

/**
 * Launch a normal Chrome instance (no Puppeteer --enable-automation) and expose CDP on a debug port.
 * Hermes attaches via --browser-url so the "controlled by test software" banner does not appear.
 */
export async function ensureNativeChrome(): Promise<string> {
  const cfg = getConfig();
  const debugUrl = `http://127.0.0.1:${cfg.chromeDebugPort}`;

  if (await probeChromeDebugUrl(debugUrl)) {
    return debugUrl;
  }

  fs.mkdirSync(cfg.chromeUserDataDir, { recursive: true });

  const chrome = findChromeExecutable();
  const args = [
    `--remote-debugging-port=${cfg.chromeDebugPort}`,
    `--user-data-dir=${cfg.chromeUserDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ];

  spawnedProcess = spawn(chrome, args, {
    detached: false,
    stdio: "ignore",
    windowsHide: false,
  });

  spawnedProcess.on("error", (err) => {
    console.error("[chrome-launcher] failed to start Chrome:", err.message);
  });

  spawnedProcess.on("exit", () => {
    spawnedProcess = null;
  });

  const ready = await waitForChromeDebugUrl(debugUrl);
  if (!ready) {
    throw new Error(
      `Chrome did not open on ${debugUrl}. Close other Chrome debug sessions and retry.`
    );
  }

  return debugUrl;
}

export function getNativeChromeDebugUrl(): string {
  const cfg = getConfig();
  return `http://127.0.0.1:${cfg.chromeDebugPort}`;
}

export function stopNativeChrome(): void {
  if (spawnedProcess && !spawnedProcess.killed) {
    spawnedProcess.kill();
    spawnedProcess = null;
  }
}
