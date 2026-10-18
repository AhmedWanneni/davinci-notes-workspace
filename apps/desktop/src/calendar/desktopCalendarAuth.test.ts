import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CalendarNotConnectedError,
  CalendarReauthRequiredError,
  disconnectCalendar,
  getCalendarAccessToken,
  signInToCalendar,
} from "./desktopCalendarAuth";
import type { CalendarOAuthToken, CalendarTokenStore } from "./calendarTokenStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("./calendarAuthConfig", () => ({
  getCalendarOAuthConfig: () => ({
    clientId: "mock-client-id.apps.googleusercontent.com",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    scopes: [
      "https://www.googleapis.com/auth/calendar.events.readonly",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    ],
  }),
}));

describe("desktopCalendarAuth", () => {
  let storedToken: CalendarOAuthToken | null = null;
  const mockTokenStore: CalendarTokenStore = {
    load: vi.fn(async () => storedToken),
    save: vi.fn(async (t) => {
      storedToken = t;
    }),
    clear: vi.fn(async () => {
      storedToken = null;
    }),
  };

  beforeEach(() => {
    storedToken = null;
    vi.clearAllMocks();
  });

  it("throws CalendarNotConnectedError when token is missing", async () => {
    await expect(getCalendarAccessToken(mockTokenStore)).rejects.toThrow(
      CalendarNotConnectedError,
    );
  });

  it("returns active token without refresh when not expired", async () => {
    storedToken = {
      accessToken: "active-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 300_000,
      scope: "read",
    };

    const token = await getCalendarAccessToken(mockTokenStore);
    expect(token).toBe("active-access-token");
  });

  it("silently refreshes token when close to expiry", async () => {
    storedToken = {
      accessToken: "expiring-token",
      refreshToken: "valid-refresh-token",
      expiresAt: Date.now() + 30_000, // 30s remaining (< 60s)
      scope: "read",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "new-access-token",
        expires_in: 3600,
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const token = await getCalendarAccessToken(mockTokenStore);
    expect(token).toBe("new-access-token");
    expect(mockTokenStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "new-access-token",
        refreshToken: "valid-refresh-token",
      }),
    );
  });

  it("clears token store when refresh returns invalid_grant", async () => {
    storedToken = {
      accessToken: "expiring-token",
      refreshToken: "revoked-refresh-token",
      expiresAt: Date.now() + 10_000,
      scope: "read",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_grant",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(getCalendarAccessToken(mockTokenStore)).rejects.toThrow(
      CalendarReauthRequiredError,
    );
    expect(mockTokenStore.clear).toHaveBeenCalled();
  });

  it("disconnectCalendar revokes token and clears store", async () => {
    storedToken = {
      accessToken: "token-to-revoke",
      refreshToken: "refresh-to-revoke",
      expiresAt: Date.now() + 100_000,
      scope: "read",
    };

    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await disconnectCalendar(mockTokenStore);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("token=refresh-to-revoke"),
      expect.any(Object),
    );
    expect(mockTokenStore.clear).toHaveBeenCalled();
    expect(storedToken).toBeNull();
  });

  it("signInToCalendar completes PKCE loopback exchange", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === "start_oauth_listener") {
        return { port: 8089, redirect_uri: "http://127.0.0.1:8089" };
      }
      if (cmd === "wait_for_oauth_callback") {
        return { code: "auth-code-123", state: capturedState };
      }
      return null;
    });

    let capturedState = "";
    const openUrl = vi.fn(async (urlStr: string) => {
      const u = new URL(urlStr);
      capturedState = u.searchParams.get("state") || "";
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "exchanged-access-token",
        refresh_token: "exchanged-refresh-token",
        expires_in: 3600,
        scope: "calendar.events.readonly",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const token = await signInToCalendar(openUrl, mockTokenStore);
    expect(token.accessToken).toBe("exchanged-access-token");
    expect(token.refreshToken).toBe("exchanged-refresh-token");
    expect(mockTokenStore.save).toHaveBeenCalled();
  });

  it("signInToCalendar throws on state mismatch", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === "start_oauth_listener") {
        return { port: 8089, redirect_uri: "http://127.0.0.1:8089" };
      }
      if (cmd === "wait_for_oauth_callback") {
        return { code: "auth-code-123", state: "tampered-state" };
      }
      return null;
    });

    const openUrl = vi.fn(async () => {});
    await expect(signInToCalendar(openUrl, mockTokenStore)).rejects.toThrow(
      "calendar-oauth-state-mismatch",
    );
  });
});
