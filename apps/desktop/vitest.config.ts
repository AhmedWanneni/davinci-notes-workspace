import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const fixtureVaultPath = path.join(repoRoot, "packages/indexer/fixtures/vault");
const largeFixtureVaultPath = path.join(
  repoRoot,
  "packages/indexer/fixtures/large-vault",
);

export default defineConfig({
  define: {
    __FIXTURE_VAULT_PATH__: JSON.stringify(fixtureVaultPath),
    __LARGE_FIXTURE_VAULT_PATH__: JSON.stringify(largeFixtureVaultPath),
  },
  resolve: {
    alias: {
      react: path.join(__dirname, "node_modules/react"),
      "react-dom": path.join(__dirname, "node_modules/react-dom"),
      "@app/core-types": path.join(repoRoot, "packages/core-types/index.ts"),
      "@app/clipper-core": path.join(
        repoRoot,
        "packages/clipper-core/index.ts",
      ),
      "@app/editor": path.join(repoRoot, "packages/editor/index.ts"),
      "@app/indexer": path.join(repoRoot, "packages/indexer/index.ts"),
      "@app/sync-client": path.join(repoRoot, "packages/sync-client/index.ts"),
      "@app/plugin-api": path.join(repoRoot, "packages/plugin-api/index.ts"),
      "@app/plugin-runtime": path.join(
        repoRoot,
        "packages/plugin-runtime/index.ts",
      ),
      "@app/theme-api": path.join(repoRoot, "packages/theme-api/index.ts"),
      "@app/design-system": path.join(
        repoRoot,
        "packages/design-system/index.ts",
      ),
      "@app/canvas": path.join(repoRoot, "packages/canvas/index.ts"),
      "@app/kanban": path.join(repoRoot, "packages/kanban/index.ts"),
      "@app/database": path.join(repoRoot, "packages/database/index.ts"),
      "@app/attachments": path.join(repoRoot, "packages/attachments/index.ts"),
      "@app/ai-api": path.join(repoRoot, "packages/ai-api/index.ts"),
      "@app/ai-runtime": path.join(repoRoot, "packages/ai-runtime/index.ts"),
      "@app/ai-embeddings": path.join(
        repoRoot,
        "packages/ai-embeddings/index.ts",
      ),
      "@app/ai-qa": path.join(repoRoot, "packages/ai-qa/index.ts"),
      "@app/syncthing-api": path.join(
        repoRoot,
        "packages/syncthing-api/index.ts",
      ),
      "@app/google-calendar-api": path.join(
        repoRoot,
        "packages/google-calendar-api/index.ts",
      ),
      "@app/platform-adapters": path.join(
        repoRoot,
        "packages/platform-adapters/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/src-tauri/**"],
  },
});
