import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/lib/theme";
import { ShellProvider } from "@/lib/shell";
import { AppShell } from "@/components/shell/AppShell";
import { RuntimeIntroModal } from "@/components/runtime/RuntimeIntroModal";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
          Alyson OS · 404
        </div>
        <h1 className="text-display text-3xl">Nothing lives here.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you asked for doesn't exist in this workspace.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110"
        >
          Return to overview
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-destructive mb-3">
          Runtime error
        </div>
        <h1 className="text-display text-2xl">This surface failed to load.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alyson caught the error. You can retry or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Alyson Agentic CRM+ — the AI operating system for revenue" },
      {
        name: "description",
        content:
          "Alyson Agentic CRM+ unifies CRM, ATS, Success, Marketing, Real Estate, Mortgage and Insurance on shared primitives. Humans supervise. AI performs.",
      },
      { name: "author", content: "Alyson" },
      { name: "theme-color", content: "#F8FAFC" },
      { property: "og:title", content: "Alyson Agentic CRM+" },
      {
        property: "og:description",
        content: "Agentic CRM+. One operating system for every revenue workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/images/alyson-mini.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ShellProvider>
          <AppShell>
            <Outlet />
          </AppShell>
          <RuntimeIntroModal />
          <Toaster position="bottom-right" />
        </ShellProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
