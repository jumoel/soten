import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/cors-proxy/": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
