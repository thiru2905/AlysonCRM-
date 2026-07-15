import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

type Props = { runId: string | null };

export function AuditView({ runId }: Props) {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [screenshots, setScreenshots] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.audit(runId || undefined);
      setEvents(data.events);
      setScreenshots(data.screenshots);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [runId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalCost = events.reduce((sum, e) => sum + Number(e.estimatedCostUsd ?? 0), 0);
  const totalIn = events.reduce((sum, e) => sum + Number(e.promptTokens ?? 0), 0);
  const totalOut = events.reduce((sum, e) => sum + Number(e.completionTokens ?? 0), 0);

  return (
    <div className="panel">
      <h2>Audit</h2>
      {error && <p className="error">{error}</p>}
      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <button type="button" className="btn secondary" onClick={() => void refresh()}>
          Refresh
        </button>
        <span className="status-pill">
          Tokens in {totalIn} / out {totalOut}
        </span>
        <span className="status-pill">Est. cost ${totalCost.toFixed(5)}</span>
      </div>

      {screenshots.length > 0 && (
        <>
          <p className="muted">Screenshots</p>
          <ul>
            {screenshots.map((s) => (
              <li key={String(s.id)} className="mono">
                {String(s.path)} — {String(s.url || '')}
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Tool</th>
              <th>Approval</th>
              <th>URL</th>
              <th>Result / error</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={String(e.id)}>
                <td className="mono">{String(e.ts)}</td>
                <td className="mono">{String(e.toolName || '—')}</td>
                <td>{String(e.approvalStatus || '—')}</td>
                <td className="mono">{String(e.url || '—')}</td>
                <td>
                  <div>{String(e.resultSummary || '').slice(0, 240)}</div>
                  {e.error ? <div className="error">{String(e.error)}</div> : null}
                </td>
                <td className="mono">${Number(e.estimatedCostUsd ?? 0).toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
