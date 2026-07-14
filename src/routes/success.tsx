import { createFileRoute } from "@tanstack/react-router";
import { AppModule } from "@/components/app-module/AppModule";
import { SUCCESS_MODULE } from "@/lib/apps/module-data";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Customer Success — Alyson OS" },
      { name: "description", content: "Retention driven by Alyson: at-risk accounts, expansion motions, and QBRs the OS can run itself." },
      { property: "og:title", content: "Customer Success — Alyson OS" },
      { property: "og:description", content: "Retention driven by Alyson: at-risk accounts, expansion motions, and QBRs the OS can run itself." },
    ],
  }),
  component: () => <AppModule {...SUCCESS_MODULE} />,
});
