import type { OperationClass } from '../../shared/schemas.js';
import { classifyOperation, isLinkedInUrl } from './classifier.js';

export type ApprovalPolicyInput = {
  toolName: string;
  args?: Record<string, unknown>;
  writeRequiresApproval: boolean;
  currentUrl?: string | null;
  startingUrl?: string | null;
  allowFollowLinks?: boolean;
  maxPages?: number;
  pagesVisited?: number;
};

function sameOriginPath(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.href.replace(/\/$/, '') === ub.href.replace(/\/$/, '');
  } catch {
    return a.replace(/\/$/, '') === b.replace(/\/$/, '');
  }
}

export type ApprovalGateResult = {
  allowed: boolean;
  requiresApproval: boolean;
  operationClass: OperationClass;
  reason: string;
};

export function evaluateApproval(input: ApprovalPolicyInput): ApprovalGateResult {
  const args = input.args ?? {};
  const operationClass = classifyOperation(input.toolName, args);
  const linkedIn = isLinkedInUrl(input.currentUrl);
  const targetUrl = typeof args.url === 'string' ? args.url : null;
  const revisitingKnownPage =
    Boolean(targetUrl) &&
    (sameOriginPath(targetUrl!, input.startingUrl || '') ||
      sameOriginPath(targetUrl!, input.currentUrl || ''));

  if (operationClass === 'SENSITIVE') {
    return {
      allowed: false,
      requiresApproval: true,
      operationClass,
      reason: 'SENSITIVE actions always require immediate human approval.',
    };
  }

  if (operationClass === 'WRITE') {
    if (linkedIn) {
      return {
        allowed: false,
        requiresApproval: true,
        operationClass,
        reason: 'LinkedIn WRITE actions require human-in-the-loop approval.',
      };
    }
    if (input.writeRequiresApproval) {
      return {
        allowed: false,
        requiresApproval: true,
        operationClass,
        reason: 'WRITE actions require configurable user approval.',
      };
    }
    return {
      allowed: true,
      requiresApproval: false,
      operationClass,
      reason: 'WRITE auto-approved by configuration.',
    };
  }

  if (operationClass === 'NAVIGATE') {
    const name = input.toolName.toLowerCase();
    const isNewNavigation =
      name.includes('navigate') || name.includes('new_page') || Boolean(args.url);

    if (linkedIn && isNewNavigation && !revisitingKnownPage) {
      return {
        allowed: false,
        requiresApproval: true,
        operationClass,
        reason:
          'LinkedIn navigation is human-in-the-loop: open the target page manually or approve explicitly.',
      };
    }

    // Re-opening the starting/current URL is not "following links"
    if (revisitingKnownPage) {
      return {
        allowed: true,
        requiresApproval: false,
        operationClass,
        reason: 'Re-navigation to the current/starting URL is permitted.',
      };
    }

    if (isNewNavigation && input.allowFollowLinks === false && (input.pagesVisited ?? 0) >= 1) {
      return {
        allowed: false,
        requiresApproval: true,
        operationClass,
        reason: 'Following additional links is not permitted for this task without approval.',
      };
    }

    if (
      isNewNavigation &&
      typeof input.maxPages === 'number' &&
      typeof input.pagesVisited === 'number' &&
      input.pagesVisited >= input.maxPages
    ) {
      return {
        allowed: false,
        requiresApproval: true,
        operationClass,
        reason: `Maximum pages (${input.maxPages}) reached; further navigation requires approval.`,
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
      operationClass,
      reason: 'NAVIGATE permitted automatically.',
    };
  }

  // READ
  return {
    allowed: true,
    requiresApproval: false,
    operationClass,
    reason: 'READ permitted automatically.',
  };
}

/** Enforce a prior human decision for a gated action. */
export function applyDecision(
  gate: ApprovalGateResult,
  decision: 'approved' | 'denied' | null,
): { proceed: boolean; status: 'auto' | 'approved' | 'denied' | 'pending'; reason: string } {
  if (!gate.requiresApproval) {
    return { proceed: true, status: 'auto', reason: gate.reason };
  }
  if (decision === 'approved') {
    return { proceed: true, status: 'approved', reason: 'User approved.' };
  }
  if (decision === 'denied') {
    return { proceed: false, status: 'denied', reason: 'User denied.' };
  }
  return { proceed: false, status: 'pending', reason: gate.reason };
}
