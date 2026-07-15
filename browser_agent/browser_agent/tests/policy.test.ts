import { describe, expect, it } from 'vitest';
import { evaluateApproval, applyDecision } from '../src/server/policy/approval.js';
import { classifyOperation, isLinkedInUrl } from '../src/server/policy/classifier.js';

describe('classifyOperation', () => {
  it('classifies snapshot as READ', () => {
    expect(classifyOperation('take_snapshot')).toBe('READ');
  });

  it('classifies navigate as NAVIGATE', () => {
    expect(classifyOperation('navigate_page', { url: 'https://example.com' })).toBe('NAVIGATE');
  });

  it('classifies click as WRITE', () => {
    expect(classifyOperation('click', { uid: '1' })).toBe('WRITE');
  });

  it('classifies password fill as SENSITIVE', () => {
    expect(classifyOperation('fill', { uid: '1', value: 'x', name: 'password' })).toBe('SENSITIVE');
  });

  it('classifies upload as SENSITIVE', () => {
    expect(classifyOperation('upload_file', { path: '/tmp/a' })).toBe('SENSITIVE');
  });
});

describe('approval enforcement', () => {
  it('allows READ automatically', () => {
    const gate = evaluateApproval({
      toolName: 'take_snapshot',
      writeRequiresApproval: true,
    });
    expect(gate.requiresApproval).toBe(false);
    expect(gate.allowed).toBe(true);
    expect(applyDecision(gate, null).proceed).toBe(true);
  });

  it('allows NAVIGATE automatically on first page', () => {
    const gate = evaluateApproval({
      toolName: 'navigate_page',
      args: { url: 'https://example.com' },
      writeRequiresApproval: true,
      pagesVisited: 0,
      maxPages: 1,
      allowFollowLinks: false,
    });
    expect(gate.requiresApproval).toBe(false);
    expect(applyDecision(gate, null).proceed).toBe(true);
  });

  it('blocks WRITE without approval when configured', () => {
    const gate = evaluateApproval({
      toolName: 'click',
      args: { uid: 'btn' },
      writeRequiresApproval: true,
    });
    expect(gate.requiresApproval).toBe(true);
    expect(applyDecision(gate, null).status).toBe('pending');
    expect(applyDecision(gate, 'denied').proceed).toBe(false);
    expect(applyDecision(gate, 'approved').proceed).toBe(true);
  });

  it('always requires approval for SENSITIVE', () => {
    const gate = evaluateApproval({
      toolName: 'fill',
      args: { field: 'password', value: 'secret' },
      writeRequiresApproval: false,
    });
    expect(gate.operationClass).toBe('SENSITIVE');
    expect(gate.requiresApproval).toBe(true);
    expect(applyDecision(gate, null).proceed).toBe(false);
  });

  it('requires approval for LinkedIn WRITE even if write auto-enabled', () => {
    const gate = evaluateApproval({
      toolName: 'click',
      args: { uid: 'connect' },
      writeRequiresApproval: false,
      currentUrl: 'https://www.linkedin.com/in/someone',
    });
    expect(gate.requiresApproval).toBe(true);
  });

  it('detects LinkedIn URLs', () => {
    expect(isLinkedInUrl('https://www.linkedin.com/in/x')).toBe(true);
    expect(isLinkedInUrl('https://example.com')).toBe(false);
  });
});
