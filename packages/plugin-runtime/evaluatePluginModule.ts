import { DavinciPlugin, type PluginManifest } from "@app/plugin-api";
import type { PluginConstructor } from "./pluginTypes.js";

/**
 * Evaluates a plugin's bundled entry JavaScript code and extracts its DavinciPlugin class.
 *
 * Injects `DavinciPlugin` into the evaluation scope and supports:
 * - `module.exports = class MyPlugin extends DavinciPlugin ...`
 * - `exports.default = class MyPlugin extends DavinciPlugin ...`
 */
export function evaluatePluginModule(
  code: string,
  manifest: PluginManifest,
): PluginConstructor {
  const moduleObj: { exports: Record<string, unknown> } = {
    exports: {},
  };

  try {
    const fn = new Function("module", "exports", "DavinciPlugin", code);
    fn(moduleObj, moduleObj.exports, DavinciPlugin);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to evaluate plugin "${manifest.id}" entry code: ${message}`,
    );
  }

  const exported = moduleObj.exports.default || moduleObj.exports;

  if (typeof exported === "function") {
    if (exported.prototype instanceof DavinciPlugin) {
      return exported as PluginConstructor;
    }
  }

  // Look for any exported member extending DavinciPlugin
  const namedCandidate = Object.values(moduleObj.exports).find(
    (v): v is PluginConstructor =>
      typeof v === "function" && v.prototype instanceof DavinciPlugin,
  );

  if (namedCandidate) {
    return namedCandidate;
  }

  throw new Error(
    `Plugin "${manifest.id}" does not export a class extending DavinciPlugin (via module.exports or export default).`,
  );
}
