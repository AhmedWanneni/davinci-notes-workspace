import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@app/core-types": fileURLToPath(
        new URL("../core-types/index.ts", import.meta.url),
      ),
      "@app/design-system": fileURLToPath(
        new URL("../design-system/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
