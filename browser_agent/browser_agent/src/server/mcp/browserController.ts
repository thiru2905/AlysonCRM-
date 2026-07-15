import fs from 'node:fs';
import http from 'node:http';
import { getConfig } from '../config.js';
import { getMcpClient } from './chromeClient.js';
import { ensureNativeChrome } from './chromeLauncher.js';
import { applyStealthToActivePage } from './chromeStealth.js';
import type { SetupStatus } from '../../shared/types.js';

export type BrowserMode = 'launch' | 'attach';

export class BrowserController {
  mode: BrowserMode = 'launch';
  private stopped = false;

  getStatus(): Omit<SetupStatus, 'apiKeyConfigured' | 'model'> {
    const cfg = getConfig();
    const mcp = getMcpClient();
    return {
      mcpConnected: mcp.connected,
      chromeReachable: false,
      chromeMode: mcp.connected ? this.mode : 'disconnected',
      userDataDir: cfg.chromeUserDataDir,
      browserUrl: cfg.chromeBrowserUrl,
      activeTab: null,
    };
  }

  async ensureProfileDir(): Promise<void> {
    const cfg = getConfig();
    fs.mkdirSync(cfg.chromeUserDataDir, { recursive: true });
  }

  async probeChromeDebugging(url = 'http://127.0.0.1:9222'): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${url.replace(/\/$/, '')}/json/version`, { timeout: 1500 }, (res) => {
        res.resume();
        resolve(res.statusCode !== undefined && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /** Keep Chrome debug port + MCP session alive between Hermes steps. */
  async ensureReady(): Promise<void> {
    const cfg = getConfig();
    await this.ensureProfileDir();

    if (cfg.chromeNativeLaunch && !cfg.chromeBrowserUrl) {
      const debugUrl = `http://127.0.0.1:${cfg.chromeDebugPort}`;
      if (!(await this.probeChromeDebugging(debugUrl))) {
        await ensureNativeChrome();
        await getMcpClient().disconnect();
      }
    }

    const mcp = getMcpClient();
    if (!mcp.connected) {
      await this.connect('launch');
      return;
    }

    try {
      await mcp.callTool('list_pages', {});
    } catch {
      await mcp.disconnect();
      await this.connect('launch');
    }
  }

  async connect(mode?: BrowserMode): Promise<SetupStatus['chromeMode']> {
    const cfg = getConfig();
    this.stopped = false;
    await this.ensureProfileDir();

    const mcp = getMcpClient();

    if (cfg.chromeBrowserUrl) {
      this.mode = 'attach';
      await mcp.connect('attach', cfg.chromeBrowserUrl);
      await applyStealthToActivePage((name, args) => mcp.callTool(name, args));
      return 'attach';
    }

    if (cfg.chromeNativeLaunch && (mode === 'launch' || mode === undefined)) {
      const debugUrl = await ensureNativeChrome();
      this.mode = 'attach';
      await mcp.connect('attach', debugUrl);
      await applyStealthToActivePage((name, args) => mcp.callTool(name, args));
      return 'attach';
    }

    const preferred: BrowserMode = mode ?? 'launch';
    this.mode = preferred;
    await mcp.connect(preferred);
    await applyStealthToActivePage((name, args) => mcp.callTool(name, args));
    return preferred;
  }

  async refreshActiveTab(): Promise<{ url: string; title: string } | null> {
    const mcp = getMcpClient();
    if (!mcp.connected) return null;
    try {
      const pages = await mcp.callTool('list_pages', {});
      const match = pages.text.match(/https?:\/\/\S+/);
      const titleMatch = pages.text.match(/title[:\s]+(.+)/i);
      return {
        url: match?.[0] ?? '',
        title: titleMatch?.[1]?.trim() ?? '',
      };
    } catch {
      return null;
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    await getMcpClient().disconnect();
  }

  isStopped(): boolean {
    return this.stopped;
  }
}

let controller: BrowserController | null = null;

export function getBrowserController(): BrowserController {
  if (!controller) controller = new BrowserController();
  return controller;
}
