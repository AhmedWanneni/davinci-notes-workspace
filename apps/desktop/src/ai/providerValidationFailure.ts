import { AIProviderError } from "@app/ai-api";

export type ProviderValidationFailure = "authentication" | "insufficient-credits" | "rate-limited" | "network" | "unavailable" | "invalid-request" | "unknown";

export function providerValidationFailure(error: unknown): ProviderValidationFailure {
  if (!(error instanceof AIProviderError)) return "unknown";
  return error.code === "local-server-unavailable" ? "unavailable" : error.code;
}

export function providerValidationFailureMessage(providerName: string, failure: ProviderValidationFailure | null): string {
  switch (failure) {
    case "authentication": return `${providerName} rejected the API key. Create a new key and reconnect.`;
    case "insufficient-credits": return `${providerName} could not run the embedding check because the account has no available credits.`;
    case "rate-limited": return `${providerName} is rate-limiting validation. Wait a moment, then reconnect.`;
    case "network": return `Could not reach ${providerName}. Check your network connection, then reconnect.`;
    case "unavailable": return `${providerName} is temporarily unavailable. Try again shortly.`;
    case "invalid-request": return `${providerName} rejected the selected model or validation request. Check the provider model settings.`;
    default: return `Could not validate ${providerName}. Reconnect and try again.`;
  }
}
