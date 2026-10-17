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
      "@app/clipper-core": path.join(
        repoRoot,
        "packages/clipper-core/index.ts",
      ),
      // `@app/design-system` has no `main`/`exports` field, so the bare specifier
      // only resolves through an alias (same as `apps/desktop/vite.config.ts`).
      "@app/design-system": path.join(
        repoRoot,
        "packages/design-system/index.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", ".output/**", ".wxt/**"],
  },
});
