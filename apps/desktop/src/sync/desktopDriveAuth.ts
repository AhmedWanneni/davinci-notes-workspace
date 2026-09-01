import { invoke } from "@tauri-apps/api/core";
import {
  DriveReauthRequiredError,
  DriveTokenManager,
  startDriveLogin,
  type OAuthToken,
  type OAuthTransport,
  type PkceProvider,
  type TokenStore,
} from "@app/sync-client";
import { getDriveOAuthConfig } from "./driveAuthConfig";

interface LoopbackEndpoint {
  port: number;
  redirect_uri: string;
}
interface OAuthCallback {
  code: string;
  state?: string;
}

function createPkceProvider(): PkceProvider {
  return {
    randomBytes: (length) => crypto.getRandomValues(new Uint8Array(length)),
    sha256: async (value) =>
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
      ),
  };
}

export function createDesktopTokenStore(): TokenStore {
  return {
    load: () =>
      invoke<string | null>("load_drive_token").then((value) =>
        value ? (JSON.parse(value) as OAuthToken) : null,
      ),
    save: (token) =>
      invoke("save_drive_token", { token: JSON.stringify(token) }),
    clear: () => invoke("clear_drive_token"),
  };
}

function createGoogleTransport(): OAuthTransport {
  const { clientId, tokenEndpoint } = getDriveOAuthConfig();
  const request = async (params: URLSearchParams): Promise<OAuthToken> => {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const body = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
    };
    if (!response.ok) {
      if (
        body.error === "invalid_grant" ||
        body.error === "unauthorized_client"
      )
        throw new DriveReauthRequiredError();
      throw new Error(
        `drive-token-request-failed:${body.error ?? response.status}`,
      );
    }
    if (!body.access_token || !body.expires_in)
      throw new Error("drive-token-response-invalid");
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + body.expires_in * 1000,
      scope: body.scope ?? "",
    };
  };
  return {
    exchangeCode: (requestData) =>
      request(
        new URLSearchParams({
          client_id: clientId,
          code: requestData.code,
          code_verifier: requestData.verifier,
          grant_type: "authorization_code",
          redirect_uri: requestData.redirectUri,
        }),
      ),
    refresh: (refreshToken) =>
      request(
        new URLSearchParams({
          client_id: clientId,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      ),
  };
}

export async function signInToDrive(
  openAuthorizationUrl: (url: string) => Promise<void>,
): Promise<OAuthToken> {
  const endpoint = await invoke<LoopbackEndpoint>("start_oauth_listener");
  const redirectUri = endpoint.redirect_uri;
  const state = Array.from(createPkceProvider().randomBytes(24), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const login = await startDriveLogin(
    { ...getDriveOAuthConfig(), redirectUri, state },
    createPkceProvider(),
  );
  await openAuthorizationUrl(login.authorizationUrl);
  const callback = await invoke<OAuthCallback>("wait_for_oauth_callback");
  if (callback.state !== state) throw new Error("drive-oauth-state-mismatch");
  return new DriveTokenManager(
    createDesktopTokenStore(),
    createGoogleTransport(),
  ).finishLogin(callback.code, login.verifier, redirectUri);
}

export function openDriveAuthorizationUrl(url: string): Promise<void> {
  return invoke("open_external_url", { url });
}

export async function getDriveAccessToken(): Promise<string> {
  return new DriveTokenManager(
    createDesktopTokenStore(),
    createGoogleTransport(),
  ).getAccessToken();
}

export function signOutOfDrive(): Promise<void> {
  return createDesktopTokenStore().clear();
}
