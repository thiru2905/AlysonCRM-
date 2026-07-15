import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Alyson" },
      {
        name: "description",
        content: "Privacy policy for Alyson Agentic CRM+ and local desktop agents.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="landing-root min-h-screen bg-black text-zinc-200 antialiased">
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="font-[family-name:var(--landing-display)] text-sm font-semibold text-white">
            Alyson
          </Link>
          <Link to="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400/90">Legal</p>
        <h1 className="mt-3 font-[family-name:var(--landing-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: July 15, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              Overview
            </h2>
            <p className="mt-2">
              Alyson is designed to run primarily on your machine. Profile data, mission history,
              and automation logs are stored locally (for example in SQLite under your project or
              user data folders) unless you configure an external backend.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              What we process locally
            </h2>
            <p className="mt-2">
              Depending on how you use the product, Alyson may store LinkedIn profile fields you
              extract, outreach status, automation run metadata, screenshots from browser sessions,
              and Desktop Agent pairing credentials on disk.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              Third-party services
            </h2>
            <p className="mt-2">
              If you supply API keys (such as DeepSeek), requests go to those providers under their
              privacy policies. LinkedIn and other sites you visit through the Browser Agent receive
              traffic as if you were browsing normally from your Chrome profile.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              Your choices
            </h2>
            <p className="mt-2">
              You can delete local databases, clear the Alyson Chrome profile, revoke pairing, and
              rotate API keys at any time. Self-hosted deployments: your administrator controls
              retention and backups.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-white/5 pt-8 text-sm">
          <Link to="/terms" className="text-blue-300 hover:text-blue-200">
            Terms &amp; Conditions
          </Link>
          <Link to="/" className="text-zinc-500 hover:text-zinc-300">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
