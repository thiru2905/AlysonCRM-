import { createFileRoute } from "@tanstack/react-router";
import { AppModule } from "@/components/app-module/AppModule";
import { INSURANCE_MODULE } from "@/lib/apps/module-data";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance — Alyson OS" },
      { name: "description", content: "Policies driven by Alyson: quotes, renewals, and claims the OS can explain and orchestrate." },
      { property: "og:title", content: "Insurance — Alyson OS" },
      { property: "og:description", content: "Policies driven by Alyson: quotes, renewals, and claims the OS can explain and orchestrate." },
    ],
  }),
  component: () => <AppModule {...INSURANCE_MODULE} />,
});
