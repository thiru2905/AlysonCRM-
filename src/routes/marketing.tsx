import { createFileRoute } from "@tanstack/react-router";
import { AppModule } from "@/components/app-module/AppModule";
import { MARKETING_MODULE } from "@/lib/apps/module-data";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing — Alyson OS" },
      { name: "description", content: "Demand driven by Alyson: campaigns, audiences, and experiments the OS scores in the open." },
      { property: "og:title", content: "Marketing — Alyson OS" },
      { property: "og:description", content: "Demand driven by Alyson: campaigns, audiences, and experiments the OS scores in the open." },
    ],
  }),
  component: () => <AppModule {...MARKETING_MODULE} />,
});
