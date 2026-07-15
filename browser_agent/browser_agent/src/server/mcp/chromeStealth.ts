/** Reduce automation fingerprints on the active page (navigator.webdriver, etc.). */

export const STEALTH_INIT_SCRIPT = `
(() => {
  try {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
      configurable: true,
    });
    if (window.navigator.permissions?.query) {
      const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
      window.navigator.permissions.query = (parameters) =>
        parameters?.name === "notifications"
          ? Promise.resolve({ state: Notification.permission, onchange: null })
          : originalQuery(parameters);
    }
    if (!window.chrome) {
      window.chrome = { runtime: {} };
    }
    const elementDescriptor = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "attachShadow"
    );
    if (elementDescriptor && !elementDescriptor.get?.toString().includes("native code")) {
      /* leave attachShadow untouched */
    }
  } catch {
    /* best-effort only */
  }
})();
`.trim();

type McpEvaluate = (
  name: string,
  args: Record<string, unknown>
) => Promise<{ text: string }>;

export async function applyStealthToActivePage(mcp: McpEvaluate): Promise<void> {
  try {
    await mcp("evaluate", { script: STEALTH_INIT_SCRIPT });
  } catch {
    /* page may not be ready yet */
  }
}
