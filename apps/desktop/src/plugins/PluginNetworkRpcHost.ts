import { invoke } from "@tauri-apps/api/core";
import type { PluginPermission } from "@app/plugin-api";

type JsonRecord = Record<string, unknown>;
export interface MediatedNetworkRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface MediatedNetworkResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

type NativeNetworkRequester = (request: MediatedNetworkRequest) => Promise<MediatedNetworkResponse>;

export class PluginNetworkRpcHost {
  private readonly capabilities = new Map<string, {
    permissions: readonly PluginPermission[];
    token: string;
  }>();

  constructor(
    private readonly requestNative: NativeNetworkRequester = (request) =>
      invoke<MediatedNetworkResponse>("plugin_network_request", { request }),
  ) {}

  registerPlugin(id: string, permissions: readonly PluginPermission[]): string {
    const token = crypto.randomUUID();
    this.capabilities.set(id, { permissions: [...permissions], token });
    return token;
  }

  unregisterPlugin(id: string): void {
    this.capabilities.delete(id);
  }

  async request(params: JsonRecord): Promise<JsonRecord> {
    const id = requireString(params.id, "id");
    const token = requireString(params.capabilityToken, "capabilityToken");
    const capability = this.capabilities.get(id);
    if (!capability || capability.token !== token) {
      throw new Error("Plugin network request has an invalid capability token");
    }
    if (!capability.permissions.includes("network")) {
      throw new Error(`Plugin "${id}" lacks permission "network" required for network.fetch`);
    }

    const url = new URL(requireString(params.url, "url"));
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Plugin network requests require an http: or https: URL");
    }
    const request = (params.request ?? {}) as JsonRecord;
    const response = await this.requestNative({
      url: url.toString(),
      method: optionalString(request.method, "method") ?? "GET",
      headers: stringRecord(request.headers, "headers"),
      body: optionalString(request.body, "body"),
    });
    return { ...response };
  }
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`network.request requires ${name}`);
  return value;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`network.request ${name} must be a string`);
  return value;
}

function stringRecord(value: unknown, name: string): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`network.request ${name} must be an object`);
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") throw new Error(`network.request header "${key}" must be a string`);
    result[key] = entry;
  }
  return result;
}
