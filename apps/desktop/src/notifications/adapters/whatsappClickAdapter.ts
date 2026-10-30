import type {
  NotificationPayload,
  NotifyResult,
  WhatsAppClickSecret,
} from "../channelTypes";

/**
 * Normalizes an international phone number to E.164 digits without `+` or punctuation,
 * as required by `https://wa.me/<number>`.
 */
export function normalizeWhatsAppPhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function isValidWhatsAppPhone(raw: string): boolean {
  const digits = normalizeWhatsAppPhone(raw);
  return digits.length >= 7 && digits.length <= 15;
}

export function buildWhatsAppClickUrl(
  phoneRaw: string,
  text: string,
): string | null {
  const digits = normalizeWhatsAppPhone(phoneRaw);
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${digits}?text=${encodedText}`;
}

export async function openWhatsAppClickUrl(url: string): Promise<boolean> {
  if (!url.startsWith("https://wa.me/")) {
    throw new Error("Refusing to open non-WhatsApp click-to-chat URL");
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_external_url", { url });
    return true;
  } catch {
    if (typeof window !== "undefined" && typeof window.open === "function") {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  }
}

export async function openWhatsAppClickToChat(phoneRaw: string, text: string): Promise<boolean> {
  const url = buildWhatsAppClickUrl(phoneRaw, text);
  if (!url) return false;
  return openWhatsAppClickUrl(url);
}

/**
 * Prepares a WhatsApp Click-to-Chat URL (`https://wa.me/<digits>?text=<encoded>`).
 * Because WhatsApp requires the user to click Send manually, automated triggers
 * return `status: "needs_manual_send"` with `manualActionUrl` so the toast/row
 * can present a 1-click "Send on WhatsApp" button. When `openImmediately` is true
 * (e.g., user clicked "Send on WhatsApp" or "Send test message"), opens the URL immediately.
 */
export async function prepareWhatsAppClickNotification(
  secret: WhatsAppClickSecret,
  payload: NotificationPayload,
  options?: { openImmediately?: boolean },
): Promise<NotifyResult> {
  const rawText = payload.text ?? payload.body ?? "";
  const fullText = payload.title
    ? `${payload.title}: ${rawText}`
    : rawText;
  const url = buildWhatsAppClickUrl(secret.phoneNumber, fullText);

  if (!url) {
    return {
      ok: false,
      status: "failed",
      retryable: false,
      error:
        "Invalid WhatsApp phone number. Enter a full international number (7–15 digits, e.g. +14155550199).",
    };
  }

  if (options?.openImmediately || payload.sourceKind === "test") {
    await openWhatsAppClickUrl(url);
    return {
      ok: true,
      status: "sent",
      manualActionUrl: url,
    };
  }

  return {
    ok: true,
    status: "needs_manual_send",
    manualActionUrl: url,
  };
}
