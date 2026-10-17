import { describe, expect, it } from "vitest";
import { redactApiKey, sanitizeError } from "./redact";

describe("redact utilities", () => {
  const secret = "my-super-secret-syncthing-api-key-12345";

  it("redacts API keys to [REDACTED]", () => {
    expect(redactApiKey(secret)).toBe("[REDACTED]");
    expect(redactApiKey("")).toBe("");
    expect(redactApiKey(null)).toBe("");
    expect(redactApiKey(undefined)).toBe("");
  });

  it("sanitizes error messages containing the API key", () => {
    const errorMsg = `HTTP 403 request failed with X-API-Key: ${secret} on 127.0.0.1:8384`;
    expect(sanitizeError(errorMsg, secret)).toBe(
      "HTTP 403 request failed with X-API-Key: [REDACTED] on 127.0.0.1:8384",
    );

    const err = new Error(`Connection error with token ${secret}`);
    expect(sanitizeError(err, secret)).toBe(
      "Connection error with token [REDACTED]",
    );
  });

  it("leaves error unchanged if no api key is provided", () => {
    const msg = "Network timeout";
    expect(sanitizeError(msg, "")).toBe(msg);
    expect(sanitizeError(msg, null)).toBe(msg);
  });
});
