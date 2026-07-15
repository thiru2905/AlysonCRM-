# Alyson Desktop Agent

Local Electron/Node runtime that pairs with Alyson CRM+, executes browser automations, and proxies Chrome MCP tools.

## Quick start (development)

From the `alysonCRM+` root:

```bash
npm install
npm install --prefix desktop
npm install --prefix browser_agent/browser_agent

# Terminal 1 — CRM
npm run dev

# Terminal 2 — Browser MCP agent (Chrome)
npm run browser-agent:dev

# Terminal 3 — Desktop agent (HTTP :8787)
npm run desktop:dev
```

Or run all three CRM + browser + desktop together:

```bash
npm run agent:stack
```

## Pairing flow

1. Open CRM at http://localhost:3000
2. Onboarding popup appears if no device is connected
3. Click **Connect Device** to generate an 8-character code (5 min TTL)
4. In desktop agent, POST the code:

```bash
curl -X POST http://127.0.0.1:8787/alyson/pair \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"AB12CD34\"}"
```

5. CRM shows device as **Connected**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run desktop:dev` | Dev HTTP server on :8787 |
| `npm run desktop:build` | Compile TypeScript |
| `npm run desktop:package` | Windows installer via electron-builder |
| `npm run browser-agent:dev` | Chrome DevTools MCP on :8820 |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `ALYSON_CRM_URL` | `http://127.0.0.1:3000` | CRM base URL |
| `ALYSON_DESKTOP_PORT` | `8787` | Desktop agent port |
| `ALYSON_BROWSER_AGENT_URL` | `http://127.0.0.1:8820` | Browser MCP agent |

Credentials are stored at `~/.alyson-agent/credentials.json` (mode 0600).

## Endpoints

- `GET /alyson/health` — health + pairing status
- `POST /alyson/pair` — exchange pairing code
- `POST /alyson/automation/start` — execute automation run
- `GET /alyson/status` — device status
