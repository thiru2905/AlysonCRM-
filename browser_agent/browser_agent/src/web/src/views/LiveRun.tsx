import { useEffect, useState } from 'react';
import { api } from '../api';

type Props = {
  runId: string | null;
  onRunIdChange: (id: string | null) => void;
};

type ApprovalPayload = {
  approvalId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  operationClass: string;
};

export function LiveRunView({ runId, onRunIdChange }: Props) {
  const [runInput, setRunInput] = useState(runId || '');
  const [run, setRun] = useState<Record<string, unknown> | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [approval, setApproval] = useState<ApprovalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRunInput(runId || '');
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    let es: EventSource | null = null;
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const data = await api.getRun(runId!);
        if (!cancelled) setRun(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    void load();
    const poll = setInterval(() => void load(), 2000);

    es = new EventSource(`/api/runs/${runId}/events`);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as {
          type: string;
          message?: string;
          data?: ApprovalPayload & Record<string, unknown>;
          ts?: string;
        };
        setLog((prev) =>
          [`[${msg.ts || ''}] ${msg.type}${msg.message ? `: ${msg.message}` : ''}`, ...prev].slice(
            0,
            200,
          ),
        );
        if (msg.type === 'approval_required' && msg.data?.approvalId) {
          setApproval({
            approvalId: msg.data.approvalId,
            toolName: msg.data.toolName,
            toolArgs: msg.data.toolArgs,
            operationClass: msg.data.operationClass,
          });
        }
        if (msg.type === 'tool_result' || msg.type === 'done' || msg.type === 'status') {
          void load();
        }
        if (msg.type === 'done') {
          setApproval(null);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      /* browser will retry */
    };

    return () => {
      cancelled = true;
      clearInterval(poll);
      es?.close();
    };
  }, [runId]);

  const spent = Number(run?.spentUsd ?? 0);
  const budget = Number(run?.budgetUsd ?? 0.02);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const meterClass = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';

  return (
    <div>
      <div className="stop-bar">
        <div>
          <strong>Emergency stop</strong>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            Immediately cancels the agent loop and disconnects MCP/Chrome control.
          </div>
        </div>
        <button
          type="button"
          className="btn danger"
          disabled={!runId}
          onClick={() => runId && void api.stopRun(runId)}
        >
          Stop
        </button>
      </div>

      <div className="panel">
        <h2>Live Run</h2>
        {error && <p className="error">{error}</p>}
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          <input
            style={{ flex: 1, minWidth: 220 }}
            value={runInput}
            onChange={(e) => setRunInput(e.target.value)}
            placeholder="Run ID"
          />
          <button
            type="button"
            className="btn secondary"
            onClick={() => onRunIdChange(runInput.trim() || null)}
          >
            Load
          </button>
        </div>

        {!runId ? (
          <p className="muted">Start a task or paste a run ID.</p>
        ) : (
          <>
            <div className="grid-2">
              <div>
                <p className="muted">Status</p>
                <p>{String(run?.status ?? '…')}</p>
              </div>
              <div>
                <p className="muted">Current URL</p>
                <p className="mono">{String(run?.currentUrl ?? '—')}</p>
              </div>
              <div>
                <p className="muted">Step</p>
                <p>
                  {String(run?.currentStep ?? 0)} / {String(run?.maxIterations ?? 20)}
                </p>
              </div>
              <div>
                <p className="muted">Tokens</p>
                <p className="mono">
                  in {String(run?.promptTokens ?? 0)} / out {String(run?.completionTokens ?? 0)}
                </p>
              </div>
            </div>

            <p className="muted" style={{ marginTop: '0.75rem' }}>
              Cost ${spent.toFixed(5)} / ${budget.toFixed(4)} ({pct.toFixed(0)}%)
            </p>
            <div className={`meter ${meterClass}`}>
              <span style={{ width: `${pct}%` }} />
            </div>

            {approval && (
              <div className="panel" style={{ marginTop: '1rem', borderColor: 'var(--warn)' }}>
                <h2>Proposed action — {approval.operationClass}</h2>
                <p className="mono">
                  {approval.toolName}({JSON.stringify(approval.toolArgs)})
                </p>
                <div className="row">
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      void api.decideApproval(runId, approval.approvalId, 'approved').then(() =>
                        setApproval(null),
                      )
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() =>
                      void api.decideApproval(runId, approval.approvalId, 'denied').then(() =>
                        setApproval(null),
                      )
                    }
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}

            <p className="muted" style={{ marginTop: '1rem' }}>
              Event log
            </p>
            <div className="log">{log.join('\n') || 'Waiting for events…'}</div>
          </>
        )}
      </div>
    </div>
  );
}
