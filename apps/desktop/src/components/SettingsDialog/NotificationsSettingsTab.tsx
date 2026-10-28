import React, { useCallback, useEffect, useState } from "react";
import { Button, Typography } from "@app/design-system";
import {
  ChatCircleText,
  Flask,
  Plus,
  WhatsappLogo,
} from "@phosphor-icons/react";
import {
  loadChannelDestinations,
  notify,
  removeChannelDestination,
  upsertChannelDestination,
  type ChannelDestinationMeta,
  type ChannelKind,
  type ChannelSecretPayload,
} from "../../notifications";
import { SettingsCard } from "./SettingsCard";
import { ChannelSetupFormCard } from "./ChannelSetupFormCard";
import { NotificationDestinationRow } from "./NotificationDestinationRow";
import settingStyles from "./SettingsDialog.module.scss";
import styles from "./NotificationsSettingsTab.module.scss";

export function NotificationsSettingsTab() {
  const [destinations, setDestinations] = useState<ChannelDestinationMeta[]>([]);
  const [addingKind, setAddingKind] = useState<Exclude<ChannelKind, "desktop"> | null>(
    null,
  );
  const [showExperimental, setShowExperimental] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<
    Record<string, { ok: boolean; text: string }>
  >({});

  const refresh = useCallback(async () => {
    const loaded = await loadChannelDestinations();
    setDestinations(loaded);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleOpenDocsUrl = useCallback((url: string) => {
    void (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("open_external_url", { url });
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    })();
  }, []);

  const handleSaveNew = async (
    dest: ChannelDestinationMeta,
    secret: ChannelSecretPayload,
  ) => {
    const updated = await upsertChannelDestination(dest, secret);
    setDestinations(updated);
    setAddingKind(null);
  };

  const handleToggleDefault = async (
    dest: ChannelDestinationMeta,
    isDefault: boolean,
  ) => {
    const updated = await upsertChannelDestination({
      ...dest,
      isDefaultForReminders: isDefault,
    });
    setDestinations(updated);
  };

  const handleRemove = async (id: string) => {
    const updated = await removeChannelDestination(id);
    setDestinations(updated);
    setTestFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSendTest = async (dest: ChannelDestinationMeta) => {
    setTestingId(dest.id);
    try {
      const res = await notify(
        dest,
        {
          title: "DaVinci Notes Test",
          text: `Test notification to "${dest.name}" succeeded.`,
          sourceKind: "test",
        },
        { maxRetries: 0, openWhatsAppImmediately: true },
      );
      await refresh();
      setTestFeedback((prev) => ({
        ...prev,
        [dest.id]: {
          ok: res.ok,
          text: res.ok
            ? dest.kind === "whatsapp-click"
              ? "Opened WhatsApp prefilled link. Press Send in WhatsApp."
              : "Test message sent!"
            : res.error || "Test failed.",
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className={settingStyles["settings-tab-content"]}>
      <SettingsCard
        title="Notification Channels"
        description="Configure where reminders and scheduled messages are delivered. Desktop notifications are always available. External channel credentials are stored exclusively in your OS keychain (never in your vault or logs). Note: The scheduler runs inside the desktop app — keep DaVinci Notes open or minimized to the system tray for timely delivery."
      >
        <div className={styles["add-channel-toolbar"]}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddingKind("telegram")}
          >
            <Plus size={13} />
            <span>Add Telegram Bot</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddingKind("slack")}
          >
            <Plus size={13} />
            <span>Add Slack Webhook</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddingKind("whatsapp-click")}
          >
            <WhatsappLogo size={14} />
            <span>Add WhatsApp (Click-to-Chat)</span>
          </Button>
        </div>

        {addingKind && (
          <ChannelSetupFormCard
            kind={addingKind}
            onSave={handleSaveNew}
            onCancel={() => setAddingKind(null)}
            onOpenDocsUrl={handleOpenDocsUrl}
          />
        )}

        <div className={styles["destinations-list"]} role="list">
          {destinations.map((dest) => (
            <NotificationDestinationRow
              key={dest.id}
              destination={dest}
              feedback={testFeedback[dest.id]}
              isTesting={testingId === dest.id}
              onToggleDefault={(d, v) => void handleToggleDefault(d, v)}
              onSendTest={(d) => void handleSendTest(d)}
              onRemove={(id) => void handleRemove(id)}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Experimental Channels"
        description="Optional third-party integrations that are off by default."
      >
        <div className={styles["experimental-row"]}>
          <div className={styles["experimental-info"]}>
            <Flask size={16} />
            <div>
              <Typography variant="text" size="sm" weight="medium">
                WhatsApp via CallMeBot (Experimental, Third-Party)
              </Typography>
              <Typography variant="text" size="xs" color="muted">
                Sends automated WhatsApp messages to your own phone number via
                api.callmebot.com. Message text passes through their server.
              </Typography>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setShowExperimental(true);
              setAddingKind("whatsapp-callmebot");
            }}
          >
            <ChatCircleText size={14} />
            <span>
              {showExperimental ? "Configure CallMeBot" : "Enable CallMeBot"}
            </span>
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
