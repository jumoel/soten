import { init, router } from "./init";

window.addEventListener("hashchange", router);

await init();
