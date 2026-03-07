/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: "Soten",
        short_name: "Soten",
        description: "Minimal Markdown note editor",
        theme_color: "#f0ece4",
        background_color: "#f0ece4",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "soten-app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          git: ["isomorphic-git", "isomorphic-git/http/web", "buffer"],
          "markdown-render": [
            "remark-parse",
            "remark-frontmatter",
            "remark-gfm",
            "remark-rehype",
            "rehype-raw",
            "rehype-stringify",
          ],
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
