import type { OperationClass } from '../../shared/schemas.js';

const READ_TOOLS = new Set([
  'take_snapshot',
  'take_screenshot',
  'evaluate_script',
  'evaluate',
  'screenshot',
  'list_console_messages',
  'list_network_requests',
  'get_network_request',
  'get_console_message',
  'performance_start_trace',
  'performance_stop_trace',
  'performance_analyze_insight',
  'lighthouse_audit',
]);

const NAVIGATE_TOOLS = new Set([
  'navigate_page',
  'navigate',
  'new_page',
  'close_page',
  'select_page',
  'list_pages',
  'wait_for',
  'handle_dialog',
  'emulate',
  'resize_page',
]);

const WRITE_TOOLS = new Set([
  'click',
  'fill',
  'fill_form',
  'type_text',
  'press_key',
  'hover',
  'drag',
  'upload_file',
]);

const SENSITIVE_ARG_PATTERNS = [
  /password/i,
  /passwd/i,
  /credit.?card/i,
  /cvv/i,
  /ssn/i,
  /submit/i,
  /delete/i,
  /purchase/i,
  /checkout/i,
  /pay\b/i,
  /message/i,
  /connect/i,
  /invite/i,
  /upload/i,
  /download/i,
  /login/i,
  /sign.?in/i,
  /sign.?out/i,
  /auth/i,
];

const SENSITIVE_TOOL_PATTERNS = [
  /upload/i,
  /download/i,
  /fill_form/i,
];

function stringifyArgs(args: Record<string, unknown>): string {
  try {
    return JSON.stringify(args);
  } catch {
    return '';
  }
}

export function classifyOperation(
  toolName: string,
  args: Record<string, unknown> = {},
): OperationClass {
  const name = toolName.replace(/^chrome-devtools__/i, '').replace(/^mcp_/i, '');
  const argText = stringifyArgs(args);

  if (SENSITIVE_TOOL_PATTERNS.some((re) => re.test(name))) {
    return 'SENSITIVE';
  }
  if (SENSITIVE_ARG_PATTERNS.some((re) => re.test(argText) || re.test(name))) {
    // clicks/fills that target sensitive UI
    if (WRITE_TOOLS.has(name) || name.includes('click') || name.includes('fill')) {
      return 'SENSITIVE';
    }
  }

  if (READ_TOOLS.has(name) || name.includes('snapshot') || name.includes('screenshot')) {
    // evaluate_script that mutates is still WRITE-ish; keep READ default for inspect
    return 'READ';
  }
  if (NAVIGATE_TOOLS.has(name) || name.startsWith('navigate') || name.includes('scroll')) {
    return 'NAVIGATE';
  }
  if (WRITE_TOOLS.has(name) || name.includes('click') || name.includes('fill') || name.includes('type')) {
    return 'WRITE';
  }

  // Unknown tools default to WRITE (require approval when configured)
  return 'WRITE';
}

export function isLinkedInUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'linkedin.com' || host.endsWith('.linkedin.com');
  } catch {
    return /linkedin\.com/i.test(url);
  }
}
