import { describe, expect, it, vi } from "vitest";
import { PluginNetworkRpcHost } from "./PluginNetworkRpcHost.js";

describe("PluginNetworkRpcHost", () => {
  it("rejects a plugin that did not declare network", async () => {
    const host = new PluginNetworkRpcHost(vi.fn());
    const capabilityToken = host.registerPlugin("no-network", ["vault:read"]);

    await expect(host.request({
      id: "no-network", capabilityToken, url: "https://example.com",
    })).rejects.toThrow('Plugin "no-network" lacks permission "network" required for network.fetch');
  });

  it("performs a bounded mediated request for a plugin with network", async () => {
    const requestNative = vi.fn().mockResolvedValue({
      ok: true, status: 200, statusText: "OK", headers: { "content-type": "text/plain" }, body: "network content",
    });
    const host = new PluginNetworkRpcHost(requestNative);
    const capabilityToken = host.registerPlugin("with-network", ["network"]);

    await expect(host.request({
      id: "with-network", capabilityToken, url: "https://example.com", request: { method: "GET" },
    })).resolves.toMatchObject({ ok: true, status: 200, body: "network content" });
    expect(requestNative).toHaveBeenCalledWith({ url: "https://example.com/", method: "GET", headers: undefined, body: undefined });
  });

  it("passes requests to the native bridge rather than a webview fetch", async () => {
    const requestNative = vi.fn().mockResolvedValue({
      ok: true, status: 200, statusText: "OK", headers: {}, body: "native response",
    });
    const host = new PluginNetworkRpcHost(requestNative);
    const capabilityToken = host.registerPlugin("bound-network", ["network"]);

    await expect(host.request({
      id: "bound-network", capabilityToken, url: "https://example.com",
    })).resolves.toMatchObject({ body: "native response" });
  });
});
