import { defineConfig } from "vite";
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
export default defineConfig({
  envDir: __dirname,
  envPrefix: ["VITE_"],
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    nitro({ preset: resolveNitroPreset() }),
    viteReact(),
    tailwindcss(),
  ],
});
