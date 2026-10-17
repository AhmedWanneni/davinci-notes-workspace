import { describe, it, expect } from "vitest";
import { encodePayload, decodePayload } from "../src/base64Payload";

describe("base64Payload", () => {
  it("encodes and decodes strings with newlines and control characters", () => {
    const original = "# Heading\n\nParagraph with `code` and ${expr} and \"quotes\"\nLine 2\r\nLine 3\tTabbed";
    const encoded = encodePayload(original);
    expect(encoded.startsWith("b64:")).toBe(true);
    // Encoded string must not contain raw newlines or control characters
    expect(encoded).not.toContain("\n");
    expect(encoded).not.toContain("\r");
    expect(encoded).not.toContain("`");
    expect(encoded).not.toContain("${");

    const decoded = decodePayload(encoded);
    expect(decoded).toBe(original);
  });

  it("handles empty or falsy inputs gracefully", () => {
    expect(encodePayload("")).toBe("");
    expect(decodePayload("")).toBe("");
    expect(decodePayload("plain text")).toBe("plain text");
  });

  it("safely round-trips unicode and emojis", () => {
    const unicodeText = "Notes 📝 with 日本語, العربية, and 🚀";
    const encoded = encodePayload(unicodeText);
    const decoded = decodePayload(encoded);
    expect(decoded).toBe(unicodeText);
  });
});
