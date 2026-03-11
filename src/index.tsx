import "@total-typescript/ts-reset";

import { registerSW } from "virtual:pwa-register";
import { RouterProvider } from "@tanstack/react-router";
import { Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { store } from "./atoms/globals.ts";
import { router } from "./router.tsx";

registerSW({ immediate: true });

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
