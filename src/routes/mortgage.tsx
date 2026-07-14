import { createFileRoute } from "@tanstack/react-router";
import { AppModule } from "@/components/app-module/AppModule";
import { MORTGAGE_MODULE } from "@/lib/apps/module-data";

export const Route = createFileRoute("/mortgage")({
  head: () => ({
    meta: [
      { title: "Mortgage — Alyson OS" },
      { name: "description", content: "Loans driven by Alyson: underwriting, document requests, and closings the OS can run itself." },
      { property: "og:title", content: "Mortgage — Alyson OS" },
      { property: "og:description", content: "Loans driven by Alyson: underwriting, document requests, and closings the OS can run itself." },
    ],
  }),
  component: () => <AppModule {...MORTGAGE_MODULE} />,
});
