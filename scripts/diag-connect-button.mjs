/**
 * Diagnostic: open a LinkedIn profile and dump visible action buttons.
 */
const BROWSER = process.env.ALYSON_BROWSER_AGENT_URL ?? "http://127.0.0.1:8820";
const profileUrl = process.argv[2] ?? "https://www.linkedin.com/in/avinashgulave";

async function tool(name, args) {
  const res = await fetch(`${BROWSER}/api/agent/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: name, args }),
  });
  return res.json();
}

async function main() {
  console.log("Profile:", profileUrl);
  await tool("browser.launch", {});
  const login = await tool("linkedin.check_login", {});
  console.log("login:", JSON.stringify(login.data ?? login.error));

  const open = await tool("linkedin.open_profile", { profileUrl });
  console.log("open:", open.status, open.error ?? open.data?.profileUrl);

  const snap = await tool("browser.extract", {});
  const text = String(snap.data?.text ?? "").slice(0, 2500);
  console.log("page url:", snap.data?.url);
  console.log("page text preview:\n", text);

  const check = await tool("linkedin.check_connection", { profileUrl });
  console.log("check_connection:", JSON.stringify(check.data ?? check.error));

  const send = await tool("linkedin.send_connection_request", {
    profileUrl,
    approved: true,
    message: "Hi",
  });
  console.log("send approved:", JSON.stringify(send, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
