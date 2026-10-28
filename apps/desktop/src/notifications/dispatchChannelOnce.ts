import type {
  CallMeBotSecret,
  ChannelDestinationMeta,
  NotificationPayload,
  NotifyResult,
  SlackSecret,
  TelegramSecret,
  WhatsAppClickSecret,
} from "./channelTypes";
import { loadChannelSecret } from "./channelConfigStore";
import { sendTelegramNotification } from "./adapters/telegramAdapter";
import { sendSlackNotification } from "./adapters/slackAdapter";
import { prepareWhatsAppClickNotification } from "./adapters/whatsappClickAdapter";
import { sendCallMeBotNotification } from "./adapters/callmebotAdapter";

export interface ChannelDispatchOptions {
  fetchImpl?: typeof fetch;
  baseBackoffMs?: number;
  openWhatsAppImmediately?: boolean;
  skipDesktopNative?: boolean;
}

async function sendDesktopNotification(
  payload: NotificationPayload,
  skipNative = false,
): Promise<NotifyResult> {
  if (skipNative) {
    return { ok: true, status: "sent" };
  }
  try {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(payload.title || "DaVinci Notes Reminder", {
        body: payload.text ?? payload.body ?? "",
      });
    }
  } catch {
    // Fallback to in-app toast event
  }
  return { ok: true, status: "sent" };
}

export async function dispatchChannelOnce(
  destination: ChannelDestinationMeta,
  payload: NotificationPayload,
  options?: ChannelDispatchOptions,
): Promise<{ result: NotifyResult; explicitSecrets: string[] }> {
  if (destination.kind === "desktop") {
    const result = await sendDesktopNotification(payload, options?.skipDesktopNative);
    return { result, explicitSecrets: [] };
  }

  if (destination.kind === "telegram") {
    const secret = await loadChannelSecret<TelegramSecret>(destination.id);
    if (!secret?.botToken || !secret?.chatId) {
      return {
        result: {
          ok: false,
          status: "failed",
          retryable: false,
          error: `Missing Telegram credentials in OS keychain for "${destination.name}". Reconnect in Settings.`,
        },
        explicitSecrets: [],
      };
    }
    const result = await sendTelegramNotification(secret, payload, options?.fetchImpl);
    return { result, explicitSecrets: [secret.botToken, secret.chatId] };
  }

  if (destination.kind === "slack") {
    const secret = await loadChannelSecret<SlackSecret>(destination.id);
    if (!secret?.webhookUrl) {
      return {
        result: {
          ok: false,
          status: "failed",
          retryable: false,
          error: `Missing Slack webhook URL in OS keychain for "${destination.name}". Reconnect in Settings.`,
        },
        explicitSecrets: [],
      };
    }
    const result = await sendSlackNotification(secret, payload, {
      destinationAllowMentions: destination.allowChannelMentions,
      fetchImpl: options?.fetchImpl,
      minIntervalMs: options?.baseBackoffMs !== undefined ? 0 : 1000,
    });
    return { result, explicitSecrets: [secret.webhookUrl] };
  }

  if (destination.kind === "whatsapp-click") {
    const secret = await loadChannelSecret<WhatsAppClickSecret>(destination.id);
    if (!secret?.phoneNumber) {
      return {
        result: {
          ok: false,
          status: "failed",
          retryable: false,
          error: `Missing WhatsApp phone number in OS keychain for "${destination.name}".`,
        },
        explicitSecrets: [],
      };
    }
    const result = await prepareWhatsAppClickNotification(secret, payload, {
      openImmediately: options?.openWhatsAppImmediately,
    });
    return { result, explicitSecrets: [secret.phoneNumber] };
  }

  if (destination.kind === "whatsapp-callmebot") {
    const secret = await loadChannelSecret<CallMeBotSecret>(destination.id);
    if (!secret?.phoneNumber || !secret?.apiKey) {
      return {
        result: {
          ok: false,
          status: "failed",
          retryable: false,
          error: `Missing CallMeBot credentials in OS keychain for "${destination.name}".`,
        },
        explicitSecrets: [],
      };
    }
    const result = await sendCallMeBotNotification(secret, payload, {
      fetchImpl: options?.fetchImpl,
      minIntervalMs: options?.baseBackoffMs !== undefined ? 0 : 2000,
    });
    return { result, explicitSecrets: [secret.apiKey, secret.phoneNumber] };
  }

  return {
    result: {
      ok: false,
      status: "failed",
      retryable: false,
      error: `Unsupported channel kind: ${String(destination.kind)}`,
    },
    explicitSecrets: [],
  };
}
