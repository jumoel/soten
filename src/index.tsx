import "@total-typescript/ts-reset";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import { RouterProvider } from "@tanstack/react-router";

import { store } from "./atoms/globals.ts";
import { router } from "./router.tsx";

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
