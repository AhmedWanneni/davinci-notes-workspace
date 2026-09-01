import { describe, expect, it, vi } from "vitest";
import {
  DRIVE_APPDATA_SCOPE,
  DRIVE_FILE_SCOPE,
  DriveReauthRequiredError,
  DriveTokenManager,
  startDriveLogin,
} from "./driveAuth";

const token = {
  accessToken: "old",
  refreshToken: "refresh",
  expiresAt: 0,
  scope: "scope",
};
function store(initial = token) {
  let current = initial;
  return {
    load: vi.fn(async () => current),
    save: vi.fn(async (next) => {
      current = next;
    }),
    clear: vi.fn(async () => {
      current = null as never;
    }),
  };
}

describe("Drive OAuth", () => {
  it("creates a PKCE URL with additive Drive file and app-data scopes", async () => {
    const result = await startDriveLogin(
      {
        clientId: "desktop-id",
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        redirectUri: "http://127.0.0.1/callback",
        state: "state",
      },
      {
        randomBytes: () => new Uint8Array(32).fill(7),
        sha256: async () => new Uint8Array(32).fill(9),
      },
    );
    const url = new URL(result.authorizationUrl);
    expect(url.searchParams.get("scope")).toBe(
      `${DRIVE_FILE_SCOPE} ${DRIVE_APPDATA_SCOPE}`,
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("client_secret")).toBeNull();
  });

  it("refreshes near-expiry access tokens and preserves refresh token", async () => {
    const saved = store();
    const transport = {
      exchangeCode: vi.fn(),
      refresh: vi.fn(async () => ({
        accessToken: "new",
        expiresAt: 9_999_999,
        scope: "scope",
      })),
    };
    const manager = new DriveTokenManager(saved, transport, () => 9_000_000);
    expect(await manager.getAccessToken()).toBe("new");
    expect(saved.save).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: "refresh" }),
    );
  });

  it("clears storage and exposes a re-auth path when refresh fails", async () => {
    const saved = store();
    const manager = new DriveTokenManager(
      saved,
      {
        exchangeCode: vi.fn(),
        refresh: vi.fn(async () => {
          throw new DriveReauthRequiredError();
        }),
      },
      () => 9_000_000,
    );
    await expect(manager.getAccessToken()).rejects.toThrow(
      "drive-reauth-required",
    );
    expect(saved.clear).toHaveBeenCalled();
  });

  it("keeps tokens when refresh fails transiently", async () => {
    const saved = store();
    const manager = new DriveTokenManager(
      saved,
      {
        exchangeCode: vi.fn(),
        refresh: vi.fn(async () => {
          throw new Error("offline");
        }),
      },
      () => 9_000_000,
    );
    await expect(manager.getAccessToken()).rejects.toThrow(
      "drive-refresh-failed",
    );
    expect(saved.clear).not.toHaveBeenCalled();
  });
});
