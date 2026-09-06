import { describe, expect, it } from "vitest";
import { AIProviderError } from "@app/ai-api";
import { providerValidationFailure, providerValidationFailureMessage } from "./providerValidationFailure";

describe("providerValidationFailure", () => {
  it("keeps an insufficient-credit response distinct from a rejected key", () => {
    const failure = providerValidationFailure(new AIProviderError("insufficient-credits", "Payment Required"));
    expect(failure).toBe("insufficient-credits");
    expect(providerValidationFailureMessage("OpenRouter", failure)).toContain("no available credits");
  });

  it("does not persist an arbitrary thrown message", () => {
    expect(providerValidationFailure(new Error("secret-bearing error"))).toBe("unknown");
  });
});
