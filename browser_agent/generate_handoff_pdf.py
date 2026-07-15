#!/usr/bin/env python3
"""Generate coworker handoff PDF for Browser Agent."""

from pathlib import Path

from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
)

OUT = Path(__file__).resolve().parent / "Browser_Agent_Coworker_Handoff.pdf"

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontSize=22,
        leading=26,
        spaceAfter=12,
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        parent=styles["Normal"],
        fontSize=11,
        leading=14,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="H1Custom",
        parent=styles["Heading1"],
        fontSize=14,
        spaceBefore=14,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H2Custom",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyJust",
        parent=styles["Normal"],
        fontSize=10,
        leading=13,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="CodeBlock",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        leftIndent=6,
        spaceBefore=4,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="BulletBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=13,
        spaceAfter=2,
    )
)


def p(text: str, style="BodyJust"):
    return Paragraph(text.replace("\n", "<br/>"), styles[style])


def bullets(items: list[str]):
    return ListFlowable(
        [ListItem(Paragraph(i, styles["BulletBody"]), leftIndent=12) for i in items],
        bulletType="bullet",
        start="•",
        leftIndent=18,
    )


def code(text: str):
    return Preformatted(text.strip("\n"), styles["CodeBlock"])


def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Browser Agent — Coworker Handoff",
        author="Curson Projects",
    )
    story = []

    # Cover
    story.append(Spacer(1, 1.5 * inch))
    story.append(p("Browser Agent", "CoverTitle"))
    story.append(p("Coworker Handoff Package for Cursor", "CoverSub"))
    story.append(Spacer(1, 0.3 * inch))
    story.append(
        p(
            "Local AI browser-control app using TypeScript, DeepSeek "
            "(deepseek-v4-flash), and the official Chrome DevTools MCP server.",
            "CoverSub",
        )
    )
    story.append(Spacer(1, 0.4 * inch))
    story.append(p("Contents of this package", "H2Custom"))
    story.append(
        bullets(
            [
                "<b>browser_agent/</b> — complete project source (no node_modules, no .env secrets)",
                "<b>Browser_Agent_Coworker_Handoff.pdf</b> — this document (setup + original brief)",
                "<b>START_HERE.md</b> — short checklist to open in Cursor",
            ]
        )
    )
    story.append(Spacer(1, 0.5 * inch))
    story.append(
        p(
            "<b>Do not copy anyone else’s DeepSeek API key.</b> Create your own at "
            "https://platform.deepseek.com and put it only in a local <font face='Courier'>.env</font> file.",
            "BodyJust",
        )
    )
    story.append(PageBreak())

    # 1 Restart in Cursor
    story.append(p("1. Restart this project on your Mac with Cursor", "H1Custom"))
    story.append(p("Prerequisites", "H2Custom"))
    story.append(
        bullets(
            [
                "macOS with Google Chrome (stable)",
                "Node.js 20+ LTS (<font face='Courier'>node -v</font>)",
                "Cursor IDE",
                "Your own DeepSeek API key",
            ]
        )
    )
    story.append(p("Steps", "H2Custom"))
    story.append(
        code(
            """
1. Copy the handoff folder to your machine (or unzip the archive).
2. Open the folder in Cursor:
     File → Open Folder → browser_agent_coworker_handoff/browser_agent
3. In Terminal (inside that folder):

     cp .env.example .env
     # Edit .env and set:
     # DEEPSEEK_API_KEY=sk-your_key_here

     npm install
     npm run dev

4. Open http://127.0.0.1:8821/
5. Setup tab → Connect (launch dedicated Chrome)
6. New Task → use sample URL:
     http://127.0.0.1:8820/samples/example-page.html
7. Live Run → watch steps / approve WRITE if prompted
8. Results → approve record → Export CSV
"""
        )
    )
    story.append(p("Useful scripts", "H2Custom"))
    story.append(
        code(
            """
npm run dev        # API :8820 + Vite UI :8821
npm test           # policy / limits / extraction tests
npm run typecheck  # TypeScript
npm run build && npm start   # production UI served from :8820
"""
        )
    )
    story.append(p("Optional: attach to a dedicated Chrome on port 9222", "H2Custom"))
    story.append(
        code(
            """
mkdir -p "$HOME/.browser-agent/chrome-profile"
/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\
  --remote-debugging-port=9222 \\
  --user-data-dir="$HOME/.browser-agent/chrome-profile"

# In .env:
CHROME_BROWSER_URL=http://127.0.0.1:9222
"""
        )
    )
    story.append(
        p(
            "Never point this app at your everyday Chrome profile. Use "
            "<font face='Courier'>~/.browser-agent/chrome-profile</font> only.",
            "BodyJust",
        )
    )

    # 2 Architecture
    story.append(p("2. What was built (architecture)", "H1Custom"))
    story.append(
        bullets(
            [
                "<b>Agent Host</b> — DeepSeek OpenAI-compatible tool-call loop with step/budget/timeout limits",
                "<b>Browser Controller</b> — spawns chrome-devtools-mcp (slim, no usage stats) against a dedicated Chrome profile",
                "<b>Extraction Engine</b> — Zod-validated fields with confidence + evidence; no invented values",
                "<b>Policy / Approval</b> — READ &amp; NAVIGATE auto; WRITE gated; SENSITIVE always requires approval",
                "<b>Audit Log</b> — SQLite (runs, tools, tokens, cost, approvals)",
                "<b>UI</b> — React views: Setup, New Task, Live Run, Results, Audit",
                "<b>Export</b> — CSV and optional CRM push only after record approval",
            ]
        )
    )
    story.append(p("Default ports", "H2Custom"))
    story.append(
        bullets(
            [
                "<b>8820</b> — Express API (+ sample pages under /samples)",
                "<b>8821</b> — Vite UI (dev)",
                "<b>9222</b> — optional Chrome remote debugging attach",
            ]
        )
    )
    story.append(p("Key paths inside browser_agent/", "H2Custom"))
    story.append(
        code(
            """
src/server/agent/host.ts          # DeepSeek + MCP tool loop
src/server/policy/                # READ/NAVIGATE/WRITE/SENSITIVE gates
src/server/mcp/                   # chrome-devtools-mcp client
src/shared/schemas.ts             # Zod schemas
src/web/                          # React UI
mcp/chrome-devtools.json          # MCP launch config
samples/example-page.html         # harmless extraction smoke test
SECURITY.md                       # risks and LinkedIn constraints
"""
        )
    )

    # 3 Original prompt
    story.append(PageBreak())
    story.append(p("3. Original product brief (for Cursor restart / context)", "H1Custom"))
    story.append(
        p(
            "Paste the following into Cursor if you need the agent to continue development "
            "from the original specification:",
            "BodyJust",
        )
    )
    story.append(
        code(
            """
Build a local AI browser-control application using TypeScript, DeepSeek,
and the official Chrome DevTools MCP server.

OBJECTIVE
Create an AI agent that connects to a dedicated Chrome browser, navigates
websites, inspects page content, extracts structured information, and
performs browser actions under explicit user control.

First use case:
1. Open a URL supplied by the user.
2. Inspect the page using Chrome DevTools MCP.
3. Extract user-selected fields into structured JSON.
4. Display extracted information for review.
5. Export approved results to CSV or a configurable CRM API.
6. Never send messages, submit forms, add connections, make purchases,
   delete information, or perform other external side effects without
   explicit user approval.

TECHNOLOGY
- TypeScript, Node.js LTS
- DeepSeek OpenAI-compatible API; model deepseek-v4-flash
- Official package chrome-devtools-mcp
- Official MCP TypeScript SDK
- Zod, SQLite, React (or minimal local web UI)
- Environment variables for secrets

ARCHITECTURE COMPONENTS
1. Agent Host — DeepSeek + MCP tools, max steps/timeout/token budgets
2. Browser Controller — dedicated Chrome profile, headed mode, Stop button
3. Extraction Engine — schema-driven Zod JSON with evidence + confidence
4. Policy and Approval — READ / NAVIGATE / WRITE / SENSITIVE
5. Audit Log — run_id, tools, sanitized args, tokens, cost
6. Cost Controls — default max 20 iterations, $0.02 task budget

CHROME MCP CONFIG
npx -y chrome-devtools-mcp@latest --slim --no-usage-statistics
Optional attach: --browser-url=http://127.0.0.1:9222

DEEPSEEK
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash

LINKEDIN SAFETY
Human-in-the-loop research assistant only. Do not bypass controls, scrape
at scale, rotate accounts, solve CAPTCHAs, send automated messages or
connection requests.

UI VIEWS
Setup, New Task, Live Run, Results, Audit

DELIVERABLES
Working source, README (macOS), .env.example, MCP config, DB schema,
Zod schemas, approval/limit tests, sample extraction page, Dockerfile,
SECURITY.md
"""
        )
    )

    # 4 Cursor prompt
    story.append(p("4. Suggested first Cursor prompt on the new machine", "H1Custom"))
    story.append(
        code(
            """
I opened the browser_agent project from the coworker handoff package.
Please:
1. Confirm prerequisites (Node 20+, Chrome).
2. Help me create .env from .env.example (I will paste my own DeepSeek key).
3. Run npm install and npm test.
4. Start npm run dev and verify http://127.0.0.1:8821 and :8820.
5. Walk me through the sample extraction against
   http://127.0.0.1:8820/samples/example-page.html

Do not use my normal Chrome profile. Use ~/.browser-agent/chrome-profile.
Do not commit .env. Read SECURITY.md before suggesting LinkedIn workflows.
"""
        )
    )

    # 5 Gotchas
    story.append(p("5. Known gotchas learned during MVP bring-up", "H1Custom"))
    story.append(
        bullets(
            [
                "<b>Stale shell API keys:</b> If <font face='Courier'>DEEPSEEK_API_KEY</font> is exported in the shell with an old value, it used to override <font face='Courier'>.env</font>. The app now loads <font face='Courier'>.env</font> with <font face='Courier'>override: true</font>. Still prefer putting the key only in <font face='Courier'>.env</font>.",
                "<b>401 Authentication Fails:</b> Invalid DeepSeek key. Create a new key at platform.deepseek.com.",
                "<b>Slim MCP tools:</b> With <font face='Courier'>--slim</font>, tools are typically <font face='Courier'>navigate</font>, <font face='Courier'>evaluate</font>, <font face='Courier'>screenshot</font> (not the full DevTools set).",
                "<b>tsx watch restarts wipe in-memory runs:</b> Editing server files mid-run restarts the API and orphans active runs. Reconnect Chrome and start a new task.",
                "<b>Ports:</b> 8820/8821 must be free. Check with <font face='Courier'>lsof -iTCP:8821 -sTCP:LISTEN</font>.",
                "<b>Sample success fields:</b> Alex Rivera; Senior Product Manager · B2B SaaS; Northwind Analytics; Portland, OR; https://example.com/people/alex-rivera",
            ]
        )
    )

    # 6 Security
    story.append(p("6. Security summary", "H1Custom"))
    story.append(
        bullets(
            [
                "Dedicated Chrome profile only — never the user’s default profile by default",
                "Page content and tool results are sent to DeepSeek — do not open secret pages you will not share with that provider",
                "WRITE/SENSITIVE actions require human approval",
                "No CAPTCHA bypass, fingerprint spoofing, proxy rotation, or LinkedIn automation evasion",
                "See SECURITY.md in the project for the full note",
            ]
        )
    )

    # 7 Env template
    story.append(p("7. .env.example (copy to .env and fill secrets)", "H1Custom"))
    story.append(
        code(
            """
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=8820
HOST=127.0.0.1
DATA_DIR=./data
MAX_ITERATIONS=20
TASK_BUDGET_USD=0.02
TASK_TIMEOUT_MS=300000
WRITE_REQUIRES_APPROVAL=true
CHROME_USER_DATA_DIR=~/.browser-agent/chrome-profile
CHROME_BROWSER_URL=
CRM_ENDPOINT=
CRM_API_KEY=
"""
        )
    )

    story.append(p("8. Sharing checklist", "H1Custom"))
    story.append(
        bullets(
            [
                "Share the entire <font face='Courier'>browser_agent_coworker_handoff/</font> folder (or zip it)",
                "Confirm <font face='Courier'>.env</font> is NOT included",
                "Coworker uses their own DeepSeek billing/key",
                "Optional: zip with <font face='Courier'>zip -r browser_agent_coworker_handoff.zip browser_agent_coworker_handoff</font>",
            ]
        )
    )

    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
