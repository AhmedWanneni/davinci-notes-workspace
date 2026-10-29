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

const TOKEN_LOCAL_STORAGE_KEY = "davinci_drive_token_fallback";

export function createDesktopTokenStore(): TokenStore {
  return {
    load: async () => {
      try {
        const value = await invoke<string | null>("load_drive_token");
        if (value) return JSON.parse(value) as OAuthToken;
      } catch (err) {
        console.warn(
          "[drive-token] Keyring load failed, trying storage fallback:",
          err,
        );
      }
      try {
        const local = localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY);
        return local ? (JSON.parse(local) as OAuthToken) : null;
      } catch {
        return null;
      }
    },
    save: async (token) => {
      try {
        await invoke("save_drive_token", { token: JSON.stringify(token) });
      } catch (err) {
        console.warn(
          "[drive-token] Keyring save failed, saving to storage fallback:",
          err,
        );
      }
      try {
        localStorage.setItem(TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(token));
      } catch (err) {
        console.warn("[drive-token] Storage fallback save failed:", err);
      }
    },
    clear: async () => {
      try {
        await invoke("clear_drive_token");
      } catch {
        // Ignore keyring clearing errors
      }
      try {
        localStorage.removeItem(TOKEN_LOCAL_STORAGE_KEY);
      } catch {
        // Ignore storage clearing errors
      }
    },
  };
}

function createGoogleTransport(): OAuthTransport {
  const { clientId, clientSecret, tokenEndpoint } = getDriveOAuthConfig();
  const request = async (params: URLSearchParams): Promise<OAuthToken> => {
    if (clientSecret) {
      params.set("client_secret", clientSecret);
    }
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    let body: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
      error_description?: string;
    } = {};
    try {
      body = (await response.json()) as typeof body;
    } catch {
      throw new Error(`Google token exchange failed (HTTP ${response.status})`);
    }

    if (!response.ok) {
      console.error(
        "[drive-token] Token exchange error:",
        response.status,
        body,
      );
      const detail = body.error_description
        ? `${body.error}: ${body.error_description}`
        : body.error || `HTTP ${response.status}`;
      if (
        body.error === "invalid_grant" ||
        body.error === "unauthorized_client"
      ) {
        throw new DriveReauthRequiredError();
      }
      throw new Error(`Google authentication failed (${detail})`);
    }
    if (!body.access_token || !body.expires_in) {
      throw new Error("drive-token-response-invalid");
    }
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

export async function fetchDriveAccountEmail(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { emailAddress?: string } };
    return data.user?.emailAddress ?? null;
  } catch {
    return null;
  }
}
