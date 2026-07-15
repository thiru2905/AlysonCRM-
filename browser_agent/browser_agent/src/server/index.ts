import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { getConfig } from './config.js';
import { getDb } from './db/client.js';
import { setupRouter } from './routes/setup.js';
import { tasksRouter } from './routes/tasks.js';
import { runsRouter } from './routes/runs.js';
import { resultsRouter } from './routes/results.js';
import { auditRouter } from './routes/audit.js';
import { agentToolsRouter } from './routes/agentTools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const cfg = getConfig();
  getDb();

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'browser-agent', port: cfg.port });
  });

  app.use('/api/setup', setupRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/runs', runsRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/agent', agentToolsRouter);

  // Serve sample pages
  const samplesDir = path.resolve(__dirname, '../../samples');
  app.use('/samples', express.static(samplesDir));

  const webDist = path.resolve(__dirname, '../../dist/web');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  const server = app.listen(cfg.port, cfg.host, () => {
    console.log(`Browser Agent API listening on http://${cfg.host}:${cfg.port}`);
  });

  const shutdown = async () => {
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
