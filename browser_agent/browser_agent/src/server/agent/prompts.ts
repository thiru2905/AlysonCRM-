import type { ExtractionSchema } from '../../shared/schemas.js';
import type { CompactPageState, TaskConfig } from '../../shared/types.js';

export const SYSTEM_PROMPT = `You are a careful local browser research assistant.

Rules:
- Prefer DOM text via evaluate (e.g. document.body.innerText) or take_snapshot over screenshots. Use screenshot only if DOM text is insufficient.
- Available browser tools may be slim: navigate, evaluate, screenshot. Use those names when listed.
- If page content is already present in the compact state, do NOT navigate again. Extract immediately with submit_extraction, then task_complete.
- Never invent missing values. If a field is not visible, set value to null, confidence <= 0.3, and explain.
- Never bypass CAPTCHAs, authentication, rate limits, robots protections, or access controls.
- Never send messages, submit forms, add connections, make purchases, delete data, or perform other external side effects unless the user has explicitly approved that specific action.
- Do not scrape at scale. Respect max pages and follow-link permissions.
- For LinkedIn, act as a human-in-the-loop research assistant: extract only visible business fields the user asked for after they opened the page.
- Keep tool usage minimal. One evaluate + submit_extraction + task_complete is ideal when content is already loaded.
- When extraction is ready, call submit_extraction. When finished, call task_complete.
`;

export function buildTaskUserMessage(
  task: TaskConfig,
  page: CompactPageState | null,
  stepSummary: string,
): string {
  const schema = JSON.stringify(task.extractionSchema, null, 0);
  const hasContent = Boolean(page?.summary && page.summary !== 'Not loaded yet');
  const pageBlock = page
    ? `Current page: ${page.title} | ${page.url}\nPages visited: ${page.pagesVisited}\nCompact state:\n${page.summary}`
    : 'No page state yet — navigate to the starting URL first.';

  const nextHint = hasContent
    ? 'Page content is already available. Call submit_extraction now with evidenced field values, then task_complete. Do not navigate again.'
    : 'Proceed with the next minimal action (navigate, then evaluate).';

  return [
    `Objective: ${task.objective}`,
    `Starting URL: ${task.startingUrl}`,
    `Permissions: followLinks=${task.permissions.allowFollowLinks}, maxPages=${task.permissions.maxPages}, export=${task.permissions.allowExport}`,
    `Extraction schema: ${schema}`,
    pageBlock,
    `Prior steps (compact): ${stepSummary || '(none)'}`,
    nextHint,
  ].join('\n');
}

export function compactSnapshotText(text: string, max = 3500): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}…[truncated]`;
}

export function schemaFieldNames(schema: ExtractionSchema): string[] {
  return schema.fields.map((f) => f.name);
}
