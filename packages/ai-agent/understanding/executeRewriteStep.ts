import {
  REWRITE_SYSTEM_PROMPT,
  REWRITE_RETRY_PROMPT,
  parseRewriteResponse,
} from "./rewritePrompt.js";
import type { StructuredUserRequest } from "./rewriteSchema.js";

export interface RewriteStepLogger {
  log?(message: string, meta?: unknown): void;
}

export async function executeRewriteStep(
  rawMessage: string,
  callModel: (prompt: string, isRetry?: boolean) => Promise<string>,
  logger?: RewriteStepLogger,
): Promise<StructuredUserRequest> {
  const fallbackRequest: StructuredUserRequest = {
    goal: rawMessage.trim(),
    intent: "chat",
    target: null,
    constraints: [],
    ambiguities: [],
  };

  const initialPrompt = `${REWRITE_SYSTEM_PROMPT}\n\nUser Message:\n"${rawMessage}"`;

  try {
    const firstResponse = await callModel(initialPrompt, false);
    const firstResult = parseRewriteResponse(firstResponse);

    if (firstResult.success) {
      return firstResult.data;
    }

    logger?.log?.(
      "Rewrite step validation failed on first attempt, retrying once",
      {
        error: firstResult.error,
        rawOutput: firstResponse,
      },
    );

    const retryPrompt = `${REWRITE_RETRY_PROMPT}\n\nOriginal User Message:\n"${rawMessage}"\n\nValidation Error:\n${firstResult.error}`;
    const retryResponse = await callModel(retryPrompt, true);
    const retryResult = parseRewriteResponse(retryResponse);

    if (retryResult.success) {
      return retryResult.data;
    }

    logger?.log?.(
      "Rewrite step retry also failed, falling back to raw message",
      {
        error: retryResult.error,
        retryOutput: retryResponse,
      },
    );
    return fallbackRequest;
  } catch (err) {
    logger?.log?.("Rewrite step thrown error, falling back to raw message", {
      err,
    });
    return fallbackRequest;
  }
}
