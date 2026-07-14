import { createFileRoute } from "@tanstack/react-router";
import { AppModule } from "@/components/app-module/AppModule";
import { REAL_ESTATE_MODULE } from "@/lib/apps/module-data";

export const Route = createFileRoute("/real-estate")({
  head: () => ({
    meta: [
      { title: "Real Estate — Alyson OS" },
      { name: "description", content: "Listings driven by Alyson: showings, price adjustments, and multi-offer flows the OS orchestrates." },
      { property: "og:title", content: "Real Estate — Alyson OS" },
      { property: "og:description", content: "Listings driven by Alyson: showings, price adjustments, and multi-offer flows the OS orchestrates." },
    ],
  }),
  component: () => <AppModule {...REAL_ESTATE_MODULE} />,
});
