import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const fixtureVaultPath = path.join(repoRoot, "packages/indexer/fixtures/vault");
const largeFixtureVaultPath = path.join(
  repoRoot,
  "packages/indexer/fixtures/large-vault",
);
const magentaThemePath = path.join(
  repoRoot,
  "scripts/theme-verification/magenta-public-tokens.css",
);

const readFixtureTree = (rootDir: string) => {
  const folders: string[] = [];
  const files: Array<{ path: string; content: string }> = [];
  const walk = (dir: string, relPrefix: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        folders.push(rel);
        walk(full, rel);
      } else if (/\.(md|canvas)$/i.test(entry.name)) {
        files.push({ path: rel, content: fs.readFileSync(full, "utf8") });
      }
    }
  };
  walk(rootDir, "");
  return { folders, files };
};

const themeVerificationPlugin = {
  name: "theme-verification-stylesheet",
  configureServer(server: {
    middlewares: {
      use: (
        path: string,
        handler: (
          request: { url?: string },
          response: {
            setHeader: (name: string, value: string) => void;
            end: (body: string) => void;
          },
        ) => void,
      ) => void;
    };
  }) {
    server.middlewares.use(
      "/_dev/theme-verification/magenta-public-tokens.css",
      (_request, response) => {
        response.setHeader("Content-Type", "text/css; charset=utf-8");
        response.end(fs.readFileSync(magentaThemePath, "utf8"));
      },
    );
    server.middlewares.use("/_dev/fixture-vault", (request, response) => {
      const isLarge = request.url?.includes("size=large");
      const targetDir = isLarge ? largeFixtureVaultPath : fixtureVaultPath;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify(readFixtureTree(targetDir)));
    });
  },
};

export default defineConfig({
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  define: {
    __FIXTURE_VAULT_PATH__: JSON.stringify(fixtureVaultPath),
    __LARGE_FIXTURE_VAULT_PATH__: JSON.stringify(largeFixtureVaultPath),
  },
  plugins: [react(), themeVerificationPlugin],
  resolve: {
    alias: [
      {
        find: "react",
        replacement: path.join(__dirname, "node_modules/react"),
      },
      {
        find: "react-dom",
        replacement: path.join(__dirname, "node_modules/react-dom"),
      },
      {
        find: "@app/design-system/styles",
        replacement: path.join(repoRoot, "packages/design-system/styles"),
      },
      {
        find: "@app/design-system",
        replacement: path.join(repoRoot, "packages/design-system/index.ts"),
      },
      {
        find: "@app/design-tokens",
        replacement: path.join(repoRoot, "packages/design-tokens"),
      },
      {
        find: "@app/core-types",
        replacement: path.join(repoRoot, "packages/core-types/index.ts"),
      },
      {
        find: "@app/clipper-core",
        replacement: path.join(repoRoot, "packages/clipper-core/index.ts"),
      },
      {
        find: "@app/canvas",
        replacement: path.join(repoRoot, "packages/canvas/index.ts"),
      },
      {
        find: "@app/kanban",
        replacement: path.join(repoRoot, "packages/kanban/index.ts"),
      },
      {
        find: "@app/database",
        replacement: path.join(repoRoot, "packages/database/index.ts"),
      },
      {
        find: "@app/attachments",
        replacement: path.join(repoRoot, "packages/attachments/index.ts"),
      },
      {
        find: "@app/editor",
        replacement: path.join(repoRoot, "packages/editor/index.ts"),
      },
      {
        find: "@app/indexer",
        replacement: path.join(repoRoot, "packages/indexer/index.ts"),
      },
      {
        find: "@app/sync-client",
        replacement: path.join(repoRoot, "packages/sync-client/index.ts"),
      },
      {
        find: "@app/plugin-api",
        replacement: path.join(repoRoot, "packages/plugin-api/index.ts"),
      },
      {
        find: "@app/plugin-runtime",
        replacement: path.join(repoRoot, "packages/plugin-runtime/index.ts"),
      },
      {
        find: "@app/theme-api",
        replacement: path.join(repoRoot, "packages/theme-api/index.ts"),
      },
      {
        find: "@app/ai-api",
        replacement: path.join(repoRoot, "packages/ai-api/index.ts"),
      },
      {
        find: "@app/ai-runtime",
        replacement: path.join(repoRoot, "packages/ai-runtime/index.ts"),
      },
      {
        find: "@app/ai-embeddings",
        replacement: path.join(repoRoot, "packages/ai-embeddings/index.ts"),
      },
      {
        find: "@app/ai-qa",
        replacement: path.join(repoRoot, "packages/ai-qa/index.ts"),
      },
      {
        find: "@app/syncthing-api",
        replacement: path.join(repoRoot, "packages/syncthing-api/index.ts"),
      },
      {
        find: "@app/google-calendar-api",
        replacement: path.join(
          repoRoot,
          "packages/google-calendar-api/index.ts",
        ),
      },
      {
        find: "@app/platform-adapters",
        replacement: path.join(repoRoot, "packages/platform-adapters/index.ts"),
      },
    ],
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 800,
    minify: !process.env.TAURI_DEBUG,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        capture: path.resolve(__dirname, "capture.html"),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("@codemirror") || id.includes("@lezer")) {
            return "vendor-editor";
          }
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/zustand/")
          ) {
            return "vendor-react";
          }
          if (id.includes("/node_modules/@phosphor-icons/")) {
            return "vendor-icons";
          }
          if (id.includes("/node_modules/@tauri-apps/")) {
            return "vendor-tauri";
          }
          if (id.includes("@xyflow")) {
            return "vendor-canvas";
          }
        },
      },
    },
  },
});
