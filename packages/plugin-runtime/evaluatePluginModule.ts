import type { PluginManifest } from "@app/plugin-api";
import type { PluginConstructor } from "./pluginTypes.js";

/**
 * Deprecated main-webview evaluator retained only as a fail-fast compatibility export.
 * Plugin source is evaluated by the plugin-runner webview.
 */
export function evaluatePluginModule(
  _code: string,
  manifest: PluginManifest,
): PluginConstructor {
  throw new Error(
    `Plugin "${manifest.id}" must be evaluated by the plugin-runner webview.`,
  );
}
