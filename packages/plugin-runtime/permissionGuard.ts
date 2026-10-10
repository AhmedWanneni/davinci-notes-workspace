import type { PluginPermission } from "@app/plugin-api";

export const PLUGIN_API_PERMISSIONS = {
  "vault.read": "vault:read",
  "vault.list": "vault:read",
  "vault.write": "vault:write",
  "vault.delete": "vault:write",
  "network.fetch": "network",
  "commands.register": "commands",
  "settings.addTab": "ui:view",
  "workspace.registerView": "ui:view",
  "workspace.openLeaf": "ui:view",
  "workspace.closeLeaf": "ui:view",
  "workspace.focusLeaf": "ui:view",
  "workspace.isViewOpen": "ui:view",
  "editor.getContent": "editor:read",
  "editor.getSelection": "editor:read",
  "editor.subscribe": "editor:read",
  "editor.setContent": "editor:write",
  "editor.setSelection": "editor:write",
  "editor.insertText": "editor:write",
} as const satisfies Record<string, PluginPermission>;

export function requirePluginPermission(
  pluginId: string,
  permissions: readonly PluginPermission[],
  operation: keyof typeof PLUGIN_API_PERMISSIONS,
): void {
  const required = PLUGIN_API_PERMISSIONS[operation];
  if (!permissions.includes(required)) {
    throw new Error(
      `Plugin "${pluginId}" lacks permission "${required}" required for ${operation}`,
    );
  }
}
