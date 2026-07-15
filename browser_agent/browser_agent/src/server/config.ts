import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const crmRoot = path.resolve(projectRoot, '../..');
// Browser agent .env first, then Alyson CRM+ root .env (LINKEDIN_* outreach flags).
dotenv.config({ path: path.join(projectRoot, '.env'), override: true });
dotenv.config({ path: path.join(crmRoot, '.env'), override: true });

function expandHome(p: string): string {
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export type AppConfig = {
  host: string;
  port: number;
  dataDir: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  maxIterations: number;
  taskBudgetUsd: number;
  taskTimeoutMs: number;
  writeRequiresApproval: boolean;
  priceInputPerM: number;
  priceOutputPerM: number;
  priceCacheHitPerM: number;
  chromeUserDataDir: string;
  chromeBrowserUrl: string | null;
  chromeDebugPort: number;
  chromeNativeLaunch: boolean;
  chromeStealthMode: boolean;
  chromeExecutablePath: string | null;
  crmEndpoint: string | null;
  crmApiKey: string | null;
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const root = projectRoot;
  const dataDir = path.resolve(root, process.env.DATA_DIR || './data');
  cached = {
    host: process.env.HOST || '127.0.0.1',
    port: numEnv('PORT', 8820),
    dataDir,
    deepseekApiKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
    deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
    deepseekModel: (process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash').trim(),
    maxIterations: numEnv('MAX_ITERATIONS', 20),
    taskBudgetUsd: numEnv('TASK_BUDGET_USD', 0.02),
    taskTimeoutMs: numEnv('TASK_TIMEOUT_MS', 300_000),
    writeRequiresApproval: boolEnv('WRITE_REQUIRES_APPROVAL', true),
    priceInputPerM: numEnv('PRICE_INPUT_PER_M', 0.14),
    priceOutputPerM: numEnv('PRICE_OUTPUT_PER_M', 0.28),
    priceCacheHitPerM: numEnv('PRICE_CACHE_HIT_PER_M', 0.0028),
    chromeUserDataDir: expandHome(
      process.env.CHROME_USER_DATA_DIR || '~/.browser-agent/chrome-profile',
    ),
    chromeBrowserUrl: (process.env.CHROME_BROWSER_URL || '').trim() || null,
    chromeDebugPort: numEnv('CHROME_DEBUG_PORT', 9222),
    chromeNativeLaunch: boolEnv('CHROME_NATIVE_LAUNCH', true),
    chromeStealthMode: boolEnv('CHROME_STEALTH_MODE', true),
    chromeExecutablePath: (process.env.CHROME_EXECUTABLE_PATH || '').trim() || null,
    crmEndpoint: (process.env.CRM_ENDPOINT || '').trim() || null,
    crmApiKey: (process.env.CRM_API_KEY || '').trim() || null,
  };
  fs.mkdirSync(cached.dataDir, { recursive: true });
  fs.mkdirSync(path.join(cached.dataDir, 'screenshots'), { recursive: true });
  return cached;
}

export function resetConfigCache(): void {
  cached = null;
}
