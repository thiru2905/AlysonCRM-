import { Router } from "express";
import { getBrowserController } from "../mcp/browserController.js";
import { getMcpClient } from "../mcp/chromeClient.js";
import { executeAgentTool } from "../mcp/toolExecutor.js";
import { reportApprovalToCrm, reportToolToCrm } from "../crmSync.js";

export const agentToolsRouter = Router();

agentToolsRouter.post("/tool", async (req, res) => {
  try {
    const { tool, args } = req.body as {
      tool?: string;
      args?: Record<string, unknown>;
    };
    if (!tool) {
      res.status(400).json({ error: "tool is required" });
      return;
    }
    const runId = typeof args?.runId === "string" ? args.runId : undefined;
    const controller = getBrowserController();
    await controller.ensureReady();
    const result = await executeAgentTool(tool, args ?? {});

    void reportToolToCrm(runId, tool, args ?? {}, result);
    if (result.status === "pending_approval" && result.data) {
      void reportApprovalToCrm(runId, tool, result.data as Record<string, unknown>);
    }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      tool: req.body?.tool ?? "unknown",
      status: "error",
      timestamp: new Date().toISOString(),
      error: message,
    });
  }
});

agentToolsRouter.get("/tools", async (_req, res) => {
  try {
    const controller = getBrowserController();
    await controller.ensureReady();
    const tools = await getMcpClient().listTools();
    res.json({ tools });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
