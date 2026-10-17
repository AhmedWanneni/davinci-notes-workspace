import { defineConfig } from "wxt";

/**
 * MV3, Chromium first (ADR-0175).
 *
 * Permissions are deliberately minimal (plan §5): `activeTab` + `scripting` mean
 * the extension can read the current page only after the user invokes it, so no
 * host permission is ever granted for browsing.
 */
export default defineConfig({
  manifest: {
    name: "DaVinci Notes Web Clipper",
    description:
      "Save web pages to your DaVinci Notes vault as Markdown notes.",
    version: "0.1.0",
    // 127 is where `action.openPopup()` left developer-preview. The popup opens
    // itself after a toolbar/command invocation; older Chromium cannot do that,
    // so declaring 116 would advertise support we do not actually have.
    minimum_chrome_version: "127",
    permissions: [
      "activeTab",
      "scripting",
      "storage",
      "contextMenus",
      "downloads",
    ],
    host_permissions: [],
    commands: {
      _execute_action: {
        suggested_key: { default: "Alt+Shift+C" },
        description: "Clip the current page to DaVinci Notes",
      },
    },
  },
});
