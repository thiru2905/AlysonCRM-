import type { HermesMissionKind, HermesMissionConfig } from "./types";
import { getLinkedInSafetyMessage, isLinkedInOutreachEnabled } from "@/lib/agent/linkedin/safety";

function modeLabel(): string {
  if (!isLinkedInOutreachEnabled()) {
    return "DRAFT-ONLY MODE: prepare connection drafts and message drafts — do NOT click Send.";
  }
  return (
    "LIVE OUTREACH: After user approval, send real connection requests with human-paced timing — " +
    "scroll the profile, wait 2–6s between clicks, and pause ~45s between profiles."
  );
}

export function buildHermesAutomationPrompt(input: {
  name: string;
  kind: HermesMissionKind;
  config: HermesMissionConfig;
}): string {
  const { name, kind, config } = input;
  const count = Math.max(1, Math.min(config.count, 25));
  const lines: string[] = [
    `[Hermes Engine mission: ${name}]`,
    "",
    "You are Hermes, the browser automation engine. Execute this LinkedIn mission on the user's machine:",
    "",
    `Audience: ${config.audience}`,
    `Target count: ${count} profile(s)`,
    "",
    "Steps:",
    "1. Launch or focus Chrome using the Alyson browser profile.",
    "2. Navigate to LinkedIn (https://www.linkedin.com) and ensure the user is logged in.",
  ];

  if (config.searchUrl?.trim()) {
    lines.push(`3. Open this LinkedIn search URL: ${config.searchUrl.trim()}`);
    lines.push("4. From the search results, open profiles one at a time.");
  } else {
    lines.push(
      `3. Search LinkedIn for people matching: "${config.audience}".`,
      "4. Open matching profiles one at a time from the results."
    );
  }

  const stepBase = config.searchUrl?.trim() ? 5 : 5;

  if (kind === "search_only") {
    lines.push(
      `${stepBase}. For each profile (up to ${count}), capture name, title, company, location, and profile URL.`,
      `${stepBase + 1}. Save results to CRM profiles — do not send connections or messages.`,
      "",
      modeLabel()
    );
    return lines.join("\n");
  }

  const outreachLive = isLinkedInOutreachEnabled();

  if (kind === "connect" || kind === "connect_and_message") {
    const note = config.connectionNote?.trim();
    lines.push(
      `${stepBase}. For each profile (up to ${count}):`,
      "   - Open the profile page",
      note
        ? `   - Prepare a connection request with note: "${note}"`
        : "   - Prepare a connection request (no note unless required)",
      outreachLive
        ? "   - Submit after user approval (use human pacing: read profile, scroll, pause before Connect)"
        : "   - STOP at the draft/review step — do not submit the connection"
    );
  }

  if (kind === "message" || kind === "connect_and_message") {
    const template =
      config.messageTemplate?.trim() ??
      "Hi {{name}}, I came across your profile and would love to connect.";
    lines.push(
      "",
      "Messaging:",
      `   - Use this template: "${template}"`,
      "   - Replace {{name}}, {{company}}, {{title}} with profile data",
      outreachLive
        ? "   - Send after user approval with human-paced delays"
        : "   - Prepare the message draft only — do not click Send"
    );
  }

  lines.push(
    "",
    "After each profile, sync captured data back to Alyson CRM.",
    "",
    modeLabel(),
    "",
    getLinkedInSafetyMessage()
  );

  return lines.join("\n");
}

export function kindLabel(kind: HermesMissionKind): string {
  switch (kind) {
    case "connect":
      return "Connection requests";
    case "message":
      return "Direct messages";
    case "connect_and_message":
      return "Connect + message";
    case "search_only":
      return "Search & save profiles";
  }
}
