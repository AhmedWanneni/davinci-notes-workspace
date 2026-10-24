import { invoke } from "@tauri-apps/api/core";
import { getCalendarOAuthConfig } from "./calendarAuthConfig";
import { generateChallenge, generateState, generateVerifier } from "./calendarPkce";
import { createCalendarTokenStore, type CalendarOAuthToken, type CalendarTokenStore } from "./calendarTokenStore";

export class CalendarNotConnectedError extends Error {
  constructor(message = "Google Calendar is not connected") {
    super(message);
    this.name = "CalendarNotConnectedError";
  }
}

export class CalendarReauthRequiredError extends Error {
  constructor(message = "Google Calendar re-authorization required") {
    super(message);
    this.name = "CalendarReauthRequiredError";
  }
}

interface LoopbackEndpoint {
  port: number;
  redirect_uri: string;
}

interface OAuthCallback {
  code: string;
  state?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

async function requestToken(params: URLSearchParams, tokenEndpoint: string): Promise<CalendarOAuthToken> {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const body = (await response.json()) as GoogleTokenResponse;
  if (!response.ok) {
    if (body.error === "invalid_grant" || body.error === "unauthorized_client") {
      throw new CalendarReauthRequiredError();
    }
    throw new Error(`calendar-token-request-failed: ${body.error ?? response.status}`);
  }

  if (!body.access_token || !body.expires_in) {
    throw new Error("calendar-token-response-invalid");
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    scope: body.scope ?? "",
  };
}

export async function loadCalendarToken(
  tokenStore: CalendarTokenStore = createCalendarTokenStore(),
): Promise<CalendarOAuthToken | null> {
  return tokenStore.load();
}

export async function signInToCalendar(
  openAuthorizationUrl: (url: string) => Promise<void> = (url) =>
    invoke("open_external_url", { url }),
  tokenStore: CalendarTokenStore = createCalendarTokenStore(),
  customClientId?: string,
): Promise<CalendarOAuthToken> {
  const config = getCalendarOAuthConfig(customClientId);
  const endpoint = await invoke<LoopbackEndpoint>("start_oauth_listener");
  const redirectUri = endpoint.redirect_uri;
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  const state = generateState();

  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  await openAuthorizationUrl(url.toString());
  const callback = await invoke<OAuthCallback>("wait_for_oauth_callback");

  if (callback.state !== state) {
    throw new Error("calendar-oauth-state-mismatch");
  }

  const token = await requestToken(
    new URLSearchParams({
      client_id: config.clientId,
      code: callback.code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    config.tokenEndpoint,
  );

  const tokenWithClientId: CalendarOAuthToken = {
    ...token,
    clientId: config.clientId,
  };

  await tokenStore.save(tokenWithClientId);
  return tokenWithClientId;
}

export async function getCalendarAccessToken(
  tokenStore: CalendarTokenStore = createCalendarTokenStore(),
): Promise<string> {
  const token = await tokenStore.load();
  if (!token?.accessToken) {
    throw new CalendarNotConnectedError();
  }

  const isExpiredOrClose = token.expiresAt - Date.now() < 60_000;
  if (!isExpiredOrClose) {
    return token.accessToken;
  }

  if (!token.refreshToken) {
    throw new CalendarReauthRequiredError("Token expired and no refresh token available");
  }

  const config = getCalendarOAuthConfig(token.clientId);
  try {
    const refreshed = await requestToken(
      new URLSearchParams({
        client_id: config.clientId,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      }),
      config.tokenEndpoint,
    );

    const merged: CalendarOAuthToken = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? token.refreshToken,
      expiresAt: refreshed.expiresAt,
      scope: refreshed.scope || token.scope,
      clientId: token.clientId ?? config.clientId,
    };

    await tokenStore.save(merged);
    return merged.accessToken;
  } catch (error) {
    if (error instanceof CalendarReauthRequiredError) {
      await tokenStore.clear();
    }
    throw error;
  }
}

export async function disconnectCalendar(
  tokenStore: CalendarTokenStore = createCalendarTokenStore(),
): Promise<void> {
  const token = await tokenStore.load();
  if (token) {
    try {
      const config = getCalendarOAuthConfig(token.clientId);
      const tokenToRevoke = token.refreshToken ?? token.accessToken;
      if (tokenToRevoke) {
        await fetch(`${config.revocationEndpoint}?token=${encodeURIComponent(tokenToRevoke)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }).catch(() => {});
      }
    } catch {
      // Ignore config lookup error during disconnect
    }
  }
  await tokenStore.clear();
}
