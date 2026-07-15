import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getConfig } from '../config.js';
import { getDb } from '../db/client.js';
import { insertAuditEvent } from '../db/audit.js';
import { getMcpClient } from '../mcp/chromeClient.js';
import { getBrowserController } from '../mcp/browserController.js';
import { evaluateApproval, applyDecision } from '../policy/approval.js';
import { AGENT_CONTROL_TOOLS, mcpToolsToOpenAI } from './toolsBridge.js';
import { SYSTEM_PROMPT, buildTaskUserMessage, compactSnapshotText } from './prompts.js';
import { validateExtraction, newRecordId } from '../extraction/engine.js';
import { budgetStatus, estimateCostUsd, type PricingConfig } from '../../shared/pricing.js';
import type { RunStatus } from '../../shared/schemas.js';
import type { AgentEvent, CompactPageState, PendingApproval, TaskConfig } from '../../shared/types.js';

type Listener = (event: AgentEvent) => void;

type ActiveRun = {
  id: string;
  task: TaskConfig;
  status: RunStatus;
  stopRequested: boolean;
  spentUsd: number;
  promptTokens: number;
  completionTokens: number;
  step: number;
  pagesVisited: number;
  currentUrl: string | null;
  page: CompactPageState | null;
  stepSummaries: string[];
  pendingApproval: PendingApproval | null;
  approvalResolver: ((d: 'approved' | 'denied') => void) | null;
  listeners: Set<Listener>;
};

const runs = new Map<string, ActiveRun>();

function emit(run: ActiveRun, event: Omit<AgentEvent, 'runId' | 'ts'>): void {
  const full: AgentEvent = {
    ...event,
    runId: run.id,
    ts: new Date().toISOString(),
  };
  for (const l of run.listeners) {
    try {
      l(full);
    } catch {
      /* ignore listener errors */
    }
  }
}

function pricing(): PricingConfig {
  const cfg = getConfig();
  return {
    inputPerMillion: cfg.priceInputPerM,
    outputPerMillion: cfg.priceOutputPerM,
    cacheHitPerMillion: cfg.priceCacheHitPerM,
  };
}

function updateRunRow(run: ActiveRun, patch: Partial<{ status: RunStatus; error: string | null }>): void {
  const db = getDb();
  const now = new Date().toISOString();
  run.status = patch.status ?? run.status;
  db.prepare(
    `UPDATE runs SET status = ?, current_url = ?, current_step = ?, spent_usd = ?,
      prompt_tokens = ?, completion_tokens = ?, error = ?, updated_at = ? WHERE id = ?`,
  ).run(
    run.status,
    run.currentUrl,
    run.step,
    run.spentUsd,
    run.promptTokens,
    run.completionTokens,
    patch.error ?? null,
    now,
    run.id,
  );
}

export function subscribe(runId: string, listener: Listener): () => void {
  const run = runs.get(runId);
  if (!run) return () => undefined;
  run.listeners.add(listener);
  return () => run.listeners.delete(listener);
}

export function getActiveRun(runId: string): ActiveRun | undefined {
  return runs.get(runId);
}

export function listRunsFromDb(limit = 50) {
  return getDb()
    .prepare(
      `SELECT id, status, starting_url as startingUrl, objective, model, created_at as createdAt,
        updated_at as updatedAt, current_url as currentUrl, current_step as currentStep,
        max_iterations as maxIterations, spent_usd as spentUsd, budget_usd as budgetUsd,
        prompt_tokens as promptTokens, completion_tokens as completionTokens, error
       FROM runs ORDER BY created_at DESC LIMIT ?`,
    )
    .all(limit);
}

export function createAndStartRun(task: TaskConfig): string {
  const cfg = getConfig();
  const id = uuidv4();
  const now = new Date().toISOString();
  const budgetUsd = task.budgetUsd || cfg.taskBudgetUsd;
  const maxIterations = task.maxIterations || cfg.maxIterations;

  getDb()
    .prepare(
      `INSERT INTO runs (
        id, status, starting_url, objective, extraction_schema_json, permissions_json,
        model, current_url, current_step, max_iterations, budget_usd, spent_usd,
        prompt_tokens, completion_tokens, error, crm_endpoint, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NULL, ?, ?, ?)`,
    )
    .run(
      id,
      'queued',
      task.startingUrl,
      task.objective,
      JSON.stringify(task.extractionSchema),
      JSON.stringify(task.permissions),
      cfg.deepseekModel,
      null,
      0,
      maxIterations,
      budgetUsd,
      task.crmEndpoint || null,
      now,
      now,
    );

  const run: ActiveRun = {
    id,
    task: { ...task, budgetUsd, maxIterations },
    status: 'queued',
    stopRequested: false,
    spentUsd: 0,
    promptTokens: 0,
    completionTokens: 0,
    step: 0,
    pagesVisited: 0,
    currentUrl: null,
    page: null,
    stepSummaries: [],
    pendingApproval: null,
    approvalResolver: null,
    listeners: new Set(),
  };
  runs.set(id, run);

  void executeRun(run);
  return id;
}

export function requestStop(runId: string): boolean {
  const run = runs.get(runId);
  if (!run) return false;
  run.stopRequested = true;
  if (run.approvalResolver) {
    run.approvalResolver('denied');
    run.approvalResolver = null;
  }
  void getBrowserController().stop();
  updateRunRow(run, { status: 'stopped' });
  emit(run, { type: 'done', message: 'Stopped by user' });
  return true;
}

export function resolveApproval(runId: string, approvalId: string, decision: 'approved' | 'denied'): boolean {
  const run = runs.get(runId);
  if (!run?.pendingApproval || run.pendingApproval.id !== approvalId) return false;
  const resolver = run.approvalResolver;
  run.pendingApproval = null;
  run.approvalResolver = null;
  getDb()
    .prepare(`UPDATE approvals SET status = ?, resolved_at = ? WHERE id = ?`)
    .run(decision, new Date().toISOString(), approvalId);
  resolver?.(decision);
  return true;
}

async function waitForApproval(run: ActiveRun, pending: PendingApproval): Promise<'approved' | 'denied'> {
  run.pendingApproval = pending;
  updateRunRow(run, { status: 'awaiting_approval' });
  getDb()
    .prepare(
      `INSERT INTO approvals (id, run_id, tool_name, tool_args_json, operation_class, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .run(
      pending.id,
      run.id,
      pending.toolName,
      JSON.stringify(pending.toolArgs),
      pending.operationClass,
      pending.reason,
      pending.createdAt,
    );

  emit(run, {
    type: 'approval_required',
    message: pending.reason,
    data: {
      approvalId: pending.id,
      toolName: pending.toolName,
      toolArgs: pending.toolArgs,
      operationClass: pending.operationClass,
    },
  });

  return new Promise((resolve) => {
    run.approvalResolver = resolve;
  });
}

async function executeRun(run: ActiveRun): Promise<void> {
  const cfg = getConfig();
  const started = Date.now();
  updateRunRow(run, { status: 'running' });
  emit(run, { type: 'status', message: 'Run started' });

  insertAuditEvent({
    runId: run.id,
    userRequest: run.task.objective,
    model: cfg.deepseekModel,
    resultSummary: `Task started: ${run.task.startingUrl}`,
    url: run.task.startingUrl,
  });

  if (!cfg.deepseekApiKey) {
    updateRunRow(run, { status: 'failed', error: 'DEEPSEEK_API_KEY is not set' });
    emit(run, { type: 'error', message: 'DEEPSEEK_API_KEY is not set' });
    emit(run, { type: 'done', message: 'Failed' });
    return;
  }

  try {
    const browser = getBrowserController();
    if (!getMcpClient().connected) {
      await browser.connect();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateRunRow(run, { status: 'failed', error: `MCP/Chrome connect failed: ${msg}` });
    emit(run, { type: 'error', message: msg });
    emit(run, { type: 'done', message: 'Failed' });
    return;
  }

  const openai = new OpenAI({
    apiKey: cfg.deepseekApiKey,
    baseURL: cfg.deepseekBaseUrl,
  });

  let mcpTools;
  try {
    mcpTools = await getMcpClient().listTools();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateRunRow(run, { status: 'failed', error: msg });
    emit(run, { type: 'error', message: msg });
    emit(run, { type: 'done', message: 'Failed' });
    return;
  }

  const tools = [...mcpToolsToOpenAI(mcpTools), ...AGENT_CONTROL_TOOLS];
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Deterministic seed: open starting URL and read DOM text before the model loop.
  const toolNames = new Set(mcpTools.map((t) => t.name));
  const navigateName = toolNames.has('navigate')
    ? 'navigate'
    : toolNames.has('navigate_page')
      ? 'navigate_page'
      : null;
  const evaluateName = toolNames.has('evaluate')
    ? 'evaluate'
    : toolNames.has('evaluate_script')
      ? 'evaluate_script'
      : null;

  run.page = {
    url: run.task.startingUrl,
    title: '',
    summary: 'Not loaded yet',
    pagesVisited: 0,
  };

  try {
    if (navigateName) {
      const nav = await getMcpClient().callTool(navigateName, { url: run.task.startingUrl });
      run.currentUrl = run.task.startingUrl;
      run.pagesVisited = 1;
      run.stepSummaries.push(`seed:${navigateName}`);
      insertAuditEvent({
        runId: run.id,
        model: cfg.deepseekModel,
        toolName: navigateName,
        toolArgsSanitized: { url: run.task.startingUrl },
        resultSummary: nav.text,
        url: run.task.startingUrl,
        approvalStatus: 'auto',
      });
    }
    if (evaluateName) {
      const evalArgs =
        evaluateName === 'evaluate'
          ? { script: 'document.body.innerText' }
          : { function: '() => document.body.innerText' };
      const ev = await getMcpClient().callTool(evaluateName, evalArgs);
      const text = compactSnapshotText(ev.text);
      run.page = {
        url: run.task.startingUrl,
        title: '',
        summary: text,
        pagesVisited: run.pagesVisited || 1,
      };
      run.stepSummaries.push(`seed:${evaluateName}`);
      insertAuditEvent({
        runId: run.id,
        model: cfg.deepseekModel,
        toolName: evaluateName,
        toolArgsSanitized: evalArgs,
        resultSummary: text,
        url: run.task.startingUrl,
        approvalStatus: 'auto',
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit(run, { type: 'error', message: `Seed navigation/read failed: ${msg}` });
    run.stepSummaries.push(`seed_error:${msg.slice(0, 120)}`);
  }

  updateRunRow(run, { status: 'running' });
  emit(run, {
    type: 'status',
    message: 'Seeded starting page',
    data: { url: run.currentUrl, preview: run.page?.summary?.slice(0, 200) },
  });

  while (true) {
    if (run.stopRequested) {
      updateRunRow(run, { status: 'stopped' });
      emit(run, { type: 'done', message: 'Stopped' });
      return;
    }
    if (Date.now() - started > cfg.taskTimeoutMs) {
      updateRunRow(run, { status: 'timed_out', error: 'Task timed out' });
      emit(run, { type: 'done', message: 'Timed out' });
      return;
    }
    if (run.step >= run.task.maxIterations) {
      updateRunRow(run, { status: 'max_steps', error: 'Maximum iterations reached' });
      emit(run, { type: 'done', message: 'Max steps reached' });
      return;
    }

    const budget = budgetStatus({
      spentUsd: run.spentUsd,
      budgetUsd: run.task.budgetUsd,
      warnThreshold: 0.8,
    });
    if (budget === 'exceeded') {
      updateRunRow(run, { status: 'budget_exceeded', error: 'Task budget exceeded' });
      emit(run, { type: 'done', message: 'Budget exceeded' });
      return;
    }
    if (budget === 'warn') {
      emit(run, {
        type: 'budget_warn',
        message: `Approaching budget: $${run.spentUsd.toFixed(5)} / $${run.task.budgetUsd}`,
        data: { spentUsd: run.spentUsd, budgetUsd: run.task.budgetUsd },
      });
    }

    run.step += 1;
    updateRunRow(run, { status: 'running' });
    emit(run, {
      type: 'step',
      message: `Step ${run.step}/${run.task.maxIterations}`,
      data: {
        step: run.step,
        spentUsd: run.spentUsd,
        budgetUsd: run.task.budgetUsd,
        currentUrl: run.currentUrl,
      },
    });

    const compact = run.stepSummaries.slice(-8).join(' | ');
    // Keep message history short: system + one user turn with compact state
    messages.length = 1;
    messages.push({
      role: 'user',
      content: buildTaskUserMessage(run.task, run.page, compact),
    });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: cfg.deepseekModel,
        messages,
        tools,
        tool_choice: 'auto',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateRunRow(run, { status: 'failed', error: msg });
      emit(run, { type: 'error', message: msg });
      emit(run, { type: 'done', message: 'Failed' });
      return;
    }

    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const cost = estimateCostUsd(promptTokens, completionTokens, pricing());
    run.promptTokens += promptTokens;
    run.completionTokens += completionTokens;
    run.spentUsd += cost;

    // Check budget after billing this call
    if (run.spentUsd >= run.task.budgetUsd) {
      insertAuditEvent({
        runId: run.id,
        model: cfg.deepseekModel,
        resultSummary: 'Budget exceeded after model call',
        promptTokens,
        completionTokens,
        estimatedCostUsd: cost,
      });
      updateRunRow(run, { status: 'budget_exceeded', error: 'Task budget exceeded' });
      emit(run, { type: 'done', message: 'Budget exceeded' });
      return;
    }

    const choice = completion.choices[0]?.message;
    if (!choice) {
      updateRunRow(run, { status: 'failed', error: 'Empty model response' });
      emit(run, { type: 'error', message: 'Empty model response' });
      emit(run, { type: 'done', message: 'Failed' });
      return;
    }

    const toolCalls = choice.tool_calls ?? [];
    if (toolCalls.length === 0) {
      const text = choice.content || '';
      run.stepSummaries.push(`assistant: ${text.slice(0, 200)}`);
      insertAuditEvent({
        runId: run.id,
        model: cfg.deepseekModel,
        resultSummary: text.slice(0, 1000),
        url: run.currentUrl,
        promptTokens,
        completionTokens,
        estimatedCostUsd: cost,
      });
      // If model just talks without tools, nudge once then complete
      if (run.step >= 3) {
        updateRunRow(run, { status: 'completed' });
        emit(run, { type: 'done', message: text || 'Completed without further tools' });
        return;
      }
      continue;
    }

    for (const tc of toolCalls) {
      if (tc.type !== 'function') continue;
      const name = tc.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
      } catch {
        args = {};
      }

      if (name === 'task_complete') {
        insertAuditEvent({
          runId: run.id,
          model: cfg.deepseekModel,
          toolName: name,
          toolArgsSanitized: args,
          resultSummary: String(args.summary ?? 'done'),
          url: run.currentUrl,
          approvalStatus: 'auto',
          promptTokens,
          completionTokens,
          estimatedCostUsd: cost,
        });
        updateRunRow(run, { status: 'completed' });
        emit(run, { type: 'done', message: String(args.summary ?? 'Task complete') });
        return;
      }

      if (name === 'submit_extraction') {
        const raw = {
          recordType: args.recordType,
          pageTitle: args.pageTitle,
          sourceUrl: args.sourceUrl || run.currentUrl || run.task.startingUrl,
          extractedAt: new Date().toISOString(),
          fields: args.fields,
          selectors: args.selectors,
        };
        const validated = validateExtraction(raw, run.task.extractionSchema);
        if (!validated.ok) {
          run.stepSummaries.push(`extraction_invalid: ${validated.error}`);
          insertAuditEvent({
            runId: run.id,
            model: cfg.deepseekModel,
            toolName: name,
            toolArgsSanitized: args,
            error: validated.error,
            url: run.currentUrl,
            promptTokens,
            completionTokens,
            estimatedCostUsd: cost,
          });
          continue;
        }
        const recordId = newRecordId();
        getDb()
          .prepare(
            `INSERT INTO extracted_records (
              id, run_id, record_type, source_url, page_title, extracted_at,
              fields_json, selectors_json, approval
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          )
          .run(
            recordId,
            run.id,
            validated.record.recordType,
            validated.record.sourceUrl,
            validated.record.pageTitle,
            validated.record.extractedAt,
            JSON.stringify(validated.record.fields),
            validated.record.selectors ? JSON.stringify(validated.record.selectors) : null,
          );
        insertAuditEvent({
          runId: run.id,
          model: cfg.deepseekModel,
          toolName: name,
          toolArgsSanitized: { recordType: validated.record.recordType },
          resultSummary: `Extracted record ${recordId}`,
          url: validated.record.sourceUrl,
          approvalStatus: 'auto',
          promptTokens,
          completionTokens,
          estimatedCostUsd: cost,
        });
        emit(run, {
          type: 'extraction',
          message: 'Record extracted',
          data: { recordId, record: validated.record },
        });
        run.stepSummaries.push(`extracted:${validated.record.recordType}`);

        const requiredOk = run.task.extractionSchema.fields
          .filter((f) => f.required)
          .every((f) => {
            const v = validated.record.fields[f.name]?.value;
            return v !== null && v !== undefined && v !== '';
          });
        if (requiredOk) {
          insertAuditEvent({
            runId: run.id,
            model: cfg.deepseekModel,
            toolName: 'task_complete',
            resultSummary: 'Auto-completed after successful required-field extraction',
            url: validated.record.sourceUrl,
            approvalStatus: 'auto',
          });
          updateRunRow(run, { status: 'completed' });
          emit(run, {
            type: 'done',
            message: 'Extraction complete (required fields present)',
          });
          return;
        }
        continue;
      }

      // MCP browser tool
      emit(run, {
        type: 'tool_proposed',
        message: name,
        data: { toolName: name, toolArgs: args },
      });

      const gate = evaluateApproval({
        toolName: name,
        args,
        writeRequiresApproval: run.task.permissions.writeApprovalRequired ?? cfg.writeRequiresApproval,
        currentUrl: run.currentUrl || run.task.startingUrl,
        startingUrl: run.task.startingUrl,
        allowFollowLinks: run.task.permissions.allowFollowLinks,
        maxPages: run.task.permissions.maxPages,
        pagesVisited: run.pagesVisited,
      });

      let decision: 'approved' | 'denied' | null = null;
      if (gate.requiresApproval) {
        const pending: PendingApproval = {
          id: uuidv4(),
          runId: run.id,
          toolName: name,
          toolArgs: args,
          operationClass: gate.operationClass,
          reason: gate.reason,
          createdAt: new Date().toISOString(),
        };
        decision = await waitForApproval(run, pending);
        if (run.stopRequested) {
          updateRunRow(run, { status: 'stopped' });
          emit(run, { type: 'done', message: 'Stopped' });
          return;
        }
      }

      const applied = applyDecision(gate, decision);
      if (!applied.proceed) {
        insertAuditEvent({
          runId: run.id,
          model: cfg.deepseekModel,
          toolName: name,
          toolArgsSanitized: args,
          resultSummary: applied.reason,
          url: run.currentUrl,
          approvalStatus: applied.status === 'pending' ? 'pending' : applied.status,
          promptTokens,
          completionTokens,
          estimatedCostUsd: cost,
        });
        if (applied.status === 'denied') {
          updateRunRow(run, { status: 'denied', error: 'User denied action' });
          emit(run, { type: 'done', message: 'Denied by user' });
          return;
        }
        run.stepSummaries.push(`blocked:${name}`);
        continue;
      }

      let toolResultText = '';
      try {
        const result = await getMcpClient().callTool(name, args);
        toolResultText = compactSnapshotText(result.text);
        if (result.isError) {
          throw new Error(toolResultText || 'Tool error');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        insertAuditEvent({
          runId: run.id,
          model: cfg.deepseekModel,
          toolName: name,
          toolArgsSanitized: args,
          error: msg,
          url: run.currentUrl,
          approvalStatus: applied.status,
          promptTokens,
          completionTokens,
          estimatedCostUsd: cost,
        });
        emit(run, { type: 'error', message: `Tool ${name}: ${msg}` });
        run.stepSummaries.push(`error:${name}`);
        continue;
      }

      insertAuditEvent({
        runId: run.id,
        model: cfg.deepseekModel,
        toolName: name,
        toolArgsSanitized: args,
        resultSummary: toolResultText,
        url: run.currentUrl,
        approvalStatus: applied.status,
        promptTokens,
        completionTokens,
        estimatedCostUsd: cost,
      });

      emit(run, {
        type: 'tool_result',
        message: name,
        data: { toolName: name, preview: toolResultText.slice(0, 500) },
      });

      if (name.includes('navigate') || name === 'new_page') {
        const urlArg = typeof args.url === 'string' ? args.url : run.task.startingUrl;
        const isNewUrl =
          !run.currentUrl ||
          urlArg.replace(/\/$/, '') !== run.currentUrl.replace(/\/$/, '');
        if (isNewUrl) {
          run.pagesVisited += 1;
        }
        run.currentUrl = urlArg;
      }

      const tab = await getBrowserController().refreshActiveTab();
      if (tab?.url) run.currentUrl = tab.url;

      run.page = {
        url: run.currentUrl || run.task.startingUrl,
        title: tab?.title || '',
        summary: toolResultText,
        pagesVisited: run.pagesVisited,
      };
      run.stepSummaries.push(`${name}@${(run.currentUrl || '').slice(0, 60)}`);
      updateRunRow(run, { status: 'running' });
    }
  }
}

/** Test helper: simulate limit checks without network. */
export function wouldStopForLimits(input: {
  step: number;
  maxIterations: number;
  spentUsd: number;
  budgetUsd: number;
  stopRequested?: boolean;
  timedOut?: boolean;
}): RunStatus | null {
  if (input.stopRequested) return 'stopped';
  if (input.timedOut) return 'timed_out';
  if (input.step >= input.maxIterations) return 'max_steps';
  if (input.spentUsd >= input.budgetUsd) return 'budget_exceeded';
  return null;
}
