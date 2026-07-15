/**
 * Debug: dump clickables and attempt connect on a profile.
 */
const BROWSER = "http://127.0.0.1:8820";
const profileUrl = process.argv[2] ?? "https://www.linkedin.com/in/reva-chinchalkar";

async function tool(name, args) {
  const res = await fetch(`${BROWSER}/api/agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: name, args }),
  });
  return res.json();
}

const DEBUG_CLICK = `
(() => {
  const norm = (s) => (s || "").trim().toLowerCase();
  const items = [];
  for (const el of document.querySelectorAll("button, a, [role='button'], .artdeco-button")) {
    const text = (el.innerText || el.textContent || "").trim();
    const aria = el.getAttribute("aria-label") || "";
    const r = el.getBoundingClientRect();
    if (!text && !aria) continue;
    if (r.width === 0 || r.height === 0) continue;
    items.push({
      tag: el.tagName,
      text: text.slice(0, 40),
      aria: aria.slice(0, 60),
      top: Math.round(r.top),
      classes: [...el.classList].slice(0, 4).join(" "),
    });
  }
  return JSON.stringify(items.filter((i) => /connect|message|more|pending/i.test(i.text + i.aria)).slice(0, 30));
})()
`;

async function main() {
  await tool("browser.launch", {});
  await tool("browser.navigate", { url: profileUrl });
  await new Promise((r) => setTimeout(r, 6000));

  const snap = await tool("browser.extract", {});
  console.log("url:", snap.data?.url, "text has Connect:", /\\bConnect\\b/.test(snap.data?.text || ""));

  const res = await fetch(`${BROWSER}/api/agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool: "browser.type",
      args: {},
    }),
  });

  // Use linkedin.open_profile then raw evaluate via send
  const send = await tool("linkedin.send_connection_request", {
    profileUrl,
    approved: true,
    message: "Hi, I'd love to connect.",
  });
  console.log("send:", JSON.stringify(send, null, 2));
}

main();
