export type PricingConfig = {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheHitPerMillion: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  inputPerMillion: 0.14,
  outputPerMillion: 0.28,
  cacheHitPerMillion: 0.0028,
};

export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
  pricing: PricingConfig = DEFAULT_PRICING,
  cachedPromptTokens = 0,
): number {
  const uncached = Math.max(0, promptTokens - cachedPromptTokens);
  const inputCost =
    (uncached / 1_000_000) * pricing.inputPerMillion +
    (cachedPromptTokens / 1_000_000) * pricing.cacheHitPerMillion;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPerMillion;
  return roundUsd(inputCost + outputCost);
}

export function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export type BudgetState = {
  spentUsd: number;
  budgetUsd: number;
  warnThreshold: number;
};

export function budgetStatus(state: BudgetState): 'ok' | 'warn' | 'exceeded' {
  if (state.spentUsd >= state.budgetUsd) return 'exceeded';
  if (state.spentUsd >= state.budgetUsd * state.warnThreshold) return 'warn';
  return 'ok';
}
