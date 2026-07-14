# Alyson CRM+ — engineering notes

This is a standard, self-hosted TanStack Start (React + Vite) application owned
by the Alyson engineering team. It has no dependency on any no-code/AI builder
platform — the build, deploy, and tooling are all vendor-neutral.

## Visual regression & responsive tests

Playwright covers three axes at three viewports (mobile 390, tablet 834, desktop 1440):
- `tests/brand/tokens.spec.ts` — computed-style checks that pin `--background`, `--card`, `--border`, `--primary`, `--ai`, `--radius`, and the Inter font family so brand drift fails CI.
- `tests/responsive/no-overflow.spec.ts` — every route asserts `scrollWidth ≤ clientWidth` at each viewport.
- `tests/visual/routes.spec.ts` — full-page screenshot diff for every route × viewport. Baselines live in `tests/visual/routes.spec.ts-snapshots/`.

Commands:
- `npm run test:e2e` — run everything.
- `npm run test:e2e:update` — refresh visual baselines (commit the PNGs).
- `npm run test:brand` / `npm run test:responsive` / `npm run test:visual` — subsets.

Baseline policy: only refresh with `--update-snapshots` after a deliberate UI change; a diff in a PR that didn't touch UI is a regression, not a baseline update.
