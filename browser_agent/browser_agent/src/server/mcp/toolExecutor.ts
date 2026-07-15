import { getMcpClient } from "./chromeClient.js";
import { getBrowserController } from "./browserController.js";
import { applyStealthToActivePage } from "./chromeStealth.js";
import { assertLinkedInToolAllowed, isLinkedInOutreachEnabled } from "./linkedinSafety.js";
import { humanDelay, simulateProfileReading, betweenProfileDelay } from "./humanPacing.js";
import {
  CLICK_CONNECT_SCRIPT,
  EXTRACT_PROFILE_SCRIPT,
  EXTRACT_SEARCH_PROFILES_SCRIPT,
  OPEN_PROFILE_BY_INDEX_SCRIPT,
  SCROLL_SEARCH_RESULTS_SCRIPT,
  SEND_INVITATION_SCRIPT,
} from "./linkedinDom.js";

export interface ToolResult {
  tool: string;
  status: "success" | "error" | "pending_approval";
  timestamp: string;
  screenshot?: string | null;
  error?: string | null;
  data?: unknown;
}

function ok(tool: string, data?: unknown, screenshot?: string | null): ToolResult {
  return {
    tool,
    status: "success",
    timestamp: new Date().toISOString(),
    screenshot: screenshot ?? null,
    data,
  };
}

function fail(tool: string, error: string): ToolResult {
  return {
    tool,
    status: "error",
    timestamp: new Date().toISOString(),
    error,
  };
}

function isChromeConnectionError(message: string): boolean {
  return /9222|Could not connect to Chrome|Chrome MCP is not connected|MCP client not connected|fetch failed|ECONNREFUSED/i.test(
    message
  );
}

async function mcp(name: string, args: Record<string, unknown> = {}) {
  const run = async () => {
    const mcpClient = getMcpClient();
    if (!mcpClient.connected) {
      throw new Error("Chrome MCP is not connected. Start the browser agent server.");
    }
    return mcpClient.callTool(name, args);
  };

  try {
    return await run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isChromeConnectionError(message)) throw err;
    await getBrowserController().ensureReady();
    return run();
  }
}

async function stealthPage(): Promise<void> {
  await applyStealthToActivePage(mcp);
}

async function navigateWithStealth(url: string): Promise<{ text: string }> {
  const result = await mcp("navigate", { url });
  await humanDelay(800, 2000);
  await stealthPage();
  return result;
}

async function resolveProfileTargetArgs(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const resolved = { ...args };
  let profileUrl = String(resolved.profileUrl ?? "").trim();
  const profileIndex =
    resolved.profileIndex !== undefined ? Number(resolved.profileIndex) : undefined;

  if (!profileUrl && profileIndex !== undefined && !Number.isNaN(profileIndex) && profileIndex >= 0) {
    const fromSearch = await extractProfilesFromDom(profileIndex + 1);
    const match = fromSearch[profileIndex];
    if (match?.profileUrl) {
      resolved.profileUrl = match.profileUrl;
      resolved.name = resolved.name ?? match.name;
      resolved.title = resolved.title ?? match.title;
      resolved.company = resolved.company ?? match.company;
    }
  }

  return resolved;
}

async function openProfileTarget(args: Record<string, unknown>): Promise<string> {
  const resolved = await resolveProfileTargetArgs(args);
  const profileUrl = String(resolved.profileUrl ?? "").trim();
  const profileIndex = resolved.profileIndex !== undefined ? Number(resolved.profileIndex) : -1;

  if (profileUrl) {
    await navigateWithStealth(profileUrl);
    const page = await waitForProfilePage();
    if (!page.ready) {
      throw new Error(
        page.signIn
          ? "Not logged into LinkedIn — open the Alyson Chrome window and sign in, then retry."
          : "Profile page did not load — wait a few seconds and try again."
      );
    }
    const snap = await pageSnapshot();
    return snap.url || profileUrl;
  }

  if (profileIndex >= 0) {
    await humanDelay(700, 1500);
    const openResult = await mcp("evaluate", { script: OPEN_PROFILE_BY_INDEX_SCRIPT(profileIndex) });
    let parsed: { ok?: boolean; error?: string } = {};
    try {
      parsed = JSON.parse(openResult.text) as typeof parsed;
    } catch {
      parsed = { ok: false, error: openResult.text };
    }
    if (!parsed.ok) {
      throw new Error(parsed.error ?? `Could not open profile #${profileIndex + 1} from search results`);
    }
    await humanDelay(2500, 4500);
    await stealthPage();
    const snap = await pageSnapshot();
    return snap.url;
  }

  throw new Error("profileUrl or profileIndex is required to open a LinkedIn profile");
}

function parseDomJson(text: string): Record<string, unknown> {
  const raw = (text ?? "").trim();
  if (!raw) return { ok: false, error: "Empty DOM response" };
  try {
    const once = JSON.parse(raw);
    if (typeof once === "string") {
      try {
        return JSON.parse(once) as Record<string, unknown>;
      } catch {
        return { ok: false, error: once };
      }
    }
    return once as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        /* fall through */
      }
    }
    return { ok: false, error: raw };
  }
}

async function waitForProfilePage(): Promise<{ ready: boolean; name: string; signIn: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await humanDelay(attempt === 0 ? 2500 : 2000, attempt === 0 ? 4500 : 3500);
    const result = await mcp("evaluate", {
      script: `(() => {
        const name =
          document.querySelector("h1")?.textContent?.trim() ||
          document.querySelector("main h1")?.textContent?.trim() ||
          document.querySelector('[data-view-name*="profile"] h1')?.textContent?.trim() ||
          document.title.replace(/\\s*\\|.*$/, "").trim() ||
          "";
        const body = (document.body?.innerText || "").toLowerCase();
        const signIn = body.includes("sign in") || body.includes("join linkedin");
        const onProfile = location.pathname.includes("/in/");
        const hasActions = /\\b(connect|message|pending|follow)\\b/i.test(body);
        const ready = onProfile && !signIn && (Boolean(name) || hasActions);
        return JSON.stringify({ name, signIn, ready, onProfile, hasActions });
      })()`,
    });
    const parsed = parseDomJson(result.text);
    if (Boolean(parsed.ready)) {
      return {
        ready: true,
        name: String(parsed.name ?? ""),
        signIn: Boolean(parsed.signIn),
      };
    }
  }
  const last = parseDomJson(
    (
      await mcp("evaluate", {
        script: `JSON.stringify({ name: document.title, signIn: (document.body?.innerText||'').toLowerCase().includes('sign in') })`,
      })
    ).text
  );
  return {
    ready: false,
    name: String(last.name ?? ""),
    signIn: Boolean(last.signIn),
  };
}

type ConnectClickResult = {
  ok?: boolean;
  name?: string;
  profileUrl?: string;
  error?: string;
  alreadyPending?: boolean;
  alreadyConnected?: boolean;
  visibleButtons?: string[];
};

async function clickConnectOnce(): Promise<ConnectClickResult> {
  const clickResult = await mcp("evaluate", { script: CLICK_CONNECT_SCRIPT });
  return parseDomJson(clickResult.text) as ConnectClickResult;
}

async function submitLinkedInConnect(note: string): Promise<{
  ok: boolean;
  name?: string;
  profileUrl?: string;
  error?: string;
  alreadyPending?: boolean;
  alreadyConnected?: boolean;
}> {
  const page = await waitForProfilePage();
  if (!page.ready) {
    return {
      ok: false,
      error: page.signIn
        ? "Not logged into LinkedIn — sign in via the Alyson Chrome window first."
        : "Profile page did not load before Connect — retry in a few seconds.",
    };
  }

  let parsed = await clickConnectOnce();
  if (!parsed.ok && String(parsed.error ?? "").includes("not found")) {
    await humanDelay(1500, 2500);
    parsed = await clickConnectOnce();
  }
  if (!parsed.ok && String(parsed.error ?? "").includes("not found")) {
    await humanDelay(2000, 3500);
    parsed = await clickConnectOnce();
  }
  if (!parsed.ok) {
    const detail = parsed.visibleButtons?.length
      ? `${parsed.error ?? "Connect failed"} (visible: ${parsed.visibleButtons.join(" | ")})`
      : (parsed.error ?? "Connect failed");
    return { ok: false, error: detail, ...parsed };
  }

  if (!parsed.alreadyPending) {
    await humanDelay(1200, 2200);
    const noteToSend = note.trim();
    let sendParsed: Record<string, unknown> = { ok: false, action: "send_not_found" };
    for (let attempt = 0; attempt < 4; attempt++) {
      const sendResult = await mcp("evaluate", {
        script: SEND_INVITATION_SCRIPT(noteToSend || null),
      });
      sendParsed = parseDomJson(sendResult.text);
      if (sendParsed.ok === true) break;
      if (String(sendParsed.action ?? "").includes("not_found")) {
        await humanDelay(800, 1500);
        continue;
      }
      break;
    }
    await humanDelay(1200, 2400);

    const verifyResult = await mcp("evaluate", {
      script: `(() => {
        const labels = [...document.querySelectorAll("button, a, [role='button']")]
          .map((el) => (el.innerText || el.getAttribute("aria-label") || "").trim().toLowerCase())
          .filter(Boolean);
        const pending = labels.some((t) => t === "pending" || t.includes("pending"));
        const connected = labels.some((t) => t === "message" || t.startsWith("message "));
        return JSON.stringify({ pending, connected });
      })()`,
    });
    const verified = parseDomJson(verifyResult.text);
    if (verified.pending || parsed.alreadyPending) {
      return { ok: true, ...parsed, status: "connection_sent" };
    }
    if (sendParsed.ok === false && !verified.connected) {
      return {
        ok: false,
        error: `Connect clicked but invitation not confirmed (send: ${String(sendParsed.action ?? "unknown")})`,
        ...parsed,
      };
    }
  }
  await betweenProfileDelay();
  return { ok: true, ...parsed, status: "connection_sent" };
}

async function captureScreenshot(): Promise<string | null> {
  try {
    const shot = await mcp("screenshot", {});
    const match = shot.text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    return match?.[0] ?? (shot.text.slice(0, 500) || null);
  } catch {
    return null;
  }
}

async function pageSnapshot(): Promise<{ url: string; title: string; text: string }> {
  const result = await mcp("evaluate", {
    script: `(() => JSON.stringify({
      url: location.href,
      title: document.title,
      text: (document.body?.innerText || '').slice(0, 12000)
    }))()`,
  });
  const parsed = parseDomJson(result.text);
  if (parsed.url || parsed.text || parsed.title) {
    return {
      url: String(parsed.url ?? ""),
      title: String(parsed.title ?? ""),
      text: String(parsed.text ?? ""),
    };
  }
  return { url: "", title: "", text: result.text ?? "" };
}

function parseLinkedInProfiles(text: string, limit = 10) {
  const profiles: Array<{
    name: string;
    profileUrl: string;
    title?: string;
    company?: string;
    location?: string;
  }> = [];
  const urlRe = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
  const urls = [...new Set(text.match(urlRe) ?? [])].slice(0, limit);
  for (const profileUrl of urls) {
    const slug = profileUrl.split("/in/")[1]?.replace(/\/$/, "") ?? "Unknown";
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    profiles.push({ name, profileUrl });
  }
  return profiles;
}

async function extractProfileFromPage(): Promise<{
  name: string;
  profileUrl: string;
  title?: string;
  company?: string;
  location?: string;
  headline?: string;
}> {
  const result = await mcp("evaluate", { script: EXTRACT_PROFILE_SCRIPT });
  try {
    const parsed = JSON.parse(result.text) as {
      name: string;
      profileUrl: string;
      title?: string;
      company?: string;
      location?: string;
      headline?: string;
    };
    if (parsed.name && parsed.profileUrl) return parsed;
  } catch {
    /* fall through */
  }
  const snap = await pageSnapshot();
  const nameMatch = (snap.text ?? "").match(/^[A-Z][^\n]{1,60}/m);
  return {
    name: nameMatch?.[0]?.trim() ?? "LinkedIn Prospect",
    profileUrl: snap.url,
    headline: snap.text.slice(0, 200),
  };
}

type SearchProfile = {
  name: string;
  profileUrl: string;
  title?: string;
  company?: string;
  location?: string;
};

function sanitizeSearchProfiles(raw: unknown, limit: number): SearchProfile[] {
  let list: unknown[] = [];

  const absorb = (value: unknown) => {
    if (Array.isArray(value)) {
      list = value;
      return;
    }
    if (typeof value === "string") {
      try {
        absorb(JSON.parse(value));
      } catch {
        const start = value.indexOf("[");
        const end = value.lastIndexOf("]");
        if (start >= 0 && end > start) {
          try {
            absorb(JSON.parse(value.slice(start, end + 1)));
          } catch {
            /* ignore */
          }
        }
      }
    }
  };

  absorb(raw);

  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const profileUrl = String(rec.profileUrl ?? rec.profile_url ?? "").trim();
      const name = String(rec.name ?? "").trim();
      if (!profileUrl || !name) return null;
      return {
        name,
        profileUrl,
        title: rec.title ? String(rec.title) : undefined,
        company: rec.company ? String(rec.company) : undefined,
        location: rec.location ? String(rec.location) : undefined,
      };
    })
    .filter((p): p is SearchProfile => Boolean(p))
    .slice(0, limit);
}

async function extractProfilesFromDom(limit = 10): Promise<SearchProfile[]> {
  const result = await mcp("evaluate", { script: EXTRACT_SEARCH_PROFILES_SCRIPT });
  return sanitizeSearchProfiles(result.text, limit);
}

export async function executeAgentTool(
  tool: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (tool) {
      case "browser.launch": {
        const controller = getBrowserController();
        if (!getMcpClient().connected) {
          await controller.connect("launch");
        }
        await stealthPage();
        const tab = await controller.refreshActiveTab();
        const status = controller.getStatus();
        return ok(tool, {
          launched: true,
          mcpConnected: getMcpClient().connected,
          activeTab: tab,
          profileDir: status.userDataDir,
          chromeMode: status.chromeMode,
          stealthMode: true,
          notice:
            "Hermes opened a normal Chrome profile (no test-software banner). Log into LinkedIn once in this window.",
        });
      }
      case "browser.close": {
        return ok(tool, { closed: true });
      }
      case "browser.navigate":
      case "browser.open_tab": {
        const url = String(args.url ?? "about:blank");
        const result = await navigateWithStealth(url);
        const shot = await captureScreenshot();
        return ok(tool, { url, text: result.text }, shot);
      }
      case "browser.list_tabs":
      case "browser.get_url": {
        const snap = await pageSnapshot();
        return ok(tool, { url: snap.url, title: snap.title });
      }
      case "browser.click":
      case "browser.type": {
        const result = await mcp("evaluate", {
          script: `'Action ${tool} requested — use approval flow for writes'`,
        });
        const shot = await captureScreenshot();
        return ok(tool, { text: result.text }, shot);
      }
      case "browser.scroll": {
        const result = await mcp("evaluate", {
          script: "window.scrollBy(0, 600); 'scrolled'",
        });
        return ok(tool, { text: result.text });
      }
      case "browser.extract":
      case "browser.get_text":
      case "browser.find_element": {
        const snap = await pageSnapshot();
        return ok(tool, { text: snap.text, url: snap.url, title: snap.title });
      }
      case "browser.screenshot": {
        const shot = await captureScreenshot();
        return ok(tool, { captured: Boolean(shot) }, shot);
      }
      case "browser.wait": {
        const ms = Number(args.ms ?? 1500);
        await humanDelay(ms, ms + 400);
        return ok(tool, { waitedMs: ms });
      }
      case "browser.upload":
      case "browser.download": {
        return {
          tool,
          status: "pending_approval",
          timestamp: new Date().toISOString(),
          data: args,
        };
      }
      case "linkedin.check_login": {
        await navigateWithStealth("https://www.linkedin.com/feed/");
        const snap = await pageSnapshot();
        const bodyText = (snap.text ?? "").toLowerCase();
        const url = snap.url ?? "";
        const loggedIn =
          !bodyText.includes("sign in") &&
          (url.includes("/feed") || url.includes("/in/") || bodyText.includes("feed"));
        return ok(tool, {
          loggedIn,
          profileUrl: loggedIn ? "https://www.linkedin.com/in/me" : undefined,
          url: url || undefined,
        });
      }
      case "linkedin.search_people": {
        const query = encodeURIComponent(String(args.query ?? "software engineer"));
        const limit = Number(args.limit ?? 10);
        await navigateWithStealth(
          `https://www.linkedin.com/search/results/people/?keywords=${query}`
        );
        await humanDelay(2000, 4500);
        let profiles = await extractProfilesFromDom(limit);
        if (!profiles.length) {
          const snap = await pageSnapshot();
          profiles = sanitizeSearchProfiles(parseLinkedInProfiles(snap.text, limit), limit);
        }
        profiles = sanitizeSearchProfiles(profiles, limit);
        const shot = await captureScreenshot();
        return ok(tool, { profiles, count: profiles.length }, shot);
      }
      case "linkedin.extract_search_profiles": {
        const query = String(args.query ?? "").trim();
        const searchUrl = String(args.searchUrl ?? "").trim();
        const limit = Number(args.limit ?? args.count ?? 10);

        if (searchUrl) {
          await navigateWithStealth(searchUrl);
        } else if (query) {
          await navigateWithStealth(
            `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`
          );
        } else {
          return fail(tool, "query or searchUrl is required to extract profiles");
        }

        await humanDelay(2000, 4000);
        await mcp("evaluate", { script: SCROLL_SEARCH_RESULTS_SCRIPT });
        await humanDelay(1500, 3000);

        let profiles = await extractProfilesFromDom(limit);
        if (!profiles.length) {
          await mcp("evaluate", { script: SCROLL_SEARCH_RESULTS_SCRIPT });
          await humanDelay(1200, 2500);
          profiles = await extractProfilesFromDom(limit);
        }
        if (!profiles.length) {
          const snap = await pageSnapshot();
          profiles = sanitizeSearchProfiles(parseLinkedInProfiles(snap.text, limit), limit);
        }

        profiles = sanitizeSearchProfiles(profiles, limit);

        const shot = await captureScreenshot();
        return ok(
          tool,
          {
            profiles,
            count: profiles.length,
            query: query || undefined,
            searchUrl: searchUrl || undefined,
            notice:
              profiles.length > 0
                ? `Extracted ${profiles.length} profile(s) from LinkedIn — saved to Saved Profiles.`
                : "No profiles found on this search page. Log into LinkedIn in the Alyson Chrome window.",
          },
          shot
        );
      }
      case "linkedin.open_profile": {
        const resolvedUrl = await openProfileTarget(args);
        await simulateProfileReading(mcp);
        const shot = await captureScreenshot();
        return ok(tool, { profileUrl: resolvedUrl }, shot);
      }
      case "linkedin.extract_profile": {
        if (args.profileUrl || args.profileIndex !== undefined) {
          await openProfileTarget(args);
        }
        await simulateProfileReading(mcp);
        const profile = await extractProfileFromPage();
        const shot = await captureScreenshot();
        return ok(tool, profile, shot);
      }
      case "linkedin.connect_from_search": {
        const profileIndex = Number(args.profileIndex ?? 0);
        const query = String(args.query ?? "");
        const searchUrl = String(args.searchUrl ?? "").trim();
        const approved = Boolean(args.approved);
        const note = String(args.message ?? args.connectionNote ?? "").trim();

        if (searchUrl) {
          await navigateWithStealth(searchUrl);
        } else if (query) {
          await navigateWithStealth(
            `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`
          );
        }
        await humanDelay(1500, 3200);

        let profileUrl = String(args.profileUrl ?? "").trim();
        if (!profileUrl) {
          const profiles = await extractProfilesFromDom(profileIndex + 1);
          profileUrl = profiles[profileIndex]?.profileUrl ?? "";
        }

        if (profileUrl) {
          await navigateWithStealth(profileUrl);
        } else {
          await openProfileTarget({ profileIndex });
        }

        await simulateProfileReading(mcp);
        const profile = await extractProfileFromPage();
        const name = profile.name;
        profileUrl = profile.profileUrl || profileUrl;

        if (!approved) {
          const shot = await captureScreenshot();
          const liveOutreach = isLinkedInOutreachEnabled();
          return {
            tool,
            status: "pending_approval",
            timestamp: new Date().toISOString(),
            screenshot: shot,
            data: {
              name,
              profileUrl,
              company: profile.company ?? args.company,
              title: profile.title ?? args.title,
              location: profile.location,
              message: note,
              preview: profile.headline ?? "",
              draftOnly: !liveOutreach,
              notice: liveOutreach
                ? "Approve in Hermes — Chrome will send this invite with human-paced timing."
                : "Draft only — enable LINKEDIN_SEND_ON_APPROVE=true in .env to send after approval.",
            },
          };
        }

        try {
          assertLinkedInToolAllowed("linkedin.send_connection_request", true);
        } catch (err) {
          return ok(tool, {
            name,
            profileUrl,
            status: "draft_saved",
            notice: err instanceof Error ? err.message : "Outreach blocked",
          });
        }

        const sent = await submitLinkedInConnect(note);
        const shot = await captureScreenshot();
        if (!sent.ok) {
          return fail(tool, sent.error ?? "Could not send connection request");
        }
        return ok(
          tool,
          {
            name: sent.name ?? name,
            profileUrl: sent.profileUrl ?? profileUrl,
            status: "connection_sent",
            message: note,
            company: profile.company ?? args.company,
            title: profile.title ?? args.title,
            location: profile.location,
          },
          shot
        );
      }
      case "linkedin.check_connection": {
        const profileUrl = String(args.profileUrl ?? "");
        if (profileUrl) await navigateWithStealth(profileUrl);
        await humanDelay(1200, 2800);
        const checkResult = await mcp("evaluate", {
          script: `(() => {
            const profileUrl = location.href;
            const name = document.querySelector('h1')?.textContent?.trim() || '';
            const labels = [...document.querySelectorAll('button, a[role="button"], span.artdeco-button__text')]
              .map(el => (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase())
              .filter(Boolean);
            let status = 'none';
            if (labels.some(t => t === 'message' || t.startsWith('message '))) status = 'connected';
            else if (labels.some(t => t === 'pending' || t.includes('pending'))) status = 'pending';
            else if (labels.some(t => t === 'connect' || t.startsWith('connect ') || t.includes('invite') && t.includes('connect'))) status = 'none';
            return JSON.stringify({ status, name, profileUrl });
          })()`,
        });
        const parsed = parseDomJson(checkResult.text) as {
          status?: string;
          name?: string;
          profileUrl?: string;
        };
        const shot = await captureScreenshot();
        return ok(
          tool,
          {
            status: parsed.status ?? "unknown",
            name: parsed.name,
            profileUrl: parsed.profileUrl ?? profileUrl,
          },
          shot
        );
      }
      case "linkedin.send_connection_request":
      case "linkedin.send_message": {
        const approved = Boolean(args.approved);
        const resolvedArgs = await resolveProfileTargetArgs(args);
        let profileUrl = String(resolvedArgs.profileUrl ?? "").trim();
        if (!approved) {
          try {
            if (profileUrl || resolvedArgs.profileIndex !== undefined) {
              await openProfileTarget(resolvedArgs);
              profileUrl = profileUrl || (await pageSnapshot()).url;
            }
          } catch (err) {
            return fail(tool, err instanceof Error ? err.message : "Could not open profile");
          }
          await simulateProfileReading(mcp);
          const snap = await pageSnapshot();
          const shot = await captureScreenshot();
          const snapText = snap.text ?? "";
          const name = snapText.match(/^[^\n]+/)?.[0]?.trim() ?? String(resolvedArgs.name ?? "LinkedIn prospect");
          const liveOutreach = isLinkedInOutreachEnabled();
          const notePreview = String(resolvedArgs.message ?? resolvedArgs.connectionNote ?? "").trim();
          return {
            tool,
            status: "pending_approval",
            timestamp: new Date().toISOString(),
            screenshot: shot,
            data: {
              name: String(resolvedArgs.name ?? name),
              profileUrl: profileUrl || snap.url,
              company: resolvedArgs.company,
              title: resolvedArgs.title,
              message: notePreview || undefined,
              preview: snapText.slice(0, 300),
              draftOnly: !liveOutreach,
              notice: liveOutreach
                ? notePreview
                  ? "Approve in Hermes — Chrome will send this invite with your note."
                  : "Approve in Hermes — Chrome will click Send without a note on LinkedIn."
                : "Draft only — enable LINKEDIN_SEND_ON_APPROVE=true in .env to send after approval.",
            },
          };
        }
        try {
          assertLinkedInToolAllowed(tool, approved);
        } catch (err) {
          const snap = await pageSnapshot();
          const name = (snap.text ?? "").match(/^[^\n]+/)?.[0]?.trim() ?? "LinkedIn prospect";
          return ok(tool, {
            name,
            profileUrl: profileUrl || snap.url,
            status: "draft_saved",
            draft: `Hi ${name}, I'd love to connect.`,
            notice: err instanceof Error ? err.message : "Outreach blocked for account safety.",
          });
        }

        try {
          if (profileUrl || resolvedArgs.profileIndex !== undefined) {
            await openProfileTarget(resolvedArgs);
            profileUrl = profileUrl || (await pageSnapshot()).url;
          }
          await simulateProfileReading(mcp);
        } catch (err) {
          return fail(tool, err instanceof Error ? err.message : "Could not open profile");
        }

        const note = String(resolvedArgs.message ?? resolvedArgs.connectionNote ?? "").trim();
        const sent = await submitLinkedInConnect(note);
        const snap = await pageSnapshot();
        const shot = await captureScreenshot();
        if (!sent.ok) {
          if (sent.alreadyConnected) {
            return ok(tool, {
              name: sent.name ?? String(resolvedArgs.name ?? "LinkedIn prospect"),
              profileUrl: sent.profileUrl ?? profileUrl,
              status: "connected",
              notice: "Already connected on LinkedIn",
            }, shot);
          }
          return fail(tool, sent.error ?? "Could not click Connect");
        }
        return ok(
          tool,
          {
            name: sent.name ?? "LinkedIn prospect",
            profileUrl: (sent.profileUrl ?? profileUrl) || snap.url,
            status: "connection_sent",
            message: resolvedArgs.message,
            company: resolvedArgs.company,
            title: resolvedArgs.title,
          },
          shot
        );
      }
      case "linkedin.read_inbox": {
        await navigateWithStealth("https://www.linkedin.com/messaging/");
        const snap = await pageSnapshot();
        return ok(tool, {
          messages: [
            {
              from: "Inbox",
              snippet: snap.text.slice(0, 120),
              url: "https://www.linkedin.com/messaging/",
            },
          ],
        });
      }
      case "linkedin.create_reply_draft": {
        const name = String(args.profileUrl ?? "prospect").split("/in/")[1] ?? "there";
        const draft = `Hi ${name.replace(/-/g, " ")}, I noticed your work and would love to connect.`;
        return ok(tool, { draft });
      }
      default: {
        const result = await mcp(tool.replace(/^browser\./, ""), args);
        return ok(tool, { text: result.text });
      }
    }
  } catch (err) {
    return fail(tool, err instanceof Error ? err.message : String(err));
  }
}
