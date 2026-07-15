import { app, Tray, Menu, nativeImage, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray: Tray | null = null;

async function ensureServer() {
  await import("./server/index.js");
}

app.whenReady().then(async () => {
  await ensureServer();

  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Alyson Desktop Agent");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open CRM",
        click: () => shell.openExternal(process.env.ALYSON_CRM_URL ?? "http://127.0.0.1:3000"),
      },
      {
        label: "Health check",
        click: () => shell.openExternal("http://127.0.0.1:8787/alyson/health"),
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ])
  );
});

app.on("window-all-closed", () => {
  // Keep tray app running in background.
});
