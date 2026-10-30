import React from "react";
import { Input } from "@app/design-system";
import type { ChannelKind } from "../../notifications";
import styles from "./NotificationsSettingsTab.module.scss";

export interface ChannelCredentialFieldsProps {
  kind: Exclude<ChannelKind, "desktop">;
  botToken: string;
  setBotToken: (v: string) => void;
  chatId: string;
  setChatId: (v: string) => void;
  webhookUrl: string;
  setWebhookUrl: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
}

export function ChannelCredentialFields({
  kind,
  botToken,
  setBotToken,
  chatId,
  setChatId,
  webhookUrl,
  setWebhookUrl,
  phoneNumber,
  setPhoneNumber,
  apiKey,
  setApiKey,
}: ChannelCredentialFieldsProps) {
  return (
    <>
      {kind === "telegram" && (
        <>
          <label className={styles["field-label"]}>
            <span>Bot Token (stored in OS Keychain)</span>
            <Input
              size="sm"
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:AAH_..."
              aria-label="Telegram Bot Token"
            />
          </label>
          <label className={styles["field-label"]}>
            <span>Chat ID (personal ID or group -100...)</span>
            <Input
              size="sm"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 987654321 or -100123456789"
              aria-label="Telegram Chat ID"
            />
          </label>
        </>
      )}

      {kind === "slack" && (
        <label className={styles["field-label"]}>
          <span>Slack Webhook URL (stored in OS Keychain)</span>
          <Input
            size="sm"
            type="password"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/T.../B.../..."
            aria-label="Slack Webhook URL"
          />
        </label>
      )}

      {(kind === "whatsapp-click" || kind === "whatsapp-callmebot") && (
        <label className={styles["field-label"]}>
          <span>Phone Number (International format, stored in OS Keychain)</span>
          <Input
            size="sm"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+14155550199"
            aria-label="WhatsApp Phone Number"
          />
        </label>
      )}

      {kind === "whatsapp-callmebot" && (
        <label className={styles["field-label"]}>
          <span>CallMeBot API Key (stored in OS Keychain)</span>
          <Input
            size="sm"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="123456"
            aria-label="CallMeBot API Key"
          />
        </label>
      )}
    </>
  );
}
