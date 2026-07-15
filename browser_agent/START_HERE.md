# Browser Agent — Coworker Handoff

This package lets a teammate recreate the **Browser Agent** MVP on their Mac with **Cursor**.

## Package contents

| Item | Purpose |
|------|---------|
| `browser_agent/` | Full project source (no `node_modules`, no secrets) |
| `Browser_Agent_Coworker_Handoff.pdf` | Setup guide + original product brief + Cursor restart prompt |
| `START_HERE.md` | This file |
| `generate_handoff_pdf.py` | Regenerates the PDF if needed |

## Fastest path (5–10 minutes)

1. Open **`browser_agent/`** in Cursor (`File → Open Folder`).
2. Terminal:

```bash
cd browser_agent
cp .env.example .env
# put YOUR DeepSeek key in .env → DEEPSEEK_API_KEY=
npm install
npm run dev
```

3. Browser: http://127.0.0.1:8821/  
4. **Setup** → Connect (launch dedicated Chrome)  
5. **New Task** URL: `http://127.0.0.1:8820/samples/example-page.html`  
6. Review **Results** and approve before CSV export  

Read the PDF for the full brief, architecture, ports, and known gotchas. Read `browser_agent/SECURITY.md` before any LinkedIn or sensitive-site work.

## Do not

- Commit or share a real `.env`
- Point the agent at your normal Chrome profile
- Reuse someone else’s API key
