import { Router } from 'express';
import { NewTaskRequestSchema } from '../../shared/schemas.js';
import { getConfig } from '../config.js';
import { createAndStartRun } from '../agent/host.js';
import { estimateCostUsd } from '../../shared/pricing.js';

export const tasksRouter = Router();

tasksRouter.post('/', (req, res) => {
  const parsed = NewTaskRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const cfg = getConfig();
  const body = parsed.data;
  const budgetUsd = body.budgetUsd ?? cfg.taskBudgetUsd;
  const maxIterations = body.maxIterations ?? cfg.maxIterations;

  // Rough max cost estimate shown to user (full budget)
  const estimatedMaxCost = budgetUsd;

  const runId = createAndStartRun({
    startingUrl: body.startingUrl,
    objective: body.objective,
    extractionSchema: body.extractionSchema,
    permissions: {
      ...body.permissions,
      writeApprovalRequired: body.permissions.writeApprovalRequired ?? cfg.writeRequiresApproval,
    },
    crmEndpoint: body.crmEndpoint || undefined,
    budgetUsd,
    maxIterations,
  });

  res.status(201).json({
    runId,
    estimatedMaxCost,
    maxIterations,
    // illustrative token-cost sanity check for UI
    sampleCallCost: estimateCostUsd(2000, 500, {
      inputPerMillion: cfg.priceInputPerM,
      outputPerMillion: cfg.priceOutputPerM,
      cacheHitPerMillion: cfg.priceCacheHitPerM,
    }),
  });
});
