/**
 * Deterministic re-extraction using CSS selectors discovered by the agent.
 * Used after the model identifies stable selectors — avoids repeated LLM calls.
 */
export function buildEvaluateScript(selectors: Record<string, string>): string {
  const entries = Object.entries(selectors);
  const lines = entries.map(([name, sel]) => {
    const safeSel = JSON.stringify(sel);
    const safeName = JSON.stringify(name);
    return `out[${safeName}] = (() => { const el = document.querySelector(${safeSel}); return el ? (el.textContent || '').trim() : null; })();`;
  });
  return `() => { const out = {}; ${lines.join(' ')} return out; }`;
}

export function mapSelectorResults(
  values: Record<string, string | null>,
  sourceUrl: string,
): Record<string, { value: string | null; confidence: number; evidence: string; source_url: string }> {
  const out: Record<
    string,
    { value: string | null; confidence: number; evidence: string; source_url: string }
  > = {};
  for (const [name, value] of Object.entries(values)) {
    out[name] = {
      value,
      confidence: value ? 0.85 : 0.1,
      evidence: value
        ? `Deterministic selector extraction for "${name}"`
        : `Selector for "${name}" matched no element`,
      source_url: sourceUrl,
    };
  }
  return out;
}
