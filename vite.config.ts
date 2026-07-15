import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveNitroPreset(): string {
  if (process.env.NITRO_PRESET) return process.env.NITRO_PRESET;
  // Vercel injects these during CI builds; Nitro must use the vercel preset so
  // output lands in .vercel/output (Build Output API) instead of .output/.
  if (process.env.VERCEL || process.env.VERCEL_ENV) return "vercel";
  return "node-server";
}

// Standard, vendor-neutral TanStack Start + Vite config for independent deployment
// (Vercel, Node, Cloudflare) with no Lovable or third-party builder coupling.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  // Server-only secrets — inject into process.env so Nitro / server functions see them.
  for (const key of [
    "DEEPSEEK_API_KEY",
    "PDL_API_KEY",
    "CORESIGNAL_API_KEY",
    "CANDIDATE_PROVIDER",
    "SUPABASE_SERVICE_ROLE_KEY",
    "LINKEDIN_SEND_ON_APPROVE",
    "LINKEDIN_OUTREACH_ENABLED",
    "LINKEDIN_MAX_CONNECTIONS_PER_DAY",
    "LINKEDIN_HUMAN_PACING",
    "LINKEDIN_MIN_ACTION_DELAY_MS",
    "LINKEDIN_MAX_ACTION_DELAY_MS",
    "LINKEDIN_BETWEEN_PROFILE_DELAY_MS",
    "ALYSON_DESKTOP_AGENT_URL",
    "ALYSON_BROWSER_AGENT_URL",
    "ALYSON_CRM_URL",
    "ALYSON_AGENT_DB_PATH",
  ] as const) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key];
    }
  }

  // Pin SQLite to this package so server functions and /api/agent always share one DB.
  if (!process.env.ALYSON_AGENT_DB_PATH) {
    process.env.ALYSON_AGENT_DB_PATH = path.join(__dirname, "data", "alyson-platform.db");
  }

  return {
    envDir: __dirname,
    envPrefix: ["VITE_"],
    server: {
      port: 3000,
      // Bind IPv4 so Desktop/Browser agents (127.0.0.1) can POST automation events.
      host: "127.0.0.1",
      strictPort: true,
    },
    plugins: [
      tsConfigPaths(),
      tanstackStart({ server: { entry: "server" } }),
      nitro({ preset: resolveNitroPreset() }),
      viteReact(),
      tailwindcss(),
    ],
  };
});
