import "@total-typescript/ts-reset";

import { registerSW } from "virtual:pwa-register";
import { Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { store } from "./state/store";

registerSW({ immediate: true });

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
