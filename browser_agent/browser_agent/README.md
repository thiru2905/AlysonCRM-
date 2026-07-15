# Browser Agent

Local AI browser-control application: **DeepSeek** (`deepseek-v4-flash`) + official **chrome-devtools-mcp** + a React UI. The agent can open URLs, inspect pages, extract structured JSON, and export approved records — with hard approval gates for WRITE/SENSITIVE actions.

## Requirements (macOS)

- Node.js 20+ LTS
- Google Chrome (stable)
- A DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com)

## Quick start

```bash
cd browser_agent
cp .env.example .env
# Edit .env and set DEEPSEEK_API_KEY=

npm install
npm run dev
```

- UI (Vite): [http://127.0.0.1:8821](http://127.0.0.1:8821)
- API: [http://127.0.0.1:8820](http://127.0.0.1:8820)

Open **Setup** → **Connect (launch dedicated Chrome)**. Then **New Task** with the sample URL:

`http://127.0.0.1:8820/samples/example-page.html`

Watch **Live Run**, approve any WRITE/SENSITIVE prompts, review **Results**, export CSV from approved rows.

## Dedicated Chrome profile (important)

This app **never** uses your normal Chrome profile by default. Profile path:

`~/.browser-agent/chrome-profile`

### Option A — Let MCP launch Chrome

Leave `CHROME_BROWSER_URL` empty. Click **Connect (launch dedicated Chrome)** in Setup.

### Option B — Attach to a running dedicated instance

Close other Chrome instances that conflict with remote debugging, then:

```bash
mkdir -p "$HOME/.browser-agent/chrome-profile"

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.browser-agent/chrome-profile"
```

In `.env`:

```
CHROME_BROWSER_URL=http://127.0.0.1:9222
```

Then use **Attach to :9222** in Setup.

MCP configs live in:

- [`mcp/chrome-devtools.json`](mcp/chrome-devtools.json) — launch mode
- [`mcp/chrome-devtools-attach.json`](mcp/chrome-devtools-attach.json) — attach mode

## Environment

See [`.env.example`](.env.example). Key settings:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEEPSEEK_API_KEY` | — | Required |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Model ID |
| `PORT` | `8820` | API port |
| `MAX_ITERATIONS` | `20` | Tool/model loop cap |
| `TASK_BUDGET_USD` | `0.02` | Per-task spend cap |
| `WRITE_REQUIRES_APPROVAL` | `true` | Gate WRITE actions |
| `CHROME_USER_DATA_DIR` | `~/.browser-agent/chrome-profile` | Dedicated profile |
| `CHROME_BROWSER_URL` | empty | Optional attach URL |
| `CRM_ENDPOINT` | empty | Optional POST target after record approval |

## Architecture

1. **Agent Host** — DeepSeek tool-call loop with step/budget/timeout limits  
2. **Browser Controller** — chrome-devtools-mcp over stdio; dedicated profile or `:9222`  
3. **Extraction Engine** — Zod-validated fields with confidence + evidence  
4. **Policy / Approval** — READ/NAVIGATE auto; WRITE configurable; SENSITIVE always gated  
5. **Audit Log** — SQLite history of tools, tokens, cost, approvals  
6. **Export** — CSV and optional CRM push for **approved** records only  

## Sample extraction task

1. Start the app (`npm run dev`).
2. Connect Chrome from Setup.
3. New Task → URL `http://127.0.0.1:8820/samples/example-page.html`.
4. Use [`samples/extraction-schema.json`](samples/extraction-schema.json).
5. Expect fields: `full_name` (Alex Rivera), `headline`, `company`, `location`, `profile_url`.
6. Approve the record → Export CSV.

## Scripts

```bash
npm run dev          # API + Vite UI
npm run build        # Compile server + UI
npm start            # Serve built app from API port
npm run typecheck    # TypeScript
npm run lint         # Same as typecheck for MVP
npm test             # Vitest (policy + limits)
```

## Docker

See [`Dockerfile`](Dockerfile). The container runs the Node API/UI only. **Visible Chrome should run on the host** (or attach via `CHROME_BROWSER_URL` to host `9222`). Headed browser automation inside Docker is not the supported path for this MVP.

## Safety

Read [`SECURITY.md`](SECURITY.md). LinkedIn and similar sites default to human-in-the-loop research: no scale scraping, no message/connect automation, no CAPTCHA/auth bypass.

## Database

SQLite file: `data/agent.db` (schema in [`src/server/db/schema.sql`](src/server/db/schema.sql)).
