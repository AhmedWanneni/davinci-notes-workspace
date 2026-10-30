import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
      "react-dom": fileURLToPath(
        new URL("./node_modules/react-dom", import.meta.url),
      ),
      "@app/core-types": fileURLToPath(
        new URL("../core-types/index.ts", import.meta.url),
      ),
      "@app/design-system": fileURLToPath(
        new URL("../design-system/index.ts", import.meta.url),
      ),
      "@app/design-tokens": fileURLToPath(
        new URL("../design-tokens/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
