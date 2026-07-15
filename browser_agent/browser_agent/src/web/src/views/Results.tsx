import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

type Props = { runId: string | null };

type FieldValue = {
  value: unknown;
  confidence: number;
  evidence: string;
  source_url: string;
  explanation?: string;
};

type RecordRow = {
  id: string;
  runId: string;
  recordType: string;
  sourceUrl: string;
  pageTitle: string;
  extractedAt: string;
  approval: string;
  fields: Record<string, FieldValue>;
};

export function ResultsView({ runId }: Props) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listResults(runId || undefined);
      setRecords(data.records as RecordRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [runId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="panel">
      <h2>Results</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="muted">{message}</p>}
      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <button type="button" className="btn secondary" onClick={() => void refresh()}>
          Refresh
        </button>
        <a className="btn secondary" href={api.exportCsvUrl(runId || undefined, true)}>
          Export approved CSV
        </a>
        <a className="btn secondary" href={api.exportCsvUrl(runId || undefined, false)}>
          Export all CSV
        </a>
      </div>

      {records.length === 0 ? (
        <p className="muted">No extracted records yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Fields</th>
                <th>Approval</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.recordType}</td>
                  <td className="mono">
                    <div>{r.pageTitle}</div>
                    <div className="muted">{r.sourceUrl}</div>
                  </td>
                  <td>
                    {Object.entries(r.fields).map(([name, fv]) => (
                      <div key={name} style={{ marginBottom: '0.35rem' }}>
                        <strong>{name}</strong>: {String(fv.value)}{' '}
                        <span className="muted">({(fv.confidence * 100).toFixed(0)}%)</span>
                        <div className="muted">{fv.evidence}</div>
                      </div>
                    ))}
                  </td>
                  <td>{r.approval}</td>
                  <td>
                    <div className="row">
                      <button
                        type="button"
                        className="btn"
                        onClick={() =>
                          void api.approveRecord(r.id, 'approved').then(() => refresh())
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() =>
                          void api.approveRecord(r.id, 'rejected').then(() => refresh())
                        }
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={r.approval !== 'approved'}
                        onClick={() =>
                          void api
                            .pushCrm(r.id)
                            .then((res) => setMessage(`CRM: ${res.status} ${res.body}`))
                            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                        }
                      >
                        CRM push
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
