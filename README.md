# Alyson CRM+

The AI-first agentic CRM+ — CRM, Recruiting, Success, Marketing, Real Estate,
Mortgage and Insurance on shared primitives. Humans supervise. AI performs.

This is a standalone, self-hosted application with **no dependency on Lovable
or any no-code builder** — build, tooling, and deployment are fully owned by
your team.

## Stack

- **Framework:** TanStack Start (SSR) + TanStack Router
- **UI:** React 19, Tailwind CSS v4, shadcn/ui, lucide-react
- **Server runtime:** Nitro (Node, **Vercel**, or Cloudflare via `NITRO_PRESET`)
- **Recruiting:** PDL / Coresignal provider adapters, LinkedIn search builder

## Local setup

```bash
npm install
cp .env.example .env   # add API keys as needed
npm run dev            # http://localhost:3000
```

## Deploy to Vercel

1. Connect this repo in the [Vercel dashboard](https://vercel.com/new).
2. Set **Build command:** `npm run build`
3. Set **Environment variable:** `NITRO_PRESET=vercel`
4. Add recruiting secrets server-side only: `PDL_API_KEY`, `CANDIDATE_PROVIDER`, etc.
5. Deploy — Vercel picks up the Nitro output automatically.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Environment

See [`.env.example`](./.env.example). Only `VITE_*` vars reach the browser;
API keys stay server-side.

## Recruiting module

- `/recruiting` — overview
- `/recruiting/jobs` — post roles, source candidates
- `/recruiting/search` — candidate search (PDL/Coresignal)
- `/recruiting/linkedin` — LinkedIn / Sales Navigator Boolean builder

## Desktop Agent + Automation Platform

Alyson CRM+ includes a local AI employee stack:

```
Alyson CRM (:3000) → Desktop Agent (:8787) → Browser MCP Agent (:8820) → Chrome
```

| Route | Purpose |
| --- | --- |
| `/browser-workers` | Desktop fleet, MCP tools, activity |
| `/automation` | Natural-language tasks, runs, approvals |
| `/outreach` | LinkedIn campaigns, prospects, sequences |

### Run the full stack (development)

```bash
npm run agent:stack
# or separately:
npm run dev
npm run browser-agent:dev
npm run desktop:dev
```

### Pair a device

1. Open CRM — onboarding popup appears if no device is connected
2. Click **Connect Device** to get an 8-character code (expires in 5 min)
3. Pair from desktop: `POST http://127.0.0.1:8787/alyson/pair` with `{ "code": "..." }`

See [`desktop/README.md`](./desktop/README.md) for installer build (`desktop:package`).
