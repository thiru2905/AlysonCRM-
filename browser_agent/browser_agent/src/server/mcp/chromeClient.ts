import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { getConfig } from '../config.js';

export type McpToolDef = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export class ChromeMcpClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  connected = false;
  lastError: string | null = null;

  async connect(mode: 'launch' | 'attach' = 'launch', browserUrlOverride?: string): Promise<void> {
    await this.disconnect();
    const cfg = getConfig();
    const args = ['-y', 'chrome-devtools-mcp@latest', '--slim', '--no-usage-statistics'];

    const attachUrl =
      browserUrlOverride ??
      (mode === 'attach' && cfg.chromeBrowserUrl ? cfg.chromeBrowserUrl : null);

    if (attachUrl) {
      args.push(`--browser-url=${attachUrl}`);
    } else {
      args.push(`--user-data-dir=${cfg.chromeUserDataDir}`);
      if (cfg.chromeStealthMode) {
        args.push('--ignore-default-chrome-arg=--enable-automation');
      }
    }

    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }

    this.transport = new StdioClientTransport({
      command: 'npx',
      args,
      env,
    });

    this.client = new Client({ name: 'browser-agent', version: '0.1.0' }, { capabilities: {} });

    try {
      await this.client.connect(this.transport);
      this.connected = true;
      this.lastError = null;
    } catch (err) {
      this.connected = false;
      this.lastError = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.transport?.close();
    } catch {
      /* ignore */
    }
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  async listTools(): Promise<McpToolDef[]> {
    if (!this.client) throw new Error('MCP client not connected');
    const result = await this.client.listTools();
    return (result.tools || []).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown> | undefined,
    }));
  }

  async callTool(
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<{ content: unknown; isError?: boolean; text: string }> {
    if (!this.client) throw new Error('MCP client not connected');
    const result = await this.client.callTool({ name, arguments: args });
    const content = result.content;
    const text = contentToText(content);
    return {
      content,
      isError: Boolean(result.isError),
      text,
    };
  }
}

function contentToText(content: unknown): string {
  if (!Array.isArray(content)) return String(content ?? '');
  return content
    .map((part) => {
      if (part && typeof part === 'object' && 'type' in part) {
        const p = part as { type: string; text?: string };
        if (p.type === 'text') return p.text ?? '';
        return JSON.stringify(part);
      }
      return String(part);
    })
    .join('\n')
    .slice(0, 12_000);
}

let singleton: ChromeMcpClient | null = null;

export function getMcpClient(): ChromeMcpClient {
  if (!singleton) singleton = new ChromeMcpClient();
  return singleton;
}
