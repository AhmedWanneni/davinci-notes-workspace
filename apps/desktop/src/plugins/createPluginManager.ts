import { PluginLifecycleManager } from "@app/plugin-runtime";
import {
  createDesktopPluginFsAdapter,
  createDesktopPluginStorage,
} from "../vault/desktopPluginAdapter.js";
import type { PluginRpcTransport } from "@app/plugin-runtime";

export function createPluginManager(
  vaultPath: string,
  rpc: PluginRpcTransport,
) {
  return new PluginLifecycleManager({
    fsAdapter: createDesktopPluginFsAdapter(vaultPath),
    storage: createDesktopPluginStorage(),
    rpc,
  });
}
