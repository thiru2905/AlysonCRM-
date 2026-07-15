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

async function main() {
  await tool("browser.launch", {});
  const nav = await tool("browser.navigate", { url: profileUrl });
  console.log("navigate status:", nav.status);
  console.log("navigate url:", nav.data?.url);
  console.log("navigate text len:", String(nav.data?.text ?? "").length);
  console.log("navigate text preview:", String(nav.data?.text ?? "").slice(0, 1500));

  await new Promise((r) => setTimeout(r, 5000));

  const ev = await tool("browser.extract", {});
  console.log("extract data keys:", ev.data ? Object.keys(ev.data) : null);
  console.log("extract text len:", String(ev.data?.text ?? "").length);
  console.log("extract preview:", String(ev.data?.text ?? "").slice(0, 1500));

  const href = await fetch(`${BROWSER}/api/agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool: "browser.click",
      args: {},
    }),
  }).catch(() => null);
}

main();
