// ---------------------------------------------------------------------------
// LinkedIn provider abstraction — Chrome MVP, LinkedAPI future.
// ---------------------------------------------------------------------------

export interface LinkedInProfile {
  name: string;
  profileUrl: string;
  title?: string;
  company?: string;
  location?: string;
  headline?: string;
}

export interface LinkedInProvider {
  checkLogin(): Promise<{ loggedIn: boolean; profileUrl?: string }>;
  searchPeople(query: string, limit?: number): Promise<LinkedInProfile[]>;
  openProfile(profileUrl: string): Promise<void>;
  extractProfile(profileUrl: string): Promise<LinkedInProfile>;
  checkConnection(profileUrl: string): Promise<"connected" | "pending" | "none">;
  sendConnectionRequest(
    profileUrl: string,
    message?: string
  ): Promise<{ status: "pending_approval" | "sent" }>;
  sendMessage(
    profileUrl: string,
    message: string
  ): Promise<{ status: "pending_approval" | "sent" }>;
  readInbox(limit?: number): Promise<Array<{ from: string; snippet: string; url: string }>>;
  createReplyDraft(profileUrl: string, context: string): Promise<string>;
}

const BROWSER_AGENT_URL =
  process.env.ALYSON_BROWSER_AGENT_URL?.trim() ?? "http://127.0.0.1:8820";

async function callDesktopTool(
  tool: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${BROWSER_AGENT_URL}/api/agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  if (!res.ok) {
    throw new Error(`Browser tool failed: ${tool}`);
  }
  return res.json();
}

/** MVP: LinkedIn actions via dedicated Chrome profile + browser agent bridge. */
export class ChromeLinkedInProvider implements LinkedInProvider {
  async checkLogin(): Promise<{ loggedIn: boolean; profileUrl?: string }> {
    const result = (await callDesktopTool("linkedin.check_login", {})) as {
      loggedIn: boolean;
      profileUrl?: string;
    };
    return result;
  }

  async searchPeople(query: string, limit = 10): Promise<LinkedInProfile[]> {
    const result = (await callDesktopTool("linkedin.search_people", {
      query,
      limit,
    })) as { profiles: LinkedInProfile[] };
    return result.profiles ?? [];
  }

  async openProfile(profileUrl: string): Promise<void> {
    await callDesktopTool("linkedin.open_profile", { profileUrl });
  }

  async extractProfile(profileUrl: string): Promise<LinkedInProfile> {
    const result = (await callDesktopTool("linkedin.extract_profile", {
      profileUrl,
    })) as LinkedInProfile;
    return result;
  }

  async checkConnection(
    profileUrl: string
  ): Promise<"connected" | "pending" | "none"> {
    const result = (await callDesktopTool("linkedin.check_connection", {
      profileUrl,
    })) as { status: "connected" | "pending" | "none" };
    return result.status;
  }

  async sendConnectionRequest(
    profileUrl: string,
    message?: string
  ): Promise<{ status: "pending_approval" | "sent" }> {
    return (await callDesktopTool("linkedin.send_connection_request", {
      profileUrl,
      message,
    })) as { status: "pending_approval" | "sent" };
  }

  async sendMessage(
    profileUrl: string,
    message: string
  ): Promise<{ status: "pending_approval" | "sent" }> {
    return (await callDesktopTool("linkedin.send_message", {
      profileUrl,
      message,
    })) as { status: "pending_approval" | "sent" };
  }

  async readInbox(limit = 20) {
    const result = (await callDesktopTool("linkedin.read_inbox", { limit })) as {
      messages: Array<{ from: string; snippet: string; url: string }>;
    };
    return result.messages ?? [];
  }

  async createReplyDraft(profileUrl: string, context: string): Promise<string> {
    const result = (await callDesktopTool("linkedin.create_reply_draft", {
      profileUrl,
      context,
    })) as { draft: string };
    return result.draft;
  }
}

/** Future adapter — swap without frontend changes. */
export class LinkedAPIProvider implements LinkedInProvider {
  async checkLogin() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async searchPeople() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async openProfile() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async extractProfile() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async checkConnection() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async sendConnectionRequest() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async sendMessage() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async readInbox() {
    throw new Error("LinkedAPI provider not configured.");
  }
  async createReplyDraft() {
    throw new Error("LinkedAPI provider not configured.");
  }
}

export function getLinkedInProvider(): LinkedInProvider {
  const mode = process.env.LINKEDIN_PROVIDER?.trim() ?? "chrome";
  if (mode === "linkedapi") return new LinkedAPIProvider();
  return new ChromeLinkedInProvider();
}
