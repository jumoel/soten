import { atom } from "jotai";
import { store } from "../state/store";

export type Route =
  | { view: "home"; query?: string }
  | { view: "note"; path: string; draft?: string }
  | { view: "settings" };

export function parseHash(hash: string): Route {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") ?? undefined;
  const draft = params.get("draft") ?? undefined;

  if (clean === "/" || clean === "" || !clean) {
    return { view: "home", query };
  }

  if (clean === "/settings") {
    return { view: "settings" };
  }

  const path = clean.startsWith("/") ? clean.slice(1) : clean;
  return { view: "note", path, draft };
}

export const routeAtom = atom<Route>(parseHash(window.location.hash));

export function initRouter(): void {
  window.addEventListener("hashchange", () => {
    store.set(routeAtom, parseHash(window.location.hash));
  });
}
