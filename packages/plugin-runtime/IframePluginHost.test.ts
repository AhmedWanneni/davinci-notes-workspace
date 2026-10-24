import { describe, expect, it, vi } from "vitest";
import { IframePluginHost, IFRAME_SANDBOX_POLICY } from "./IframePluginHost.js";
import { isPluginLoadResult } from "./pluginRpc.js";

describe("Phase 6: Browser Plugin Host & Sandboxing (IframePluginHost)", () => {
  it("enforces strict opaque-origin sandbox policy (allow-scripts only, no allow-same-origin)", () => {
    const host = new IframePluginHost();
    const policy = host.getSandboxAttribute();

    expect(policy).toBe("allow-scripts");
    expect(IFRAME_SANDBOX_POLICY).not.toContain("allow-same-origin");
    expect(IFRAME_SANDBOX_POLICY).not.toContain("allow-top-navigation");
    expect(IFRAME_SANDBOX_POLICY).not.toContain("allow-modals");
  });

  it("unconditionally blocks shell execution attempts in the browser sandbox", async () => {
    const host = new IframePluginHost();
    const token = host.registerPlugin("malicious-plugin", [
      "vault:read",
      "network",
    ]);

    await expect(
      host.handlePluginRpcCall("malicious-plugin", token, "shell.exec", {
        cmd: "rm -rf /",
      }),
    ).rejects.toThrow(
      /PermissionDeniedError: Shell execution \("shell\.exec"\) is prohibited/,
    );
  });

  it("rejects network.fetch when the plugin manifest lacks 'network' permission", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, body: "ok" });
    const host = new IframePluginHost({ fetchImpl: fetchMock });

    const noNetToken = host.registerPlugin("offline-plugin", ["vault:read"]);
    await expect(
      host.handlePluginRpcCall("offline-plugin", noNetToken, "network.fetch", {
        url: "https://example.com/exfiltrate",
      }),
    ).rejects.toThrow(
      /Plugin "offline-plugin" lacks permission "network" required for network\.fetch/,
    );
    expect(fetchMock).not.toHaveBeenCalled();

    // Plugin with approved network permission succeeds for https:// and blocks unsafe schemes
    const netToken = host.registerPlugin("weather-plugin", ["network"]);
    const response = await host.handlePluginRpcCall(
      "weather-plugin",
      netToken,
      "network.fetch",
      { url: "https://api.weather.example/today" },
    );
    expect(response).toEqual({ status: 200, body: "ok" });

    await expect(
      host.handlePluginRpcCall("weather-plugin", netToken, "network.fetch", {
        url: "file:///etc/passwd",
      }),
    ).rejects.toThrow(/Blocked unsafe plugin fetch protocol/);
  });

  it("rejects forged caller tokens and mediates authorized editor operations and declarative views", async () => {
    let content = "# Initial Note";
    const host = new IframePluginHost();
    host.setEditor({
      getContent: () => content,
      setContent: (next) => {
        content = next;
      },
      getSelection: () => ({ from: 0, to: 5 }),
      setSelection: () => {},
      insertText: (txt) => {
        content += txt;
      },
      onChange: () => () => {},
    });

    const validToken = host.registerPlugin("editor-helper", [
      "editor:read",
      "editor:write",
      "ui:view",
    ]);

    await expect(
      host.handlePluginRpcCall(
        "editor-helper",
        "forged-token",
        "editor.getContent",
      ),
    ).rejects.toThrow(/Unauthorized plugin RPC call/);

    expect(
      await host.handlePluginRpcCall(
        "editor-helper",
        validToken,
        "editor.getContent",
      ),
    ).toBe("# Initial Note");

    await host.handlePluginRpcCall(
      "editor-helper",
      validToken,
      "editor.insertText",
      "\nAppended by plugin",
    );
    expect(content).toBe("# Initial Note\nAppended by plugin");

    const declarativePayload = {
      commands: [{ id: "helper:run", title: "Run Helper" }],
      views: [
        {
          id: "helper-leaf",
          name: "Helper View",
          model: { type: "text", value: "Declarative status" },
        },
      ],
    };
    expect(isPluginLoadResult(declarativePayload)).toBe(true);
  });
});
