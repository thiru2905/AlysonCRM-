import { describe, expect, it } from 'vitest';
import { wouldStopForLimits } from '../src/server/agent/host.js';
import { budgetStatus, estimateCostUsd } from '../src/shared/pricing.js';

describe('maximum iteration and cost limits', () => {
  it('stops at max iterations (default 20)', () => {
    expect(
      wouldStopForLimits({
        step: 20,
        maxIterations: 20,
        spentUsd: 0.001,
        budgetUsd: 0.02,
      }),
    ).toBe('max_steps');
  });

  it('continues when under iteration limit', () => {
    expect(
      wouldStopForLimits({
        step: 5,
        maxIterations: 20,
        spentUsd: 0.001,
        budgetUsd: 0.02,
      }),
    ).toBeNull();
  });

  it('stops when budget exceeded (default $0.02)', () => {
    expect(
      wouldStopForLimits({
        step: 3,
        maxIterations: 20,
        spentUsd: 0.02,
        budgetUsd: 0.02,
      }),
    ).toBe('budget_exceeded');
  });

  it('warns before exceeding budget at 80%', () => {
    expect(
      budgetStatus({
        spentUsd: 0.016,
        budgetUsd: 0.02,
        warnThreshold: 0.8,
      }),
    ).toBe('warn');
    expect(
      budgetStatus({
        spentUsd: 0.01,
        budgetUsd: 0.02,
        warnThreshold: 0.8,
      }),
    ).toBe('ok');
  });

  it('estimates DeepSeek Flash costs', () => {
    const cost = estimateCostUsd(1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.14 + 0.28, 6);
  });

  it('honors stop and timeout', () => {
    expect(
      wouldStopForLimits({
        step: 1,
        maxIterations: 20,
        spentUsd: 0,
        budgetUsd: 0.02,
        stopRequested: true,
      }),
    ).toBe('stopped');
    expect(
      wouldStopForLimits({
        step: 1,
        maxIterations: 20,
        spentUsd: 0,
        budgetUsd: 0.02,
        timedOut: true,
      }),
    ).toBe('timed_out');
  });
});
