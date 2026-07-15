import { useState } from 'react';
import { SetupView } from './views/Setup';
import { NewTaskView } from './views/NewTask';
import { LiveRunView } from './views/LiveRun';
import { ResultsView } from './views/Results';
import { AuditView } from './views/Audit';

type Tab = 'setup' | 'task' | 'live' | 'results' | 'audit';

export function App() {
  const [tab, setTab] = useState<Tab>('setup');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <h1 className="brand">Browser Agent</h1>
      <p className="tagline">
        Local DeepSeek + Chrome DevTools MCP research assistant with human approval gates.
      </p>
      <nav className="nav">
        {(
          [
            ['setup', 'Setup'],
            ['task', 'New Task'],
            ['live', 'Live Run'],
            ['results', 'Results'],
            ['audit', 'Audit'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'setup' && <SetupView />}
      {tab === 'task' && (
        <NewTaskView
          onStarted={(runId) => {
            setActiveRunId(runId);
            setTab('live');
          }}
        />
      )}
      {tab === 'live' && <LiveRunView runId={activeRunId} onRunIdChange={setActiveRunId} />}
      {tab === 'results' && <ResultsView runId={activeRunId} />}
      {tab === 'audit' && <AuditView runId={activeRunId} />}
    </div>
  );
}
