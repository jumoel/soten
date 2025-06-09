import "@total-typescript/ts-reset";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";

import { App } from "./app.tsx";
import { store } from "./atoms/globals.ts";

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <Suspense fallback="Loading...">
        <App />
      </Suspense>
    </Provider>
  </StrictMode>,
);
