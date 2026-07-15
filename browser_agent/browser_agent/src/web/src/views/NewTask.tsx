import { useMemo, useState } from 'react';
import { api } from '../api';

const DEFAULT_SCHEMA = `{
  "recordType": "professional_profile",
  "fields": [
    {"name": "full_name", "type": "string", "required": true},
    {"name": "headline", "type": "string"},
    {"name": "company", "type": "string"},
    {"name": "location", "type": "string"},
    {"name": "profile_url", "type": "url"}
  ]
}`;

type Props = {
  onStarted: (runId: string) => void;
};

export function NewTaskView({ onStarted }: Props) {
  const [startingUrl, setStartingUrl] = useState(
    'http://127.0.0.1:8820/samples/example-page.html',
  );
  const [objective, setObjective] = useState(
    'Open the page, inspect visible content with a snapshot, extract the professional profile fields, then complete.',
  );
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const [maxPages, setMaxPages] = useState(1);
  const [allowFollowLinks, setAllowFollowLinks] = useState(false);
  const [allowExport, setAllowExport] = useState(true);
  const [budgetUsd, setBudgetUsd] = useState(0.02);
  const [maxIterations, setMaxIterations] = useState(20);
  const [crmEndpoint, setCrmEndpoint] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const estimatedMaxCost = useMemo(() => budgetUsd, [budgetUsd]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const extractionSchema = JSON.parse(schemaText);
      const { runId } = await api.createTask({
        startingUrl,
        objective,
        extractionSchema,
        permissions: {
          allowFollowLinks,
          allowExport,
          maxPages,
          writeApprovalRequired: true,
        },
        crmEndpoint: crmEndpoint || undefined,
        budgetUsd,
        maxIterations,
      });
      onStarted(runId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h2>New Task</h2>
      {error && <p className="error">{error}</p>}
      <div className="grid-2">
        <label>
          Starting URL
          <input value={startingUrl} onChange={(e) => setStartingUrl(e.target.value)} />
        </label>
        <label>
          CRM endpoint (optional)
          <input
            value={crmEndpoint}
            onChange={(e) => setCrmEndpoint(e.target.value)}
            placeholder="https://…"
          />
        </label>
      </div>
      <label style={{ marginTop: '0.75rem' }}>
        Objective
        <textarea value={objective} onChange={(e) => setObjective(e.target.value)} />
      </label>
      <label style={{ marginTop: '0.75rem' }}>
        Extraction schema (JSON)
        <textarea value={schemaText} onChange={(e) => setSchemaText(e.target.value)} style={{ minHeight: 160 }} />
      </label>
      <div className="grid-2" style={{ marginTop: '0.75rem' }}>
        <label>
          Max pages
          <input
            type="number"
            min={1}
            max={20}
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
          />
        </label>
        <label>
          Max iterations
          <input
            type="number"
            min={1}
            max={100}
            value={maxIterations}
            onChange={(e) => setMaxIterations(Number(e.target.value))}
          />
        </label>
        <label>
          Budget (USD)
          <input
            type="number"
            min={0.001}
            step={0.001}
            value={budgetUsd}
            onChange={(e) => setBudgetUsd(Number(e.target.value))}
          />
        </label>
        <div className="row" style={{ alignItems: 'flex-end', paddingBottom: '0.35rem' }}>
          <label className="row" style={{ flexDirection: 'row', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={allowFollowLinks}
              onChange={(e) => setAllowFollowLinks(e.target.checked)}
            />
            Allow follow links
          </label>
          <label className="row" style={{ flexDirection: 'row', gap: '0.4rem' }}>
            <input type="checkbox" checked={allowExport} onChange={(e) => setAllowExport(e.target.checked)} />
            Allow export
          </label>
        </div>
      </div>
      <p className="muted" style={{ marginTop: '0.75rem' }}>
        Estimated maximum cost for this task: <strong>${estimatedMaxCost.toFixed(4)}</strong>
      </p>
      <div className="row">
        <button type="button" className="btn" disabled={busy} onClick={() => void start()}>
          Start run
        </button>
      </div>
    </div>
  );
}
