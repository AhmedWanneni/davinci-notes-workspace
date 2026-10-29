export type ChannelKind =
  | "desktop"
  | "telegram"
  | "slack"
  | "whatsapp-click"
  | "whatsapp-callmebot";

export type DeliveryChannel = ChannelKind;

export type ChannelConnectionStatus = "connected" | "error" | "unverified";

export interface ChannelDestinationMeta {
  id: string;
  kind: ChannelKind;
  name: string;
  enabled: boolean;
  isDefaultForReminders: boolean;
  status: ChannelConnectionStatus;
  recipientHint?: string;
  allowChannelMentions?: boolean;
  lastError?: string | null;
  lastTestedAt?: number | null;
  createdAt: number;
}

export interface TelegramSecret {
  botToken: string;
  chatId: string;
}

export interface SlackSecret {
  webhookUrl: string;
}

export interface WhatsAppClickSecret {
  phoneNumber: string;
}

export interface CallMeBotSecret {
  phoneNumber: string;
  apiKey: string;
}

export type ChannelSecretPayload =
  | TelegramSecret
  | SlackSecret
  | WhatsAppClickSecret
  | CallMeBotSecret;

export interface NotificationPayload {
  title?: string;
  text?: string;
  body?: string;
  recipient?: string;
  sourceKind?: "reminder" | "scheduled-message" | "test";
  notePath?: string;
  line?: number;
  allowChannelMentions?: boolean;
}

export interface NotifyResult {
  ok: boolean;
  success?: boolean;
  status: "sent" | "needs_manual_send" | "failed";
  manualActionUrl?: string;
  error?: string;
  retryable?: boolean;
  retryAfterMs?: number;
}

export const DEFAULT_DESKTOP_DESTINATION: ChannelDestinationMeta = {
  id: "desktop-default",
  kind: "desktop",
  name: "Desktop Notification",
  enabled: true,
  isDefaultForReminders: true,
  status: "connected",
  recipientHint: "This computer",
  lastError: null,
  lastTestedAt: null,
  createdAt: 0,
};
