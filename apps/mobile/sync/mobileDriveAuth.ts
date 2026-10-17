import * as WebBrowser from "expo-web-browser";
import {
  DRIVE_APPDATA_SCOPE,
  DRIVE_FILE_SCOPE,
  DriveReauthRequiredError,
  DriveTokenManager,
  startDriveLogin,
  type OAuthToken,
  type OAuthTransport,
  type PkceProvider,
} from "@app/sync-client";
import { defaultSecureTokenStore } from "./secureTokenStore";

export const GOOGLE_OAUTH_ENDPOINTS = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
} as const;

export const DEFAULT_REDIRECT_URI = "davinci://oauth/callback";

export function createMobilePkceProvider(): PkceProvider {
  return {
    randomBytes: (length) => crypto.getRandomValues(new Uint8Array(length)),
    sha256: async (value) => {
      const bytes = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return new Uint8Array(digest);
    },
  };
}

export function createGoogleOAuthTransport(clientId: string): OAuthTransport {
  const requestToken = async (params: URLSearchParams): Promise<OAuthToken> => {
    const res = await fetch(GOOGLE_OAUTH_ENDPOINTS.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const body = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
    };

    if (!res.ok) {
      if (
        body.error === "invalid_grant" ||
        body.error === "unauthorized_client"
      ) {
        throw new DriveReauthRequiredError();
      }
      throw new Error(`Google Drive token error: ${body.error ?? res.status}`);
    }

    if (!body.access_token || !body.expires_in) {
      throw new Error("Invalid token payload received from Google OAuth");
    }

    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + body.expires_in * 1000,
      scope: body.scope ?? `${DRIVE_FILE_SCOPE} ${DRIVE_APPDATA_SCOPE}`,
    };
  };

  return {
    exchangeCode: (req) =>
      requestToken(
        new URLSearchParams({
          client_id: clientId,
          code: req.code,
          code_verifier: req.verifier,
          grant_type: "authorization_code",
          redirect_uri: req.redirectUri,
        }),
      ),
    refresh: (refreshToken) =>
      requestToken(
        new URLSearchParams({
          client_id: clientId,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      ),
  };
}

export async function loginWithDriveNativeSession(
  clientId: string,
  redirectUri: string = DEFAULT_REDIRECT_URI,
): Promise<OAuthToken> {
  const pkce = createMobilePkceProvider();
  const stateBytes = Array.from(pkce.randomBytes(24));
  const state = stateBytes.map((b) => b.toString(16).padStart(2, "0")).join("");

  const loginStart = await startDriveLogin(
    {
      clientId,
      authorizationEndpoint: GOOGLE_OAUTH_ENDPOINTS.authorizationEndpoint,
      redirectUri,
      state,
    },
    pkce,
  );

  // Native Auth Session: ASWebAuthenticationSession on iOS / Custom Tabs on Android
  const authResult = await WebBrowser.openAuthSessionAsync(
    loginStart.authorizationUrl,
    redirectUri,
  );

  if (authResult.type !== "success" || !authResult.url) {
    throw new Error(
      authResult.type === "cancel" || authResult.type === "dismiss"
        ? "Authentication cancelled by user"
        : `Authentication failed: ${authResult.type}`,
    );
  }

  const callbackUrl = new URL(authResult.url);
  const code = callbackUrl.searchParams.get("code");
  const returnedState = callbackUrl.searchParams.get("state");

  if (returnedState !== state) {
    throw new Error("OAuth security state mismatch — potential CSRF rejected");
  }
  if (!code) {
    throw new Error("No authorization code in OAuth callback");
  }

  const transport = createGoogleOAuthTransport(clientId);
  const manager = new DriveTokenManager(defaultSecureTokenStore, transport);
  return manager.finishLogin(code, loginStart.verifier, redirectUri);
}

export function getDriveTokenManager(clientId: string): DriveTokenManager {
  return new DriveTokenManager(
    defaultSecureTokenStore,
    createGoogleOAuthTransport(clientId),
  );
}
