/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          git: ["isomorphic-git", "isomorphic-git/http/web", "buffer"],
          "markdown-render": ["remark-gfm", "remark-rehype", "rehype-raw", "rehype-stringify"],
        },
      },
    },
  },

  server: {
    proxy: {
      "/api": { target: "http://localhost:8788" },
    },
  },

  test: {
    environment: "jsdom",
    clearMocks: true,
  },
});
