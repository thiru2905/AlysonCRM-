import { createFileRoute } from "@tanstack/react-router";
import { AppModule } from "@/components/app-module/AppModule";
import { AFFILIATE_MODULE } from "@/lib/apps/module-data";

export const Route = createFileRoute("/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate Outreach — Alyson OS" },
      { name: "description", content: "Partners driven by Alyson: outbound, activation, and payouts the OS can run itself." },
      { property: "og:title", content: "Affiliate Outreach — Alyson OS" },
      { property: "og:description", content: "Partners driven by Alyson: outbound, activation, and payouts the OS can run itself." },
    ],
  }),
  component: () => <AppModule {...AFFILIATE_MODULE} />,
});
