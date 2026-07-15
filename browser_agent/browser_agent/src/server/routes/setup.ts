import { Router } from 'express';
import { getConfig } from '../config.js';
import { getMcpClient } from '../mcp/chromeClient.js';
import { getBrowserController } from '../mcp/browserController.js';
import type { SetupStatus } from '../../shared/types.js';

export const setupRouter = Router();

setupRouter.get('/status', async (_req, res) => {
  const cfg = getConfig();
  const browser = getBrowserController();
  const mcp = getMcpClient();
  const base = browser.getStatus();

  let chromeReachable = false;
  if (cfg.chromeBrowserUrl) {
    chromeReachable = await browser.probeChromeDebugging(cfg.chromeBrowserUrl);
  } else if (mcp.connected) {
    chromeReachable = true;
  }

  let activeTab = null;
  if (mcp.connected) {
    activeTab = await browser.refreshActiveTab();
  }

  const status: SetupStatus = {
    apiKeyConfigured: Boolean(cfg.deepseekApiKey),
    model: cfg.deepseekModel,
    mcpConnected: mcp.connected,
    chromeReachable,
    chromeMode: mcp.connected ? browser.mode : 'disconnected',
    userDataDir: cfg.chromeUserDataDir,
    browserUrl: cfg.chromeBrowserUrl,
    activeTab,
  };
  res.json(status);
});

setupRouter.post('/connect', async (req, res) => {
  try {
    const mode = req.body?.mode === 'attach' ? 'attach' : 'launch';
    const connectedMode = await getBrowserController().connect(mode);
    const tools = await getMcpClient().listTools();
    res.json({
      ok: true,
      mode: connectedMode,
      toolCount: tools.length,
      tools: tools.map((t) => t.name),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

setupRouter.post('/disconnect', async (_req, res) => {
  await getBrowserController().stop();
  res.json({ ok: true });
});
