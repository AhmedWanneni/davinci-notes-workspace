import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export default defineConfig({
  resolve: {
    alias: {
      "@app/core-types": path.join(repoRoot, "packages/core-types/index.ts"),
      "@app/editor": path.join(repoRoot, "packages/editor/index.ts"),
      "@app/indexer": path.join(repoRoot, "packages/indexer/index.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/src-tauri/**"],
  },
});
