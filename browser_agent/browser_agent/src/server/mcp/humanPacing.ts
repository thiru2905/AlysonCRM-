/** Randomized delays and scroll behavior to mimic human LinkedIn browsing. */

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const MIN_MS = numEnv("LINKEDIN_MIN_ACTION_DELAY_MS", 2500);
const MAX_MS = numEnv("LINKEDIN_MAX_ACTION_DELAY_MS", 6500);
const BETWEEN_PROFILE_MS = numEnv("LINKEDIN_BETWEEN_PROFILE_DELAY_MS", 45000);

export function isHumanPacingEnabled(): boolean {
  const v = process.env.LINKEDIN_HUMAN_PACING?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  return true;
}

export function randomBetween(min: number, max: number): number {
  if (max <= min) return min;
  return Math.floor(min + Math.random() * (max - min + 1));
}

export async function humanDelay(min = MIN_MS, max = MAX_MS): Promise<number> {
  const ms = isHumanPacingEnabled() ? randomBetween(min, max) : Math.min(min, 800);
  await new Promise((r) => setTimeout(r, ms));
  return ms;
}

export async function betweenProfileDelay(): Promise<number> {
  if (!isHumanPacingEnabled()) return humanDelay(1200, 2000);
  return humanDelay(
    Math.floor(BETWEEN_PROFILE_MS * 0.75),
    Math.floor(BETWEEN_PROFILE_MS * 1.25)
  );
}

type McpCall = (name: string, args: Record<string, unknown>) => Promise<unknown>;

export async function simulateProfileReading(mcp: McpCall): Promise<void> {
  if (!isHumanPacingEnabled()) return;
  await humanDelay(1500, 3500);
  const scrollSteps = randomBetween(2, 4);
  const scrollAmount = randomBetween(140, 380);
  await mcp("evaluate", {
    script: `(() => {
      for (let i = 0; i < ${scrollSteps}; i++) {
        window.scrollBy({ top: ${scrollAmount}, behavior: 'smooth' });
      }
      return 'scrolled';
    })()`,
  });
  await humanDelay(900, 2200);
}
