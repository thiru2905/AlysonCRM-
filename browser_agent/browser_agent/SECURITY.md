# Security — Browser Agent

## What this software can do

Browser Agent controls a **dedicated** Chrome instance via Chrome DevTools MCP and sends page-derived context to the **DeepSeek API**. Anyone with access to this local app can:

- Navigate and read pages in the controlled browser
- Propose clicks, typing, and form interactions (subject to approval policy)
- Extract visible text into structured records stored in local SQLite
- Export approved records to CSV or a configured CRM endpoint

## Browser access risks

- **Session isolation:** Always use the dedicated profile (`~/.browser-agent/chrome-profile` or `CHROME_USER_DATA_DIR`). Do **not** point the agent at your everyday Chrome profile; that would expose personal cookies, passwords, and logged-in accounts to the agent and to DeepSeek.
- **Remote debugging:** Opening Chrome with `--remote-debugging-port=9222` allows any local process to attach. Bind only to localhost and stop the debugging Chrome when finished.
- **Data exfiltration to the model:** Snapshots, URLs, and tool results are sent to DeepSeek. Do not open pages containing secrets you are unwilling to share with that provider.
- **Side effects:** WRITE and SENSITIVE actions require approval (SENSITIVE always). Still review every proposed action — mis-clicks can send messages, submit forms, or change account state.
- **Stop control:** Use the Live Run **Stop** button to cancel the loop and disconnect MCP immediately if something unexpected appears.

## Policy guarantees (MVP)

| Class | Behavior |
|-------|----------|
| READ | Auto-allowed (inspect / snapshot) |
| NAVIGATE | Auto-allowed within page limits; LinkedIn navigation requires approval |
| WRITE | Requires approval when `WRITE_REQUIRES_APPROVAL=true` (default) |
| SENSITIVE | Always requires immediate human approval |

The agent must not be used to bypass CAPTCHAs, authentication, rate limits, robots protections, or site access controls. Those capabilities are intentionally **not** implemented.

## LinkedIn and social networks

Allowed use: assist you in organizing information **you are authorized to view**, with human review.

Not allowed / not implemented:

- Bypassing LinkedIn controls
- Scraping profiles at scale
- Downloading contact networks
- Evading rate limits
- Rotating accounts or fingerprints
- Disguising automation
- Automated connection requests or messages

## Secrets

- Store `DEEPSEEK_API_KEY` and `CRM_API_KEY` only in `.env` (never commit).
- Audit logs sanitize common secret-shaped argument keys; do not rely on this as a complete redaction system.

## Threat model summary

This is a **local research tool** for a trusted operator on their own machine. It is not multi-tenant secure, not hardened against hostile web content beyond normal Chrome protections, and not a compliance substitute for your organization’s data policies.
