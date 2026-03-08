import {
  createRouter,
  createRoute,
  createRootRoute,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { App } from "./app.tsx";

type RootSearchParams = {
  q?: string;
  note?: string;
  draft?: string;
};

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): RootSearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    note: typeof search.note === "string" ? search.note : undefined,
    draft: typeof search.draft === "string" ? search.draft : undefined,
  }),
  component: lazyRouteComponent(() => import("./routes/front.tsx"), "FrontPage"),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: lazyRouteComponent(() => import("./routes/settings.tsx"), "SettingsPage"),
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute]);

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => null,
  defaultPendingMinMs: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
