import {
  createRouter,
  createRoute,
  createRootRoute,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { App } from "./app.tsx";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./routes/front.tsx"), "FrontPage"),
});

const noteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "note",
});

const noteViewRoute = createRoute({
  getParentRoute: () => noteRoute,
  path: "$",
  component: lazyRouteComponent(() => import("./routes/note.tsx"), "NotePage"),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: lazyRouteComponent(() => import("./routes/settings.tsx"), "SettingsPage"),
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
