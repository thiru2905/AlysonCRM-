import { useCallback, useEffect, useState } from 'react';
import { api, type SetupStatus } from '../api';

export function SetupView() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setStatus(await api.setupStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  async function connect(mode: 'launch' | 'attach') {
    setBusy(true);
    setError(null);
    try {
      await api.connect(mode);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await api.disconnect();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const s = status;

  return (
    <div className="panel">
      <h2>Setup</h2>
      {error && <p className="error">{error}</p>}
      {!s ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="row" style={{ marginBottom: '1rem' }}>
            <span className={`status-pill ${s.apiKeyConfigured ? 'ok' : 'bad'}`}>
              API {s.apiKeyConfigured ? 'key set' : 'missing'}
            </span>
            <span className={`status-pill ${s.mcpConnected ? 'ok' : 'bad'}`}>
              MCP {s.mcpConnected ? 'connected' : 'offline'}
            </span>
            <span className={`status-pill ${s.chromeReachable ? 'ok' : 'bad'}`}>
              Chrome {s.chromeReachable ? 'reachable' : 'not detected'}
            </span>
            <span className="status-pill">Model {s.model}</span>
            <span className="status-pill">Mode {s.chromeMode}</span>
          </div>

          <div className="grid-2">
            <div>
              <p className="muted">Dedicated profile</p>
              <p className="mono">{s.userDataDir}</p>
            </div>
            <div>
              <p className="muted">Attach URL</p>
              <p className="mono">{s.browserUrl || '(launch new Chrome via MCP)'}</p>
            </div>
          </div>

          {s.activeTab && (
            <p style={{ marginTop: '0.75rem' }}>
              Active tab:{' '}
              <span className="mono">
                {s.activeTab.title} — {s.activeTab.url}
              </span>
            </p>
          )}

          <div className="row" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn" disabled={busy} onClick={() => void connect('launch')}>
              Connect (launch dedicated Chrome)
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={busy || !s.browserUrl}
              onClick={() => void connect('attach')}
            >
              Attach to :9222
            </button>
            <button type="button" className="btn secondary" disabled={busy} onClick={() => void disconnect()}>
              Disconnect
            </button>
            <button type="button" className="btn secondary" onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}
