import type Database from "@tauri-apps/plugin-sql";
import type {
  ChannelDestinationMeta,
  NotificationPayload,
  NotifyResult,
} from "./channelTypes";
import {
  emitNotificationLog,
  upsertChannelDestination,
  loadChannelDestinations,
} from "./channelConfigStore";
import { redactSecrets } from "./secretRedactor";
import { dispatchChannelOnce, type ChannelDispatchOptions } from "./dispatchChannelOnce";

export interface NotifyOptions extends ChannelDispatchOptions {
  maxRetries?: number;
  dbOverride?: Database;
}

/**
 * Unified notification dispatcher with exponential backoff (`1s`, `2s`, `4s`),
 * automatic keychain lookup, secret redaction, and status/log persistence.
 */
export async function notify(
  target: ChannelDestinationMeta | string,
  rawPayload: NotificationPayload,
  options?: NotifyOptions,
): Promise<NotifyResult> {
  const payload: NotificationPayload = {
    ...rawPayload,
    text: rawPayload.text ?? rawPayload.body ?? "",
    sourceKind: rawPayload.sourceKind ?? "reminder",
  };

  let destination: ChannelDestinationMeta;
  if (typeof target === "string") {
    const list = await loadChannelDestinations(options?.dbOverride);
    const found = list.find((d) => d.id === target || d.kind === target);
    if (found) {
      destination = found;
    } else {
      let kind = target as ChannelDestinationMeta["kind"];
      if (target === "whatsapp") kind = "whatsapp-click";
      if (target === "callmebot") kind = "whatsapp-callmebot";
      destination = {
        id: target,
        kind,
        name: target,
        enabled: true,
        isDefaultForReminders: false,
        status: "connected",
        createdAt: Date.now(),
      };
    }
  } else {
    destination = target;
  }

  const maxRetries = options?.maxRetries ?? 2;
  const baseBackoffMs = options?.baseBackoffMs ?? 1000;

  let lastResult: NotifyResult = {
    ok: false,
    status: "failed",
    error: "Notification dispatch did not run",
  };
  let secretsToRedact: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { result, explicitSecrets } = await dispatchChannelOnce(
      destination,
      payload,
      options,
    );
    lastResult = result;
    secretsToRedact = explicitSecrets;

    if (result.ok || !result.retryable || attempt === maxRetries) {
      break;
    }

    const delayMs =
      result.retryAfterMs ?? baseBackoffMs * Math.pow(2, attempt);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const safeError = lastResult.error
    ? redactSecrets(lastResult.error, secretsToRedact)
    : undefined;

  if (lastResult.ok) {
    emitNotificationLog(
      `Delivered ${payload.sourceKind} via ${destination.name} (${destination.kind}): ${lastResult.status}`,
      secretsToRedact,
    );
    if (destination.kind !== "desktop") {
      await upsertChannelDestination(
        {
          ...destination,
          status: "connected",
          lastError: null,
          lastTestedAt:
            payload.sourceKind === "test"
              ? Date.now()
              : destination.lastTestedAt,
        },
        undefined,
        options?.dbOverride,
      ).catch(() => {});
    }
    return { ...lastResult, success: true, error: undefined };
  }

  const finalError = safeError || "Delivery failed";
  emitNotificationLog(
    `Delivery failed on ${destination.name} (${destination.kind}): ${finalError}`,
    secretsToRedact,
  );
  if (destination.kind !== "desktop") {
    await upsertChannelDestination(
      {
        ...destination,
        status: "error",
        lastError: finalError,
      },
      undefined,
      options?.dbOverride,
    ).catch(() => {});
  }

  return {
    ...lastResult,
    success: false,
    error: finalError,
  };
}
