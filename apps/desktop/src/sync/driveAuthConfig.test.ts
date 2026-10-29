import { beforeEach, describe, expect, it } from "vitest";
import {
  getDriveClientId,
  getDriveClientSecret,
  getDriveOAuthConfig,
  setDynamicDriveClientId,
  setDynamicDriveClientSecret,
} from "./driveAuthConfig";

describe("driveAuthConfig", () => {
  beforeEach(() => {
    setDynamicDriveClientId(null);
    setDynamicDriveClientSecret(null);
  });

  it("resolves configured client ID from environment or dynamic setting", () => {
    setDynamicDriveClientId("custom-client-id.apps.googleusercontent.com");
    expect(getDriveClientId()).toBe("custom-client-id.apps.googleusercontent.com");

    const config = getDriveOAuthConfig();
    expect(config.clientId).toBe("custom-client-id.apps.googleusercontent.com");
    expect(config.authorizationEndpoint).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(config.tokenEndpoint).toBe("https://oauth2.googleapis.com/token");
  });

  it("resolves client secret from environment or dynamic setting", () => {
    setDynamicDriveClientId("base-id");
    setDynamicDriveClientSecret("mock-secret-xyz");
    expect(getDriveClientSecret()).toBe("mock-secret-xyz");

    const config = getDriveOAuthConfig();
    expect(config.clientSecret).toBe("mock-secret-xyz");
  });

  it("prefers explicit custom client ID passed to getDriveOAuthConfig", () => {
    setDynamicDriveClientId("base-id");
    const config = getDriveOAuthConfig("explicit-id");
    expect(config.clientId).toBe("explicit-id");
  });
});
