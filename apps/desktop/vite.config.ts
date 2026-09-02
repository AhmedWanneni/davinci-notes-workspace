import path from "node:path";
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

export default defineConfig({
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  define: {
    __FIXTURE_VAULT_PATH__: JSON.stringify(fixtureVaultPath),
    __LARGE_FIXTURE_VAULT_PATH__: JSON.stringify(largeFixtureVaultPath),
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@app/design-system/styles",
        replacement: path.join(repoRoot, "packages/design-system/styles"),
      },
      {
        find: "@app/design-system",
        replacement: path.join(repoRoot, "packages/design-system/index.ts"),
      },
      {
        find: "@app/core-types",
        replacement: path.join(repoRoot, "packages/core-types/index.ts"),
      },
      {
        find: "@app/canvas",
        replacement: path.join(repoRoot, "packages/canvas/index.ts"),
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
    minify: !process.env.TAURI_DEBUG,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
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
