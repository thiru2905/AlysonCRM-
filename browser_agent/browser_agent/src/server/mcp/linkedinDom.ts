/** DOM helpers for LinkedIn search + Connect flow (human-like selectors). */

export const EXTRACT_PROFILE_SCRIPT = `
(() => {
  const name =
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector(".pv-top-card h1")?.textContent?.trim() ||
    "";
  const headline =
    document.querySelector(".text-body-medium")?.textContent?.trim() ||
    document.querySelector("[data-generated-suggestion-target]")?.textContent?.trim() ||
    "";
  const location =
    document.querySelector(".text-body-small.inline.t-black--light.break-words")?.textContent?.trim() ||
    "";
  let title = headline;
  let company = "";
  if (headline.includes(" at ")) {
    const parts = headline.split(" at ");
    title = parts[0]?.trim() || headline;
    company = parts.slice(1).join(" at ").trim();
  }
  const experienceCompany = document.querySelector("#experience ~ div li span[aria-hidden='true']")?.textContent?.trim();
  if (!company && experienceCompany) company = experienceCompany;
  return JSON.stringify({
    name,
    profileUrl: window.location.href.split("?")[0],
    title,
    company,
    location,
    headline,
  });
})()
`.trim();

export const EXTRACT_SEARCH_PROFILES_SCRIPT = `
(() => {
  const seen = new Map();
  const anchors = [...document.querySelectorAll('a[href*="/in/"]')];
  for (const a of anchors) {
    const href = (a.href || "").split("?")[0].replace(/\\/$/, "");
    if (!href.includes("/in/") || href.endsWith("/in")) continue;
    const slug = href.split("/in/")[1] || "";
    if (!slug || slug.length < 2) continue;
    let name = (a.innerText || a.textContent || "").trim().split("\\n")[0]?.trim() || "";
    if (!name || name.length < 2 || name.length > 80) {
      name = slug.replace(/-/g, " ").replace(/\\b\\w/g, (c) => c.toUpperCase());
    }
    if (!seen.has(href)) seen.set(href, { name, profileUrl: href });
  }
  return JSON.stringify([...seen.values()]);
})()
`.trim();

export const SCROLL_SEARCH_RESULTS_SCRIPT = `
(() => {
  for (let i = 0; i < 4; i++) {
    window.scrollBy({ top: 700 + Math.floor(Math.random() * 200), behavior: "smooth" });
  }
  return "scrolled";
})()
`.trim();

export const OPEN_PROFILE_BY_INDEX_SCRIPT = (index: number) => `
(() => {
  const seen = new Map();
  const anchors = [...document.querySelectorAll('a[href*="/in/"]')];
  for (const a of anchors) {
    const href = (a.href || "").split("?")[0].replace(/\\/$/, "");
    if (!href.includes("/in/") || href.endsWith("/in")) continue;
    if (!seen.has(href)) seen.set(href, a);
  }
  const links = [...seen.values()];
  const link = links[${index}];
  if (!link) return JSON.stringify({ ok: false, error: "Profile index ${index} not found on page", count: links.length });
  link.scrollIntoView({ behavior: "smooth", block: "center" });
  link.click();
  return JSON.stringify({ ok: true, count: links.length });
})()
`.trim();

export const CLICK_CONNECT_SCRIPT = `
(() => {
  window.scrollTo({ top: 0, behavior: "instant" });

  const profileUrl = location.href.split("?")[0];
  const norm = (s) => (s || "").trim().toLowerCase().replace(/\\s+/g, " ");

  const name =
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector("main h1")?.textContent?.trim() ||
    "Unknown";

  const directText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent || "").trim())
      .join("");

  const pickClickable = (el) =>
    el.closest('a[href], button, [role="button"], .artdeco-button') ||
    (el.tagName === "A" || el.tagName === "BUTTON" ? el : null);

  const isConnectLabel = (text, aria) => {
    const t = norm(text);
    const a = norm(aria);
    return (
      t === "connect" ||
      /^connect\\b/.test(t) ||
      (a.includes("invite") && a.includes("connect")) ||
      a.includes("to connect")
    );
  };

  const candidates = [];
  const scope = document.querySelector("main") || document.body;

  for (const el of scope.querySelectorAll("span, button, a, div[role='button']")) {
    const text = directText(el) || (el.innerText || el.textContent || "").trim();
    const aria = el.getAttribute("aria-label") || "";
    if (!isConnectLabel(text, aria)) continue;
    const clickEl = pickClickable(el);
    if (!clickEl) continue;
    const r = clickEl.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.top > 700) continue;
    candidates.push({ clickEl, top: r.top, left: r.left, label: text || aria });
  }

  candidates.sort((a, b) => a.top - b.top || a.left - b.left);

  if (!candidates.length) {
    for (const el of scope.querySelectorAll("button, a, [role='button']")) {
      const text = (el.innerText || el.textContent || "").trim();
      const aria = el.getAttribute("aria-label") || "";
      if (!isConnectLabel(text, aria)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.top > 700) continue;
      candidates.push({ clickEl: el, top: r.top, left: r.left, label: text || aria });
    }
    candidates.sort((a, b) => a.top - b.top || a.left - b.left);
  }

  let connectTarget = candidates[0]?.clickEl ?? null;

  if (!connectTarget) {
    const more = [...scope.querySelectorAll("button, a, [role='button']")].find((el) => {
      const t = norm(el.innerText || el.textContent);
      const a = norm(el.getAttribute("aria-label"));
      return t === "more" || a.includes("more actions");
    });
    if (more) {
      more.click();
      for (const el of document.querySelectorAll("button, a, [role='button'], div[role='menuitem']")) {
        const text = (el.innerText || el.textContent || "").trim();
        const aria = el.getAttribute("aria-label") || "";
        if (isConnectLabel(text, aria)) {
          connectTarget = el;
          break;
        }
      }
    }
  }

  if (!connectTarget) {
    const labels = [...scope.querySelectorAll("button, a, [role='button']")]
      .map((el) => norm(el.innerText || el.getAttribute("aria-label")))
      .filter((t) => t && t.length < 80);
    const pending = labels.some((t) => t.includes("pending"));
    if (pending) {
      return JSON.stringify({ ok: true, name, profileUrl, status: "connection_sent", alreadyPending: true });
    }
    if (labels.some((t) => t === "message" || t.startsWith("message "))) {
      return JSON.stringify({ ok: false, error: "Already connected", name, profileUrl, alreadyConnected: true });
    }
    return JSON.stringify({
      ok: false,
      error: "Connect button not found",
      name,
      profileUrl,
      visibleButtons: [...new Set(labels)].slice(0, 16),
      candidateCount: candidates.length,
    });
  }

  connectTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  connectTarget.focus?.();
  connectTarget.click();
  connectTarget.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
  );
  return JSON.stringify({
    ok: true,
    name,
    profileUrl,
    status: "connect_clicked",
    picked: candidates[0]?.label ?? "connect",
  });
})()
`.trim();

export const SEND_INVITATION_SCRIPT = (note: string | null) => `
(() => {
  const note = ${JSON.stringify(note ?? "")};
  const norm = (s) => (s || "").trim().toLowerCase().replace(/\\s+/g, " ");
  const label = (el) =>
    norm(el.innerText || el.textContent || el.getAttribute("aria-label") || "");

  const buttons = [
    ...document.querySelectorAll('button, a[role="button"], div[role="button"]'),
  ];

  const isWithoutNote = (t) =>
    t.includes("send without a note") ||
    t.includes("send without note") ||
    t.includes("without a note");

  const withoutNoteBtn = buttons.find((el) => isWithoutNote(label(el)));

  // Default Hermes flow: skip personalized note and use LinkedIn's "Send without a note".
  if (!note.trim()) {
    if (withoutNoteBtn) {
      withoutNoteBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      withoutNoteBtn.click();
      return JSON.stringify({ ok: true, action: "send_without_note_clicked" });
    }
    const pending = buttons.some((el) => label(el).includes("pending"));
    if (pending) return JSON.stringify({ ok: true, action: "already_pending" });
    const visible = buttons.map((el) => label(el)).filter((t) => t && t.length < 80).slice(0, 12);
    return JSON.stringify({ ok: false, action: "send_without_note_not_found", visibleButtons: visible });
  }

  const ta =
    document.querySelector('textarea[name="message"]') ||
    document.querySelector("textarea#custom-message") ||
    document.querySelector("textarea");
  if (ta) {
    ta.focus();
    ta.value = note;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const sendBtn = buttons.find((el) => {
    const t = label(el);
    return t === "send" || t === "send now" || t.includes("send invitation");
  });
  if (sendBtn) {
    sendBtn.click();
    return JSON.stringify({ ok: true, action: "send_with_note_clicked" });
  }
  if (withoutNoteBtn) {
    withoutNoteBtn.click();
    return JSON.stringify({ ok: true, action: "send_without_note_clicked" });
  }
  const pending = buttons.some((el) => label(el).includes("pending"));
  if (pending) return JSON.stringify({ ok: true, action: "already_pending" });
  return JSON.stringify({ ok: false, action: "send_not_found" });
})()
`.trim();
