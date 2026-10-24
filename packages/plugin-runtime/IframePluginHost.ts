import type { PluginPermission } from "@app/plugin-api";
import {
  PLUGIN_API_PERMISSIONS,
  requirePluginPermission,
} from "./permissionGuard.js";
import type {
  PluginEditorHostAdapter,
  PluginRpcTransport,
} from "./pluginRpc.js";

export const IFRAME_SANDBOX_POLICY = "allow-scripts";

export interface IframeHostOptions {
  fetchImpl?: (url: string, init?: RequestInit) => Promise<{ status: number; body: string }>;
}

interface RegisteredPluginRecord {
  token: string;
  permissions: readonly PluginPermission[];
}

export class IframePluginHost implements PluginRpcTransport {
  private readonly plugins = new Map<string, RegisteredPluginRecord>();
  private editor: PluginEditorHostAdapter | null = null;
  private readonly fetchImpl?: IframeHostOptions["fetchImpl"];
  private iframeElement: HTMLIFrameElement | null = null;

  constructor(options: IframeHostOptions = {}) {
    this.fetchImpl = options.fetchImpl;
  }

  /**
   * Lazily creates the isolated plugin iframe with `sandbox="allow-scripts"`
   * (omitting `allow-same-origin` to enforce an opaque `null` origin).
   */
  ensureSandboxIframe(container?: HTMLElement): HTMLIFrameElement | null {
    if (this.iframeElement) return this.iframeElement;
    if (typeof document === "undefined") return null;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", IFRAME_SANDBOX_POLICY);
    iframe.setAttribute("src", "about:blank");
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");

    const target = container ?? document.body;
    target?.appendChild(iframe);
    this.iframeElement = iframe;
    return iframe;
  }

  getSandboxAttribute(): string {
    return IFRAME_SANDBOX_POLICY;
  }

  setEditor(editor: PluginEditorHostAdapter | null): void {
    this.editor = editor;
  }

  registerPlugin(
    pluginId: string,
    permissions: readonly PluginPermission[],
  ): string {
    const token = `web-plugin-token-${pluginId}-${Math.random().toString(36).slice(2)}`;
    this.plugins.set(pluginId, {
      token,
      permissions: [...permissions],
    });
    return token;
  }

  unregisterPlugin(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  removePlugin(pluginId: string): void {
    this.unregisterPlugin(pluginId);
  }

  async handlePluginRpcCall(
    pluginId: string,
    token: string,
    operation: string,
    payload?: unknown,
  ): Promise<unknown> {
    const record = this.plugins.get(pluginId);
    if (!record || record.token !== token) {
      throw new Error(`Unauthorized plugin RPC call from "${pluginId}"`);
    }

    if (operation.startsWith("shell.")) {
      throw new Error(
        `PermissionDeniedError: Shell execution ("${operation}") is prohibited in the browser plugin sandbox`,
      );
    }

    if (operation in PLUGIN_API_PERMISSIONS) {
      requirePluginPermission(
        pluginId,
        record.permissions,
        operation as keyof typeof PLUGIN_API_PERMISSIONS,
      );
    } else {
      throw new Error(`Unsupported plugin RPC operation: ${operation}`);
    }

    switch (operation) {
      case "network.fetch": {
        const req = payload as { url: string; init?: RequestInit };
        const parsed = new URL(req.url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error(`Blocked unsafe plugin fetch protocol: ${parsed.protocol}`);
        }
        if (this.fetchImpl) {
          return this.fetchImpl(req.url, req.init);
        }
        const res = await fetch(req.url, req.init);
        return { status: res.status, body: await res.text() };
      }
      case "editor.getContent":
        return this.editor?.getContent() ?? "";
      case "editor.setContent":
        this.editor?.setContent(String(payload ?? ""));
        return null;
      case "editor.insertText":
        this.editor?.insertText(String(payload ?? ""));
        return null;
      case "editor.getSelection":
        return this.editor?.getSelection() ?? { from: 0, to: 0 };
      case "editor.setSelection": {
        const sel = payload as { from: number; to: number };
        this.editor?.setSelection(sel);
        return null;
      }
      default:
        return null;
    }
  }

  async request(method: string, params?: unknown): Promise<unknown> {
    if (method === "plugin.load") {
      const p = params as { pluginId: string; code?: string };
      if (!this.plugins.has(p.pluginId)) {
        throw new Error(`Plugin "${p.pluginId}" is not registered`);
      }
      return {
        commands: [],
        views: [],
      };
    }
    return null;
  }

  destroy(): void {
    this.iframeElement?.remove();
    this.iframeElement = null;
    this.plugins.clear();
  }
}
