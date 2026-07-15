import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alyson — Agentic CRM+ for LinkedIn outreach" },
      {
        name: "description",
        content:
          "Alyson Agentic CRM+. Hermes LinkedIn missions, Browser Workers, Profiles, Automation, and revenue flavors — humans supervise, AI performs.",
      },
      { name: "theme-color", content: "#020617" },
    ],
  }),
  component: LandingPage,
});
