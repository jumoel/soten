import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import { App } from "./app.tsx";
import { FrontPage } from "./routes/front.tsx";
import { NotePage } from "./routes/note.tsx";
import { SettingsPage } from "./routes/settings.tsx";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FrontPage,
});

const noteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "note",
});

const noteViewRoute = createRoute({
  getParentRoute: () => noteRoute,
  path: "$",
  component: NotePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  noteRoute.addChildren([noteViewRoute]),
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
