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
      "@app/ai-api": path.join(repoRoot, "packages/ai-api/index.ts"),
      "@app/ai-runtime": path.join(repoRoot, "packages/ai-runtime/index.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/src-tauri/**"],
  },
});
