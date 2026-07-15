# Alyson CRM+

AI-first CRM with **Hermes LinkedIn outreach**: search people → save profiles → approve connections → send from real Chrome.

```
CRM (port 3000)  →  Desktop Agent (8787)  →  Browser Agent (8820)  →  Chrome
```

All three must be running for LinkedIn missions to work.

---

## What you need

| Requirement | Notes |
| --- | --- |
| **Windows** | Current setup is Windows-first (`Start-Alyson.bat`, Desktop Agent) |
| **Node.js 20+** | [nodejs.org](https://nodejs.org) (LTS) |
| **Google Chrome** | Installed normally |
| **DeepSeek API key** | [platform.deepseek.com](https://platform.deepseek.com) — plans Hermes steps |
| **LinkedIn account** | You log in once in the Alyson Chrome profile |

---

## 1. Download / clone the project

```bash
git clone https://github.com/thiru2905/AlysonCRM-.git
cd AlysonCRM-
```

Or open the folder you already cloned (`alysonCRM+`).

---

## 2. Install dependencies (first time only)

From the project root:

```bash
npm install
npm install --prefix desktop
npm install --prefix browser_agent/browser_agent
```

---

## 3. Configure environment

```bash
copy .env.example .env
```

Edit `.env` and set at least:

```env
DEEPSEEK_API_KEY=sk-your-key-here

# LinkedIn outreach (approve-in-UI, then send)
LINKEDIN_SEND_ON_APPROVE=true
LINKEDIN_OUTREACH_ENABLED=true
LINKEDIN_MAX_CONNECTIONS_PER_DAY=10

# Local services (keep these as-is for local use)
ALYSON_DESKTOP_AGENT_URL=http://127.0.0.1:8787
ALYSON_BROWSER_AGENT_URL=http://127.0.0.1:8820
ALYSON_CRM_URL=http://127.0.0.1:3000
```

Do **not** commit `.env` — it may contain secrets.

---

## 4. Start everything tomorrow (daily run)

### Option A — easiest (Windows)

Double-click:

```
Start-Alyson.bat
```

This opens **3 terminal windows**:

| Window | URL | Role |
| --- | --- | --- |
| Alyson CRM | http://localhost:3000 | Web UI |
| Alyson Desktop Agent | http://127.0.0.1:8787 | Runs automations / pairs device |
| Alyson Browser MCP | http://127.0.0.1:8820 | Controls Chrome |

**Keep all 3 windows open** while you work. Close them (or Ctrl+C) when done.

### Option B — one command

```bash
npm run agent:stack
```

### Option C — three terminals manually

```bash
# Terminal 1 — CRM UI
npm run dev

# Terminal 2 — Browser agent (Chrome)
npm run browser-agent:dev

# Terminal 3 — Desktop agent
npm run desktop:dev
```

Wait until CRM is on **http://localhost:3000** (not 3001). If 3000 is busy, close whatever is using it and restart.

---

## 5. Connect the Desktop Agent (one-time or after pairing expires)

1. Open **http://localhost:3000**
2. If you see an onboarding / device popup, click **Connect Device**
3. Copy the **8-character code**
4. Pair the desktop agent (PowerShell or another terminal):

```powershell
curl -X POST http://127.0.0.1:8787/alyson/pair `
  -H "Content-Type: application/json" `
  -d "{\"code\":\"YOURCODE\"}"
```

Replace `YOURCODE` with the code from the UI.

5. CRM should show the device as **Connected** / Desktop online.

Credentials are stored under `~/.alyson-agent/` so you often only need to pair once.

### Optional: Windows installer for Desktop Agent

From the project root (after `npm install --prefix desktop`):

```bash
npm run desktop:package
```

Installer builds to `desktop/release/` as `AlysonDesktopAgent-Setup-*.exe`.  
For daily development, `npm run desktop:dev` (or `Start-Alyson.bat`) is enough — you do **not** need the installer.

---

## 6. Log into LinkedIn once (important)

1. Start a Hermes mission **or** open **Browser Workers** so Chrome launches.
2. Chrome opens as a **normal window** (Alyson profile — no “controlled by automated test software” banner).
3. Log into **LinkedIn** in that window.
4. Stay signed in. Sessions persist in the profile under something like `~/.browser-agent/chrome-profile`.

Without this login, search/extract/connect will fail.

---

## 7. Use Hermes for LinkedIn outreach

### Pages you will use

| Page | URL | Purpose |
| --- | --- | --- |
| **Hermes Engine** | http://localhost:3000/hermes | Create missions, approve sends |
| **Saved Profiles** | http://localhost:3000/profiles | People Hermes extracted |
| **Browser Workers** | http://localhost:3000/browser-workers | Live activity / tool calls |

### Typical flow

1. Go to **Hermes** (`/hermes`).
2. Confirm badges show **Desktop online** and DeepSeek is configured.
3. Create a **New mission**:
   - Name (e.g. `Senior React — 1 connection`)
   - Type: connection / outreach style mission
   - Audience (who you want)
   - Optional: paste a LinkedIn people search URL
   - Keep volume low (Hermes is tuned to **extract a few profiles** and **send only 1 connection** per mission for safety)
4. Start the mission.
5. Watch **Browser Workers** — actions should appear (navigate, search, extract).
6. When Hermes finds people, check **Saved Profiles**.
7. When a connection needs approval, **Approve** in Hermes.
8. Chrome opens the profile and clicks **Connect → Send without a note** (if no message).
9. Status updates on the prospect (invite pending / request sent).

### Safety tips

- Keep `LINKEDIN_MAX_CONNECTIONS_PER_DAY` low (e.g. 5–10).
- Prefer **approve each send** (`LINKEDIN_SEND_ON_APPROVE=true`) — do not blast unsupervised.
- LinkedIn can restrict accounts that send too many invites. Start with **1 person per day** while testing.

---

## 8. Quick health checks

```powershell
curl http://127.0.0.1:3000/api/agent/profiles
curl http://127.0.0.1:3000/api/agent/browser-workers/dashboard
curl http://127.0.0.1:8787/alyson/health
```

- Profiles API → saved people JSON  
- Browser Workers dashboard → runs / activity  
- Desktop health → paired / online  

---

## 9. Troubleshooting

| Problem | What to try |
| --- | --- |
| CRM opens on **3001** instead of 3000 | Something else owns 3000. Stop it, then restart CRM so agents can reach `ALYSON_CRM_URL`. |
| Desktop offline | Ensure desktop terminal is running; re-pair with Connect Device + `/alyson/pair`. |
| Saved Profiles empty | Confirm CRM is on 3000 and refresh; check `/api/agent/profiles`. |
| Browser Workers Activity empty | Confirm browser agent on 8820; refresh `/browser-workers`. |
| Chrome never opens | Start browser agent; wait 15–30s on first launch. |
| Connect not sent | Be logged into LinkedIn in Alyson Chrome; approve the draft; watch the live window for the LinkedIn dialog. |
| “Add a note” vs send | Hermes prefers **Send without a note** when no message is set. |
| DeepSeek badge missing | Add `DEEPSEEK_API_KEY` to `.env` and restart CRM. |

---

## 10. Daily checklist (copy this for tomorrow)

1. Open project folder  
2. Double-click **`Start-Alyson.bat`** (or `npm run agent:stack`)  
3. Wait for CRM at **http://localhost:3000**  
4. Confirm Desktop is **Connected** (pair again if needed)  
5. Open **Hermes** → create / continue mission  
6. Watch **Browser Workers** + **Saved Profiles**  
7. **Approve** connection requests one at a time  
8. When finished: Ctrl+C / close the 3 windows  

---

## Marketing landing page

The landing page is the **default** route:

**http://localhost:3000/**

Mission Control lives at **http://localhost:3000/overview**. (`/landing` redirects to `/`.)

Blue/black theme aligned with the in-app accent (`#3B82F6`), with Aceternity-style motion and Syne/Outfit typography.

## Project structure (short)

```
alysonCRM+/
├── Start-Alyson.bat          # Start CRM + Desktop + Browser
├── .env / .env.example       # Secrets & feature flags
├── src/                      # CRM UI + APIs (Hermes, profiles, workers)
├── desktop/                  # Desktop Agent (port 8787)
├── browser_agent/            # Chrome MCP agent (port 8820)
└── data/                     # Local SQLite (gitignored)
```

More detail for the desktop runtime: [`desktop/README.md`](./desktop/README.md).

---

## Other commands

| Command | Description |
| --- | --- |
| `npm run dev` | CRM only |
| `npm run browser-agent:dev` | Browser agent only |
| `npm run desktop:dev` | Desktop agent only |
| `npm run agent:stack` | All three together |
| `npm run desktop:package` | Build Windows Desktop Agent installer |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

---

## Deploy (optional)

For Vercel hosting of the CRM UI (Desktop + Browser agents still run on your PC for Chrome):

1. Connect this repo in Vercel  
2. Build command: `npm run build`  
3. Set `NITRO_PRESET=vercel`  
4. Add server env vars (DeepSeek, etc.) — never expose private keys as `VITE_*`  

Local LinkedIn outreach still needs the **Desktop Agent + Browser Agent on your machine**.
