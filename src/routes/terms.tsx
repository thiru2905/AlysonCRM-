import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Alyson" },
      {
        name: "description",
        content: "Terms and conditions for using Alyson Agentic CRM+ and related local agents.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: July 15, 2026</p>

        <div className="prose-landing mt-10 space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              1. Agreement
            </h2>
            <p className="mt-2">
              By accessing or using Alyson Agentic CRM+ (“Alyson”), the Desktop Agent, the Browser
              Agent, or any related local services (together, the “Service”), you agree to these
              Terms &amp; Conditions. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              2. What Alyson does
            </h2>
            <p className="mt-2">
              Alyson is software for supervising AI-assisted workflows across CRM, recruiting,
              outreach, and related modules. LinkedIn actions (search, profile extract, connection
              requests, messages) run through a browser on your machine. You remain responsible for
              how the Service is used on third-party platforms.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              3. Your accounts &amp; platform rules
            </h2>
            <p className="mt-2">
              You must comply with LinkedIn’s User Agreement and all other platform terms for any
              sites you automate or browse through Alyson. You are solely responsible for daily
              send limits, messaging content, and account safety. Alyson does not guarantee that
              your LinkedIn or other accounts will remain unrestricted.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              4. Approvals &amp; human supervision
            </h2>
            <p className="mt-2">
              Connection requests and similar outbound actions may require your explicit approval in
              the product. Enabling automated outreach is at your own risk. Keep connection volume
              low and review each prospect when possible.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              5. Local data &amp; secrets
            </h2>
            <p className="mt-2">
              Local databases, Chrome profiles, pairing credentials, and API keys (for example
              DeepSeek) may be stored on your device. You are responsible for securing that
              machine, rotating keys, and not committing secrets to source control.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              6. Acceptable use
            </h2>
            <p className="mt-2">
              You may not use Alyson to spam, harass, scrape unlawfully, bypass security controls,
              or violate applicable law. You may not redistribute the Service in ways that breach
              your license or third-party terms.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              7. No warranty
            </h2>
            <p className="mt-2">
              The Service is provided “as is” without warranties of any kind, express or implied,
              including merchantability, fitness for a particular purpose, and non-infringement.
              Features that depend on third-party sites may break without notice when those sites
              change.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              8. Limitation of liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Alyson and its contributors are not liable for
              indirect, incidental, special, consequential, or punitive damages, or for loss of
              profits, data, goodwill, or account access arising from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              9. Changes
            </h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use after changes means you
              accept the revised terms. The “Last updated” date at the top will change when we
              publish a revision.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--landing-display)] text-lg font-semibold text-white">
              10. Contact
            </h2>
            <p className="mt-2">
              Questions about these terms: use your team’s Alyson administrator, or open an issue
              on the project repository you use to distribute this build.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-white/5 pt-8 text-sm">
          <Link to="/privacy" className="text-blue-300 hover:text-blue-200">
            Privacy Policy
          </Link>
          <Link to="/" className="text-zinc-500 hover:text-zinc-300">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
