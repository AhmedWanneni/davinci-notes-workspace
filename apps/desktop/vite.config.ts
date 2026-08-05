import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
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
  },
});
