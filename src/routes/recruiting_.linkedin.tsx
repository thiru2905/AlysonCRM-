import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/recruiting_/linkedin")({
  component: LinkedInLayout,
});

function LinkedInLayout() {
  return <Outlet />;
}
