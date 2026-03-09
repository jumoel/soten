/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";

async function collectFiles(dir: string, base: string): Promise<string[]> {
  const entries = await readdir(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) {
      files.push(...(await collectFiles(full, base)));
    } else {
      files.push(relative(base, full));
    }
  }
  return files;
}

export default defineConfig({
  plugins: [
    {
      name: "local-repo",
      configureServer(server) {
        const sandboxRoot = resolve(process.cwd(), "..");
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost");

          if (url.pathname === "/api/test-repo/files") {
            const dir = url.searchParams.get("dir");
            if (!dir) {
              res.statusCode = 400;
              res.end("Missing dir");
              return;
            }
            const target = resolve(process.cwd(), dir);
            if (!target.startsWith(sandboxRoot)) {
              res.statusCode = 403;
              res.end("Forbidden");
              return;
            }
            try {
              const files = await collectFiles(target, target);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(files));
            } catch {
              res.statusCode = 500;
              res.end("Error reading directory");
            }
            return;
          }

          if (url.pathname === "/api/test-repo/file") {
            const path = url.searchParams.get("path");
            if (!path) {
              res.statusCode = 400;
              res.end("Missing path");
              return;
            }
            const target = resolve(process.cwd(), path);
            if (!target.startsWith(sandboxRoot)) {
              res.statusCode = 403;
              res.end("Forbidden");
              return;
            }
            try {
              const content = await readFile(target, "utf8");
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.end("Not found");
            }
            return;
          }

          next();
        });
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        // Raise limit to accommodate Storybook manager bundles (default 2 MiB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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

  worker: {
    format: "es",
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
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
