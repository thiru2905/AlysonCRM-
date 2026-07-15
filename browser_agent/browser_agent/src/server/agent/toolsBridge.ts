import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { McpToolDef } from '../mcp/chromeClient.js';

export function mcpToolsToOpenAI(tools: McpToolDef[]): ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description || `Chrome DevTools MCP tool: ${t.name}`,
      parameters: normalizeSchema(t.inputSchema),
    },
  }));
}

function normalizeSchema(schema: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') {
    return { type: 'object', properties: {} };
  }
  // OpenAI expects a JSON schema object; strip unsupported $schema if present
  const { $schema: _s, ...rest } = schema as Record<string, unknown> & { $schema?: unknown };
  if (!rest.type) rest.type = 'object';
  return rest;
}

/** Built-in agent control tools (not MCP). */
export const AGENT_CONTROL_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'submit_extraction',
      description:
        'Submit a structured extraction result for the current page. Do not invent missing values; use null with low confidence and an explanation.',
      parameters: {
        type: 'object',
        properties: {
          recordType: { type: 'string' },
          pageTitle: { type: 'string' },
          sourceUrl: { type: 'string' },
          fields: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                value: {},
                confidence: { type: 'number' },
                evidence: { type: 'string' },
                source_url: { type: 'string' },
                explanation: { type: 'string' },
              },
              required: ['value', 'confidence', 'evidence', 'source_url'],
            },
          },
          selectors: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Optional CSS selectors discovered for deterministic re-extraction',
          },
        },
        required: ['recordType', 'pageTitle', 'sourceUrl', 'fields'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'task_complete',
      description: 'Mark the task as complete with a short summary.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
        },
        required: ['summary'],
      },
    },
  },
];
