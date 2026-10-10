import { invoke } from "@tauri-apps/api/core";
import { listen, type Event } from "@tauri-apps/api/event";
import { createDesktopPluginFsAdapter } from "../vault/desktopPluginAdapter.js";
import type { PluginData, PluginPermission } from "@app/plugin-api";
import { PluginEditorRpcHost } from "./PluginEditorRpcHost.js";
import { PluginNetworkRpcHost } from "./PluginNetworkRpcHost.js";
import type { PluginEditorHostAdapter } from "@app/plugin-runtime";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
interface PluginMessage {
  protocol: 1;
  sessionId: string;
  requestId: string;
  kind: "request" | "response" | "notification";
  method: string;
  params?: Json;
  result?: Json;
  error?: { code: string; message: string };
}

export async function listenForPluginHostRequests(
  vaultPath: string,
): Promise<PluginRpcHostSession> {
  const adapter = createDesktopPluginFsAdapter(vaultPath);
  const pending = new Map<
    string,
    { resolve: (value: Json | undefined) => void; reject: (reason: unknown) => void }
  >();
  let notificationSequence = 0;
  const editor = new PluginEditorRpcHost(async (method, params) => {
    await invoke("plugin_webview_send", {
      message: {
        protocol: 1,
        sessionId: "plugin-lifecycle-session",
        requestId: `editor-notification-${++notificationSequence}`,
        kind: "notification",
        method,
        params: params as Json,
      },
    });
  });
  const network = new PluginNetworkRpcHost();
  let requestSequence = 0;
  const unlisten = await listen<PluginMessage>(
    "davinci-plugin-host-request",
    async (event: Event<PluginMessage>) => {
      const message = event.payload;
      if (message.kind !== "request") {
        console.info("[plugin-rpc] host notification", message);
        return;
      }
      let response: PluginMessage;
      try {
        const params = (message.params ?? {}) as Record<string, Json>;
        const result = await handleRequest(adapter, editor, network, message.method, params);
        response = { ...message, kind: "response", result };
      } catch (error) {
        response = {
          ...message,
          kind: "response",
          error: {
            code: "host-request-failed",
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
      await invoke("plugin_webview_send", { message: response });
    },
  );
  const unlistenResponses = await listen<PluginMessage>(
    "davinci-plugin-rpc-response",
    (event: Event<PluginMessage>) => {
      const message = event.payload;
      const request = pending.get(message.requestId);
      if (!request) return;
      pending.delete(message.requestId);
      console.info("[plugin-rpc] main lifecycle response", message);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    },
  );
  console.info("[plugin-rpc] main host listener active");
  return {
    request: (method: string, params?: unknown) => {
      const requestId = `host-${++requestSequence}`;
      const message: PluginMessage = {
        protocol: 1,
        sessionId: "plugin-lifecycle-session",
        requestId,
        kind: "request",
        method,
        ...(params === undefined ? {} : { params: params as Json }),
      };
      console.info("[plugin-rpc] main lifecycle request", message);
      return new Promise<unknown>((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        void invoke("plugin_webview_send", { message }).catch((error) => {
          pending.delete(requestId);
          reject(error);
        });
      });
    },
    setEditor: (hostEditor: PluginEditorHostAdapter | null) => editor.setEditor(hostEditor),
    removePlugin: (pluginId: string) => editor.removePlugin(pluginId),
    registerPlugin: (pluginId, permissions) => network.registerPlugin(pluginId, permissions),
    unregisterPlugin: (pluginId) => network.unregisterPlugin(pluginId),
    cleanup: async () => {
      for (const request of pending.values()) {
        request.reject(new Error("Plugin RPC host listener stopped"));
      }
      pending.clear();
      editor.dispose();
      unlisten();
      unlistenResponses();
    },
  };
}

export interface PluginRpcHostSession {
  request(method: string, params?: unknown): Promise<unknown>;
  setEditor(editor: PluginEditorHostAdapter | null): void;
  removePlugin(pluginId: string): void;
  registerPlugin(pluginId: string, permissions: readonly PluginPermission[]): string;
  unregisterPlugin(pluginId: string): void;
  cleanup(): Promise<void>;
}

async function handleRequest(
  adapter: ReturnType<typeof createDesktopPluginFsAdapter>,
  editor: PluginEditorRpcHost,
  network: PluginNetworkRpcHost,
  method: string,
  params: Record<string, Json>,
): Promise<Json> {
  const path = String(params.path ?? "");
  switch (method) {
    case "vault.read": return adapter.vault.read(path);
    case "vault.write": await adapter.vault.write(path, String(params.content ?? "")); return null;
    case "vault.list": return adapter.vault.list(params.folder === undefined ? undefined : String(params.folder));
    case "vault.delete": await adapter.vault.delete(path); return null;
    case "storage.load": return adapter.loadPluginData(String(params.dirName ?? "")) as unknown as Promise<Json>;
    case "storage.save": await adapter.savePluginData(String(params.dirName ?? ""), (params.data ?? {}) as PluginData); return null;
    case "probe.result":
      if (params.id !== "security-probe") throw new Error("probe.result is reserved for the security probe fixture");
      return null;
    case "network.request": return network.request(params) as Promise<Json>;
    case "editor.getContent":
    case "editor.getSelection":
    case "editor.setContent":
    case "editor.setSelection":
    case "editor.insertText":
    case "editor.subscribe":
    case "editor.unsubscribe": return (await editor.request(method, params)) as Json;
    default: throw new Error(`Unknown plugin host method: ${method}`);
  }
}
