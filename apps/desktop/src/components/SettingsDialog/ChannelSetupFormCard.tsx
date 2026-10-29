import React, { useState } from "react";
import { Button, Checkbox, Input } from "@app/design-system";
import {
  isValidSlackWebhookUrl,
  isValidWhatsAppPhone,
  normalizeWhatsAppPhone,
  type ChannelDestinationMeta,
  type ChannelKind,
  type ChannelSecretPayload,
} from "../../notifications";
import { ChannelPrivacyGuide } from "./ChannelPrivacyGuide";
import { ChannelCredentialFields } from "./ChannelCredentialFields";
import styles from "./NotificationsSettingsTab.module.scss";

export interface ChannelSetupFormCardProps {
  kind: Exclude<ChannelKind, "desktop">;
  onSave: (
    destination: ChannelDestinationMeta,
    secret: ChannelSecretPayload,
  ) => Promise<void>;
  onCancel: () => void;
  onOpenDocsUrl: (url: string) => void;
}

export function ChannelSetupFormCard({
  kind,
  onSave,
  onCancel,
  onOpenDocsUrl,
}: ChannelSetupFormCardProps) {
  const [name, setName] = useState(() => {
    if (kind === "telegram") return "Personal Telegram Bot";
    if (kind === "slack") return "#team";
    if (kind === "whatsapp-click") return "My WhatsApp (Click-to-Chat)";
    return "My WhatsApp (CallMeBot)";
  });
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [allowMentions, setAllowMentions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConnect = async () => {
    setError(null);
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter a name for this channel destination.");
      return;
    }

    const id = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let secret: ChannelSecretPayload;
    let recipientHint = "";

    if (kind === "telegram") {
      if (!botToken.trim().includes(":") || !chatId.trim()) {
        setError(
          "Enter a valid BotFather token (e.g. 123456:ABC-DEF...) and Chat ID.",
        );
        return;
      }
      secret = { botToken: botToken.trim(), chatId: chatId.trim() };
      recipientHint = `Chat ${chatId.trim()}`;
    } else if (kind === "slack") {
      if (!isValidSlackWebhookUrl(webhookUrl)) {
        setError(
          "Slack Webhook URL must start with https://hooks.slack.com/services/.",
        );
        return;
      }
      secret = { webhookUrl: webhookUrl.trim() };
      recipientHint = "Incoming Webhook";
    } else if (kind === "whatsapp-click") {
      if (!isValidWhatsAppPhone(phoneNumber)) {
        setError(
          "Enter a valid international phone number (7–15 digits, e.g. +14155550199).",
        );
        return;
      }
      const digits = normalizeWhatsAppPhone(phoneNumber);
      secret = { phoneNumber: digits };
      recipientHint = `+${digits} (Manual send)`;
    } else {
      if (!isValidWhatsAppPhone(phoneNumber) || !apiKey.trim()) {
        setError("Enter both your international phone number and CallMeBot API key.");
        return;
      }
      secret = { phoneNumber: phoneNumber.trim(), apiKey: apiKey.trim() };
      recipientHint = "Experimental third-party";
    }

    setSaving(true);
    try {
      await onSave(
        {
          id,
          kind,
          name: cleanName,
          enabled: true,
          isDefaultForReminders: isDefault,
          status: "unverified",
          recipientHint,
          allowChannelMentions: kind === "slack" ? allowMentions : false,
          lastError: null,
          lastTestedAt: null,
          createdAt: Date.now(),
        },
        secret,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save channel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles["setup-card"]} role="region" aria-label={`Connect ${kind}`}>
      <ChannelPrivacyGuide kind={kind} onOpenDocsUrl={onOpenDocsUrl} />

      <div className={styles["form-grid"]}>
        <label className={styles["field-label"]}>
          <span>Destination Name</span>
          <Input
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. #team, My DM, Personal Bot"
            aria-label="Destination Name"
          />
        </label>

        <ChannelCredentialFields
          kind={kind}
          botToken={botToken}
          setBotToken={setBotToken}
          chatId={chatId}
          setChatId={setChatId}
          webhookUrl={webhookUrl}
          setWebhookUrl={setWebhookUrl}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      </div>

      <div className={styles["checkbox-group"]}>
        <label className={styles["default-toggle"]}>
          <Checkbox
            checked={isDefault}
            onCheckedChange={(v) => setIsDefault(Boolean(v))}
          />
          <span>Use by default for new reminders</span>
        </label>
        {kind === "slack" && (
          <label className={styles["default-toggle"]}>
            <Checkbox
              checked={allowMentions}
              onCheckedChange={(v) => setAllowMentions(Boolean(v))}
            />
            <span>Allow @channel / @here mentions on scheduled messages</span>
          </label>
        )}
      </div>

      {error && (
        <div className={styles["error-box"]} role="alert">
          {error}
        </div>
      )}

      <div className={styles["setup-actions"]}>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => void handleConnect()}
          disabled={saving}
        >
          {saving ? "Connecting..." : "Save & Connect"}
        </Button>
      </div>
    </div>
  );
}
